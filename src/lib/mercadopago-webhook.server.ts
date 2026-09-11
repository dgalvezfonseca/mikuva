import "@tanstack/react-start/server-only";

import process from "node:process";

import { and, eq, isNotNull, or } from "drizzle-orm";
import { InvalidWebhookSignatureError, WebhookSignatureValidator } from "mercadopago";

import { getDatabase } from "@/db/index.server";
import { orders, paymentEvents, payments } from "@/db/schema";
import {
  mapMercadoPagoStatus,
  mercadoPagoNotificationSchema,
  mercadoPagoPaymentSchema,
  reconcileLocalPaymentStatus,
  resolvePaymentTransition,
  validatePaymentAgainstLocal,
  type MercadoPagoNotification,
  type MercadoPagoPayment,
} from "@/lib/mercadopago-webhook-core";
import { getMercadoPagoPayment } from "@/lib/mercadopago.server";
import { sendPurchaseConfirmationEmailForMercadoPagoPayment } from "@/lib/purchase-confirmation-email.server";

const SIGNATURE_TOLERANCE_SECONDS = 300;
const MAX_WEBHOOK_BODY_BYTES = 64 * 1024;
const MIKUVA_FOLIO_PATTERN = /^MK-\d{4}-\d{5}$/;

type SynchronizationResult = {
  result: "processed" | "duplicate" | "rejected";
  status: string;
  folio?: string;
};

type WebhookDependencies = {
  getSecret: () => string;
  getPayment: (paymentId: string) => Promise<unknown>;
  synchronize: (
    notification: MercadoPagoNotification,
    payment: MercadoPagoPayment,
  ) => Promise<SynchronizationResult>;
  now?: () => number;
};

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function getWebhookSecret(): string {
  return requiredEnvironment("MERCADOPAGO_WEBHOOK_SECRET");
}

function getPaymentValidationConfiguration(): {
  expectedLiveMode: boolean | undefined;
  expectedCollectorId: string | undefined;
} {
  const environment = process.env["MERCADOPAGO_ENV"];
  return {
    expectedLiveMode:
      environment === "production" ? true : environment === "test" ? false : undefined,
    expectedCollectorId: process.env["MERCADOPAGO_COLLECTOR_ID"]?.trim() || undefined,
  };
}

function isDuplicateEntry(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY"
  );
}

async function recordEvent(input: {
  notification: MercadoPagoNotification;
  paymentId: string;
  processedStatus: string;
}): Promise<void> {
  const db = getDatabase();
  await db.insert(paymentEvents).values({
    provider: "mercadopago",
    providerEventKey: input.notification.id,
    providerPaymentId: input.paymentId,
    eventType: input.notification.type,
    action: input.notification.action ?? input.notification.type,
    processedStatus: input.processedStatus,
  });
}

async function finishSynchronization(
  paymentId: string,
  result: SynchronizationResult,
): Promise<SynchronizationResult> {
  await sendPurchaseConfirmationEmailForMercadoPagoPayment(paymentId);
  return result;
}

