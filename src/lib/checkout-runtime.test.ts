import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";

import { PAYMENT_STATUSES } from "@/db/schema";

const runtimeFiles = [
  "src/routes/checkout.tsx",
  "src/lib/checkout.ts",
  "src/lib/mercadopago.server.ts",
];
const returnFiles = [
  "src/routes/pago.exitoso.tsx",
  "src/routes/pago.pendiente.tsx",
  "src/routes/pago.error.tsx",
];

describe("hosted Checkout Pro runtime boundary", () => {
  test("does not retain Brick, React SDK, Stripe, or public-key runtime paths", async () => {
    const source = await Promise.all(runtimeFiles.map((file) => readFile(file, "utf8")));
    const runtime = source.join("\n");
    for (const forbidden of [
      "@mercadopago/sdk-react",
      "Payment Brick",
      "MERCADOPAGO_PUBLIC_KEY",
      "stripe",
    ]) {
      assert.equal(runtime.toLowerCase().includes(forbidden.toLowerCase()), false, forbidden);
    }
  });

  test("keeps return pages informational", async () => {
    const source = (await Promise.all(returnFiles.map((file) => readFile(file, "utf8")))).join(
      "\n",
    );
    for (const forbidden of [
      "createServerFn",
      "paymentStatus",
      "getMercadoPagoPayment",
      "synchronizeMercadoPagoPayment",
    ]) {
      assert.equal(source.includes(forbidden), false, forbidden);
    }
  });

  test("rejects every actual non-pending order before preference or payment work", async () => {
    const source = await readFile("src/lib/mercadopago.server.ts", "utf8");
    const guard = 'if (order.paymentStatus !== "pending")';
    const guardIndex = source.indexOf(guard);

    assert.notEqual(guardIndex, -1);
    const sourceAfterGuard = source.slice(guardIndex);
    assert.deepEqual(PAYMENT_STATUSES.filter((status) => status !== "pending"), [
      "approved",
      "rejected",
      "cancelled",
      "refunded",
    ]);
    for (const operation of [
      "getPreferenceClient()",
      "providerPreferenceId: payments.providerPreferenceId",
      "preferenceClient.get({",
      "preferenceClient.create({ body: preferenceBody })",
      ".insert(payments)",
    ]) {
      assert.notEqual(sourceAfterGuard.indexOf(operation), -1, operation);
    }
  });
});
