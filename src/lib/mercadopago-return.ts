import { createServerFn } from "@tanstack/react-start";

import { mercadoPagoReturnInputSchema } from "./mercadopago-return-core";

export const reconcileMercadoPagoPaymentReturn = createServerFn({ method: "POST" })
  .validator(mercadoPagoReturnInputSchema)
  .handler(async ({ data }) => {
    const { enforceRateLimit } = await import("./rate-limit.server");
    const { reconcileMercadoPagoPaymentReturn: reconcile } = await import(
      "./mercadopago-return.server"
    );
    enforceRateLimit("mercadopago-return", { limit: 20, windowMs: 5 * 60_000 });
    return reconcile(data.paymentId);
  });
