import assert from "node:assert/strict";
import { test } from "node:test";
import { createMemoryHistory } from "@tanstack/react-router";
// @ts-expect-error Bun's test runtime is available without its ambient types.
import { mock } from "bun:test";

const calls: string[] = [];

mock.module("@/lib/mercadopago-return", () => ({
  reconcileMercadoPagoPaymentReturn: async ({ data }: { data: { paymentId: string } }) => {
    calls.push(data.paymentId);
    return { state: "confirmed" as const, folio: "MK-2026-00026" };
  },
}));

test("SSR route GET passes Mercado Pago payment_id to reconciliation", async () => {
  const { getRouter } = await import("../router");
  const router = getRouter();
  router.update({
    context: router.options.context,
    history: createMemoryHistory({
      initialEntries: ["/pago/exitoso?payment_id=177184864973"],
    }),
  });

  await router.load();

  assert.deepEqual(calls, ["177184864973"]);
  assert.deepEqual(router.state.matches.at(-1)?.loaderData, {
    state: "confirmed",
    folio: "MK-2026-00026",
  });
});
