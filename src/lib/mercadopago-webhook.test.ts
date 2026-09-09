import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, test } from "node:test";

import {
  mapMercadoPagoStatus,
  mercadoPagoPaymentSchema,
  mxnToCentavos,
  reconcileLocalPaymentStatus,
  resolvePaymentTransition,
  validatePaymentAgainstLocal,
} from "./mercadopago-webhook-core";
import { handleMercadoPagoWebhook } from "./mercadopago-webhook.server";

const secret = "test-webhook-secret";
const timestamp = 1_788_300_000;
const requestId = "request-test-1";
const dataId = "123456789";

function signature(id = dataId): string {
  const manifest = `id:${id};request-id:${requestId};ts:${timestamp};`;
  const digest = createHmac("sha256", secret).update(manifest).digest("hex");
  return `ts=${timestamp},v1=${digest}`;
}

function notificationBody(overrides: Record<string, unknown> = {}) {
  return {
    id: "event-1",
    type: "payment",
    action: "payment.updated",
    data: { id: dataId },
    ...overrides,
  };
}

function authoritativePayment(overrides: Record<string, unknown> = {}) {
  return {
    id: dataId,
    status: "approved",
    external_reference: "MK-2026-00001",
    transaction_amount: 2500,
    currency_id: "MXN",
    live_mode: false,
    collector_id: 987654,
    ...overrides,
  };
}

function webhookRequest(input?: {
  signature?: string | null;
  body?: string;
  dataId?: string;
}): Request {
  const queryId = input?.dataId ?? dataId;
  const headers = new Headers({
    "content-type": "application/json",
    "x-request-id": requestId,
  });
  if (input?.signature !== null) headers.set("x-signature", input?.signature ?? signature(queryId));
  return new Request(`http://localhost/api/webhooks/mercadopago?data.id=${queryId}&type=payment`, {
    method: "POST",
    headers,
    body: input?.body ?? JSON.stringify(notificationBody()),
  });
}

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    getSecret: () => secret,
    getPayment: async () => authoritativePayment(),
    synchronize: async () => ({
      result: "processed" as const,
      status: "approved",
      folio: "MK-2026-00001",
    }),
    now: () => timestamp * 1000,
    ...overrides,
  };
}

describe("Mercado Pago webhook authentication and handling", () => {
  test("rejects an invalid signature before API or database work", async () => {
    let apiCalls = 0;
    let syncCalls = 0;
    const response = await handleMercadoPagoWebhook(
      webhookRequest({ signature: `ts=${timestamp},v1=${"0".repeat(64)}` }),
      dependencies({
        getPayment: async () => {
          apiCalls += 1;
          return authoritativePayment();
        },
        synchronize: async () => {
          syncCalls += 1;
          return { result: "processed" as const, status: "approved" };
        },
      }),
    );
    assert.equal(response.status, 401);
    assert.equal(apiCalls, 0);
    assert.equal(syncCalls, 0);
  });

  test("rejects a missing signature before API or database work", async () => {
    let apiCalls = 0;
    const response = await handleMercadoPagoWebhook(
      webhookRequest({ signature: null }),
      dependencies({
        getPayment: async () => {
          apiCalls += 1;
          return authoritativePayment();
        },
      }),
    );
    assert.equal(response.status, 401);
    assert.equal(apiCalls, 0);
  });

  test("returns 400 for signed malformed JSON", async () => {
    const response = await handleMercadoPagoWebhook(webhookRequest({ body: "{" }), dependencies());
    assert.equal(response.status, 400);
  });

  test("rejects an oversized signed payload before API or database work", async () => {
    let apiCalls = 0;
    const response = await handleMercadoPagoWebhook(
      webhookRequest({
        body: JSON.stringify({ ...notificationBody(), padding: "x".repeat(70_000) }),
      }),
      dependencies({
        getPayment: async () => {
          apiCalls += 1;
          return authoritativePayment();
        },
      }),
    );
    assert.equal(response.status, 413);
    assert.equal(apiCalls, 0);
  });

  test("acknowledges valid irrelevant events without payment lookup", async () => {
    let apiCalls = 0;
    const response = await handleMercadoPagoWebhook(
      webhookRequest({ body: JSON.stringify(notificationBody({ type: "merchant_order" })) }),
      dependencies({
        getPayment: async () => {
          apiCalls += 1;
          return authoritativePayment();
        },
      }),
    );
    assert.equal(response.status, 200);
    assert.equal(apiCalls, 0);
  });

  test("returns 503 when the authoritative API lookup fails", async () => {
    const response = await handleMercadoPagoWebhook(
      webhookRequest(),
      dependencies({ getPayment: async () => Promise.reject(new Error("temporary")) }),
    );
    assert.equal(response.status, 503);
  });

  test("passes a valid signed payment to synchronization once", async () => {
    let syncCalls = 0;
    const response = await handleMercadoPagoWebhook(
      webhookRequest(),
      dependencies({
        synchronize: async () => {
          syncCalls += 1;
          return { result: "duplicate" as const, status: "already_processed" };
        },
      }),
    );
    assert.equal(response.status, 200);
    assert.equal(syncCalls, 1);
  });
});