export async function synchronizeMercadoPagoPayment(
  notification: MercadoPagoNotification,
  payment: MercadoPagoPayment,
): Promise<SynchronizationResult> {
  const db = getDatabase();
  const paymentValidationConfiguration = getPaymentValidationConfiguration();
  const [alreadyProcessed] = await db
    .select({ id: paymentEvents.id, processedStatus: paymentEvents.processedStatus })
    .from(paymentEvents)
    .where(
      and(
        eq(paymentEvents.provider, "mercadopago"),
        eq(paymentEvents.providerEventKey, notification.id),
      ),
    )
    .limit(1);

  if (alreadyProcessed) {
    return finishSynchronization(payment.id, {
      result: "duplicate",
      status: alreadyProcessed.processedStatus,
    });
  }

  if (!MIKUVA_FOLIO_PATTERN.test(payment.external_reference)) {
    try {
      await recordEvent({
        notification,
        paymentId: payment.id,
        processedStatus: "rejected:external_reference_mismatch",
      });
    } catch (error) {
      if (!isDuplicateEntry(error)) throw error;
      return finishSynchronization(payment.id, {
        result: "duplicate",
        status: "already_processed",
      });
    }
    return finishSynchronization(payment.id, {
      result: "rejected",
      status: "external_reference_mismatch",
    });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [duplicate] = await tx
        .select({ id: paymentEvents.id, processedStatus: paymentEvents.processedStatus })
        .from(paymentEvents)
        .where(
          and(
            eq(paymentEvents.provider, "mercadopago"),
            eq(paymentEvents.providerEventKey, notification.id),
          ),
        )
        .limit(1);
      if (duplicate) return { result: "duplicate", status: duplicate.processedStatus } as const;

      const [order] = await tx
        .select({
          id: orders.id,
          folio: orders.folio,
          total: orders.total,
          currency: orders.currency,
          paymentStatus: orders.paymentStatus,
        })
        .from(orders)
        .where(eq(orders.folio, payment.external_reference))
        .limit(1)
        .for("update");

      if (!order) {
        await tx.insert(paymentEvents).values({
          provider: "mercadopago",
          providerEventKey: notification.id,
          providerPaymentId: payment.id,
          eventType: notification.type,
          action: notification.action ?? notification.type,
          processedStatus: "rejected:external_reference_mismatch",
        });
        return { result: "rejected", status: "external_reference_mismatch" } as const;
      }

      const localPayments = await tx
        .select({
          id: payments.id,
          orderId: payments.orderId,
          providerPaymentId: payments.providerPaymentId,
          providerPreferenceId: payments.providerPreferenceId,
          status: payments.status,
          amount: payments.amount,
          currency: payments.currency,
          externalReference: payments.externalReference,
        })
        .from(payments)
        .where(
          and(
            eq(payments.provider, "mercadopago"),
            or(
              eq(payments.providerPaymentId, payment.id),
              and(
                eq(payments.orderId, order.id),
                eq(payments.externalReference, order.folio),
                isNotNull(payments.providerPreferenceId),
              ),
            ),
          ),
        )
        .limit(2)
        .for("update");

      const localPayment =
        localPayments.find((candidate) => candidate.providerPaymentId === payment.id) ??
        localPayments.find((candidate) => candidate.orderId === order.id);

      let rejection: string | null = null;
      if (!localPayment) {
        rejection = "payment_not_found";
      } else if (
        localPayment.orderId !== order.id ||
        localPayment.externalReference !== order.folio ||
        localPayment.amount !== order.total ||
        localPayment.currency !== order.currency
      ) {
        rejection = "local_payment_mismatch";
      } else {
        rejection = validatePaymentAgainstLocal({
          payment,
          orderFolio: order.folio,
          orderTotal: order.total,
          orderCurrency: order.currency,
          ...paymentValidationConfiguration,
        });
      }

      if (rejection || !localPayment) {
        await tx.insert(paymentEvents).values({
          provider: "mercadopago",
          providerEventKey: notification.id,
          providerPaymentId: payment.id,
          eventType: notification.type,
          action: notification.action ?? notification.type,
          processedStatus: `rejected:${rejection ?? "payment_not_found"}`,
        });
        return {
          result: "rejected",
          status: rejection ?? "payment_not_found",
          folio: order.folio,
        } as const;
      }

      const mappedStatus = mapMercadoPagoStatus(payment.status);
      const currentStatus = reconcileLocalPaymentStatus(localPayment.status, order.paymentStatus);
      const nextPaymentStatus = resolvePaymentTransition(currentStatus, mappedStatus);

      await tx
        .update(payments)
        .set({ providerPaymentId: payment.id, status: nextPaymentStatus })
        .where(eq(payments.id, localPayment.id));
      await tx
        .update(orders)
        .set({ paymentStatus: nextPaymentStatus })
        .where(eq(orders.id, order.id));
      await tx.insert(paymentEvents).values({
        provider: "mercadopago",
        providerEventKey: notification.id,
        providerPaymentId: payment.id,
        eventType: notification.type,
        action: notification.action ?? notification.type,
        processedStatus: mappedStatus
          ? `synchronized:${nextPaymentStatus}`
          : `preserved:${payment.status}`,
      });

      return {
        result: "processed",
        status: mappedStatus ? nextPaymentStatus : `preserved:${payment.status}`,
        folio: order.folio,
      } as const;
    });
    return finishSynchronization(payment.id, result);
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return finishSynchronization(payment.id, {
        result: "duplicate",
        status: "already_processed",
      });
    }
    throw error;
  }
}

