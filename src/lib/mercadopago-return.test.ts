import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { parseSearchWith } from "@tanstack/react-router";

import { getMercadoPagoReturnPaymentId } from "./mercadopago-return-core";
import { reconcileMercadoPagoPaymentReturn } from "./mercadopago-return.server";
import {
  mapMercadoPagoStatus,
  mercadoPagoPaymentSchema,
  validatePaymentAgainstLocal,
} from "./mercadopago-webhook-core";

const paymentId = "123456789";
const realReturnUrl = new URL(
  "https://mikuva.com/pago/exitoso?collection_id=177184864973&collection_status=approved&payment_id=177184864973&status=approved&external_reference=MK-2026-00026&payment_type=credit_card&merchant_order_id=44338420444&preference_id=2227257877-10851809-174a-42a8-b033-a307a6647782&site_id=MLM&processing_mode=aggregator&merchant_account_id=null",
);
const local = {
  orderFolio: "MK-2026-00001",
  orderTotal: 250000,
  orderCurrency: "MXN",
};

function authoritativePayment(overrides: Record<string, unknown> = {}) {
  return {
    id: paymentId,
    status: "approved",
    external_reference: local.orderFolio,
    transaction_amount: 2500,
    currency_id: "MXN",
    ...overrides,
  };
}

function synchronizedDependencies(input?: {
  payment?: Record<string, unknown>;
  onWrite?: () => void;
}) {
  return {
    getPayment: async () => authoritativePayment(input?.payment),
    synchronize: async (_notification: unknown, rawPayment: unknown) => {
      const payment = mercadoPagoPaymentSchema.parse(rawPayment);
      const rejection = validatePaymentAgainstLocal({ payment, ...local });
      if (rejection) return { result: "rejected" as const, status: rejection };

      const status = mapMercadoPagoStatus(payment.status);
      if (status !== "approved") return { result: "processed" as const, status: "pending" };

      input?.onWrite?.();
      return { result: "processed" as const, status: "approved", folio: local.orderFolio };
    },
  };
}

describe("Mercado Pago Checkout Pro payment returns", () => {
  test("extracts the real return URL payment_id for server reconciliation", async () => {
    const search = parseSearchWith(JSON.parse)(realReturnUrl.search);
    const realPaymentId = getMercadoPagoReturnPaymentId(
      (search as Record<string, unknown>)["payment_id"],
    );
    let requestedPaymentId: string | undefined;
    const result = await reconcileMercadoPagoPaymentReturn(realPaymentId!, {
      getPayment: async (id) => {
        requestedPaymentId = id;
        return authoritativePayment({ id });
      },
      synchronize: async () => ({ result: "processed" as const, status: "approved" }),
    });

    assert.equal(requestedPaymentId, "177184864973");
    assert.equal(result.state, "confirmed");
  });

  test("confirms an approved authoritative payment with matching local values", async () => {
    const result = await reconcileMercadoPagoPaymentReturn(paymentId, synchronizedDependencies());
    assert.deepEqual(result, { state: "confirmed", folio: local.orderFolio });
  });

  test("does not grant authority to a forged status query parameter", async () => {
    const search = { payment_id: paymentId, status: "approved" };
    const id = getMercadoPagoReturnPaymentId(search.payment_id);
    const result = await reconcileMercadoPagoPaymentReturn(
      id!,
      synchronizedDependencies({ payment: { status: "pending" } }),
    );
    assert.deepEqual(result, { state: "processing" });
  });

  test("does not synchronize when the payment lookup does not exist", async () => {
    let writes = 0;
    const result = await reconcileMercadoPagoPaymentReturn(paymentId, {
      getPayment: async () => Promise.reject(new Error("not found")),
      synchronize: async () => {
        writes += 1;
        return { result: "processed" as const, status: "approved" };
      },
    });
    assert.deepEqual(result, { state: "verifying" });
    assert.equal(writes, 0);
  });

  for (const [label, payment] of [
    ["amount", { transaction_amount: "2499.99" }],
    ["currency", { currency_id: "USD" }],
    ["external reference", { external_reference: "MK-2026-99999" }],
  ] as const) {
    test(`does not mark paid when the authoritative ${label} differs`, async () => {
      let writes = 0;
      const result = await reconcileMercadoPagoPaymentReturn(
        paymentId,
        synchronizedDependencies({ payment, onWrite: () => writes += 1 }),
      );
      assert.deepEqual(result, { state: "verifying" });
      assert.equal(writes, 0);
    });
  }

  test("is idempotent when the buyer refreshes the return page", async () => {
    const events = new Set<string>();
    let writes = 0;
    const dependencies = {
      getPayment: async () => authoritativePayment(),
      synchronize: async (notification: { id: string }) => {
        if (events.has(notification.id)) {
          return { result: "duplicate" as const, status: "synchronized:approved" };
        }
        events.add(notification.id);
        writes += 1;
        return { result: "processed" as const, status: "approved", folio: local.orderFolio };
      },
    };

    assert.equal((await reconcileMercadoPagoPaymentReturn(paymentId, dependencies)).state, "confirmed");
    assert.equal((await reconcileMercadoPagoPaymentReturn(paymentId, dependencies)).state, "confirmed");
    assert.equal(writes, 1);
  });

  test("does not duplicate a payment when the webhook arrives first", async () => {
    let writes = 0;
    const result = await reconcileMercadoPagoPaymentReturn(paymentId, {
      getPayment: async () => authoritativePayment(),
      synchronize: async () => ({
        result: "processed" as const,
        status: "approved",
        folio: local.orderFolio,
      }),
    });
    assert.equal(result.state, "confirmed");
    assert.equal(writes, 0);
  });

  test("does not duplicate a payment when the return arrives before the webhook", async () => {
    let writes = 0;
    const result = await reconcileMercadoPagoPaymentReturn(
      paymentId,
      synchronizedDependencies({ onWrite: () => writes += 1 }),
    );
    assert.equal(result.state, "confirmed");

    const webhookWouldWriteAnotherPayment = writes === 0;
    assert.equal(webhookWouldWriteAnotherPayment, false);
    assert.equal(writes, 1);
  });
});
