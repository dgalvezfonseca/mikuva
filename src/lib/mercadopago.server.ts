import "@tanstack/react-start/server-only";

import process from "node:process";

import { and, eq, isNotNull } from "drizzle-orm";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

import { getDatabase, withDatabaseNamedLock } from "@/db/index.server";
import { getOrderById } from "@/db/orders.server";
import { payments } from "@/db/schema";
import {
  buildCheckoutProPreference,
  getCheckoutProInitPoint,
  getValidatedAppOrigin,
  type MercadoPagoEnvironment,
} from "@/lib/mercadopago-preference-core";

let cachedToken: string | undefined;
let cachedClient: MercadoPagoConfig | undefined;
let cachedPreferenceClient: Preference | undefined;
let cachedPaymentClient: Payment | undefined;

function getMercadoPagoEnvironment(): MercadoPagoEnvironment {
  const environment = process.env["MERCADOPAGO_ENV"];
  if (environment !== "test" && environment !== "production") {
    throw new Error("MERCADOPAGO_ENV must be test or production.");
  }
  return environment;
}

function getMercadoPagoClient(): MercadoPagoConfig {
  getMercadoPagoEnvironment();
  const accessToken = process.env["MERCADOPAGO_ACCESS_TOKEN"]?.trim();
  if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN is required.");
  if (!cachedClient || cachedToken !== accessToken) {
    cachedClient = new MercadoPagoConfig({ accessToken, options: { timeout: 8_000 } });
    cachedPreferenceClient = undefined;
    cachedPaymentClient = undefined;
    cachedToken = accessToken;
  }
  return cachedClient;
}

function getPreferenceClient(): Preference {
  cachedPreferenceClient ??= new Preference(getMercadoPagoClient());
  return cachedPreferenceClient;
}

function getPaymentClient(): Payment {
  cachedPaymentClient ??= new Payment(getMercadoPagoClient());
  return cachedPaymentClient;
}

export async function getMercadoPagoPayment(paymentId: string) {
  if (!/^\d+$/.test(paymentId)) throw new Error("Mercado Pago payment ID is invalid.");
  return getPaymentClient().get({ id: paymentId });
}

function getAppOrigin(): string {
  const rawAppUrl = process.env["APP_URL"]?.trim();
  if (!rawAppUrl) throw new Error("APP_URL is required.");
  return getValidatedAppOrigin(getMercadoPagoEnvironment(), rawAppUrl);
}

function getErrorName(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError";
}

export async function createCheckoutPreference(orderId: number) {
  if (!Number.isSafeInteger(orderId) || orderId <= 0) throw new Error("Order ID is invalid.");
  return withDatabaseNamedLock(`mikuva:preference:${orderId}`, () =>
    createCheckoutPreferenceLocked(orderId),
  );
}

async function createCheckoutPreferenceLocked(orderId: number) {
  const order = await getOrderById(orderId);
  if (!order) throw new Error("Order was not found.");
  if (order.paymentStatus !== "pending") {
    throw new Error("Checkout Pro is unavailable for an order with a final payment status.");
  }
  if (order.currency !== "MXN") throw new Error("Checkout Pro only supports MXN orders.");

  const preferenceClient = getPreferenceClient();
  const db = getDatabase();
  const [existingPayment] = await db
    .select({ providerPreferenceId: payments.providerPreferenceId })
    .from(payments)
    .where(
      and(
        eq(payments.orderId, order.id),
        eq(payments.provider, "mercadopago"),
        isNotNull(payments.providerPreferenceId),
      ),
    )
    .limit(1);

  if (existingPayment?.providerPreferenceId) {
    try {
      // The schema persists the preference ID, not its redirect URL. Resolve it
      // remotely only because local data cannot prove a current redirect target.
      const preference = await preferenceClient.get({
        preferenceId: existingPayment.providerPreferenceId,
      });
      return {
        preferenceId: existingPayment.providerPreferenceId,
        initPoint: getCheckoutProInitPoint(preference),
      };
    } catch (error) {
      console.error("[mercadopago] preference lookup failed", {
        folio: order.folio,
        error: getErrorName(error),
      });
      throw new Error("The existing Mercado Pago preference could not be loaded.");
    }
  }

  const itemTotal = order.items.reduce((sum, item) => sum + item.subtotal, 0);
  if (itemTotal !== order.subtotal || order.total !== order.subtotal) {
    throw new Error("The order total cannot be represented by its item snapshots.");
  }
  const appOrigin = getAppOrigin();
  const preferenceBody = buildCheckoutProPreference({
    items: order.items.map((item) => ({
      id: String(item.id),
      title: [item.productNameSnapshot, item.variantNameSnapshot].filter(Boolean).join(" — "),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    folio: order.folio,
    origin: appOrigin,
  });

  try {
    const preference = await preferenceClient.create({ body: preferenceBody });
    if (!preference.id) throw new Error("Mercado Pago did not return a preference ID.");
    const initPoint = getCheckoutProInitPoint(preference);
    await db
      .insert(payments)
      .values({
        orderId: order.id,
        provider: "mercadopago",
        providerPreferenceId: preference.id,
        providerPaymentId: null,
        status: "pending",
        amount: order.total,
        currency: "MXN",
        externalReference: order.folio,
      })
      .onDuplicateKeyUpdate({
        set: {
          orderId: order.id,
          amount: order.total,
          currency: "MXN",
          externalReference: order.folio,
        },
      });
    console.info("[mercadopago] preference created", {
      folio: order.folio,
      preferenceId: preference.id,
    });
    return { preferenceId: preference.id, initPoint };
  } catch (error) {
    console.error("[mercadopago] preference creation failed", {
      folio: order.folio,
      error: getErrorName(error),
    });
    throw error;
  }
}