const productionDependencies: WebhookDependencies = {
  getSecret: getWebhookSecret,
  getPayment: getMercadoPagoPayment,
  synchronize: synchronizeMercadoPagoPayment,
};

function jsonResponse(body: object, status: number): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

class RequestBodyTooLargeError extends Error {}

async function readJsonBody(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_WEBHOOK_BODY_BYTES) {
    throw new RequestBodyTooLargeError();
  }

  if (!request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let body = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > MAX_WEBHOOK_BODY_BYTES) throw new RequestBodyTooLargeError();
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }

  return JSON.parse(body);
}

export async function handleMercadoPagoWebhook(
  request: Request,
  dependencies: WebhookDependencies = productionDependencies,
): Promise<Response> {
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id")?.trim();
  const requestId = request.headers.get("x-request-id")?.trim();
  const signature = request.headers.get("x-signature")?.trim();

  if (!dataId || dataId.length > 191 || !requestId || requestId.length > 191 || !signature) {
    return jsonResponse({ received: false, error: "Missing webhook authentication data." }, 401);
  }

  let secret: string;
  try {
    secret = dependencies.getSecret();
  } catch {
    console.error("[mercadopago-webhook] server configuration is incomplete");
    return jsonResponse({ received: false, error: "Webhook unavailable." }, 503);
  }

  try {
    WebhookSignatureValidator.validate({
      xSignature: signature,
      xRequestId: requestId,
      dataId: dataId.toLowerCase(),
      secret,
      toleranceSeconds: SIGNATURE_TOLERANCE_SECONDS,
      ...(dependencies.now ? { now: dependencies.now } : {}),
    });
  } catch (error) {
    const reason = error instanceof InvalidWebhookSignatureError ? error.reason : "invalid";
    console.warn("[mercadopago-webhook] signature rejected", { requestId, reason });
    return jsonResponse({ received: false, error: "Invalid webhook signature." }, 401);
  }

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return jsonResponse({ received: false, error: "Webhook payload is too large." }, 413);
    }
    return jsonResponse({ received: false, error: "Malformed JSON payload." }, 400);
  }

  const notificationResult = mercadoPagoNotificationSchema.safeParse(body);
  if (!notificationResult.success) {
    return jsonResponse({ received: false, error: "Invalid webhook payload." }, 400);
  }
  const notification = notificationResult.data;
  if (notification.data.id.toLowerCase() !== dataId.toLowerCase()) {
    return jsonResponse({ received: false, error: "Webhook payment ID mismatch." }, 400);
  }

  if (notification.type !== "payment") {
    console.info("[mercadopago-webhook] event ignored", {
      eventType: notification.type,
      action: notification.action,
    });
    return jsonResponse({ received: true }, 200);
  }

  let payment: MercadoPagoPayment;
  try {
    const rawPayment = await dependencies.getPayment(notification.data.id);
    payment = mercadoPagoPaymentSchema.parse(rawPayment);
  } catch (error) {
    console.error("[mercadopago-webhook] authoritative payment lookup failed", {
      paymentId: notification.data.id,
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return jsonResponse({ received: false, error: "Payment verification unavailable." }, 503);
  }

  if (payment.id !== notification.data.id) {
    return jsonResponse({ received: false, error: "Payment verification mismatch." }, 503);
  }

  try {
    const result = await dependencies.synchronize(notification, payment);
    console.info("[mercadopago-webhook] payment handled", {
      folio: result.folio,
      paymentId: payment.id,
      eventType: notification.type,
      action: notification.action,
      result: result.result,
      status: result.status,
    });
    return jsonResponse({ received: true }, 200);
  } catch (error) {
    console.error("[mercadopago-webhook] database synchronization failed", {
      paymentId: payment.id,
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return jsonResponse({ received: false, error: "Synchronization unavailable." }, 503);
  }
}