describe("Mercado Pago payment validation", () => {
  const parsed = () => mercadoPagoPaymentSchema.parse(authoritativePayment());
  const local = {
    orderFolio: "MK-2026-00001",
    orderTotal: 250000,
    orderCurrency: "MXN",
  };

  test("normalizes decimal MXN without floating-point multiplication", () => {
    assert.equal(mxnToCentavos("2500.00"), 250000);
    assert.equal(mxnToCentavos("0.01"), 1);
    assert.throws(() => mxnToCentavos("1.001"));
    assert.throws(() => mxnToCentavos("1e3"));
  });

  test("accepts only an exact local match", () => {
    assert.equal(validatePaymentAgainstLocal({ payment: parsed(), ...local }), null);
  });

  test("rejects required reference, amount, and currency mismatches", () => {
    assert.equal(
      validatePaymentAgainstLocal({
        payment: mercadoPagoPaymentSchema.parse(
          authoritativePayment({ external_reference: "MK-2026-99999" }),
        ),
        ...local,
      }),
      "external_reference_mismatch",
    );
    assert.equal(
      validatePaymentAgainstLocal({
        payment: mercadoPagoPaymentSchema.parse(
          authoritativePayment({ transaction_amount: "2499.99" }),
        ),
        ...local,
      }),
      "amount_mismatch",
    );
    assert.equal(
      validatePaymentAgainstLocal({
        payment: mercadoPagoPaymentSchema.parse(authoritativePayment({ currency_id: "USD" })),
        ...local,
      }),
      "currency_mismatch",
    );
  });

  test("does not reject on optional collector or environment correlation", () => {
    assert.equal(
      validatePaymentAgainstLocal({
        payment: mercadoPagoPaymentSchema.parse(
          authoritativePayment({ live_mode: true, collector_id: 111 }),
        ),
        ...local,
      }),
      null,
    );
  });
});

describe("Mercado Pago status mapping and transition safety", () => {
  test("maps supported statuses conservatively", () => {
    assert.equal(mapMercadoPagoStatus("approved"), "approved");
    assert.equal(mapMercadoPagoStatus("pending"), "pending");
    assert.equal(mapMercadoPagoStatus("in_process"), "pending");
    assert.equal(mapMercadoPagoStatus("authorized"), "pending");
    assert.equal(mapMercadoPagoStatus("rejected"), "rejected");
    assert.equal(mapMercadoPagoStatus("cancelled"), "cancelled");
    assert.equal(mapMercadoPagoStatus("refunded"), "refunded");
    assert.equal(mapMercadoPagoStatus("charged_back"), null);
    assert.equal(mapMercadoPagoStatus("unknown"), null);
  });

  test("does not downgrade definitive local states", () => {
    assert.equal(resolvePaymentTransition("approved", "pending"), "approved");
    assert.equal(resolvePaymentTransition("refunded", "approved"), "refunded");
    assert.equal(resolvePaymentTransition("rejected", "pending"), "rejected");
    assert.equal(resolvePaymentTransition("pending", "approved"), "approved");
    assert.equal(resolvePaymentTransition("approved", "refunded"), "refunded");
  });

  test("reconciles an existing split state before updating both records", () => {
    assert.equal(reconcileLocalPaymentStatus("approved", "pending"), "approved");
    assert.equal(reconcileLocalPaymentStatus("pending", "refunded"), "refunded");
    assert.equal(reconcileLocalPaymentStatus("rejected", "pending"), "rejected");
  });
});
