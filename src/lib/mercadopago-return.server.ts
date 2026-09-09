import "@tanstack/react-start/server-only";

import {
  mercadoPagoPaymentSchema,
  type MercadoPagoNotification,
} from "@/lib/mercadopago-webhook-core";
import { getMercadoPagoPayment } from "@/lib/mercadopago.server";
import { synchronizeMercadoPagoPayment } from "@/lib/mercadopago-webhook.server";

type ReturnReconciliation = {
  state: "confirmed" | "processing" | "verifying";
  folio?: string;
};

type ReturnDependencies = {
  getPayment: (paymentId: string) => Promise<unknown>;
  synchronize: typeof synchronizeMercadoPagoPayment;
};

const productionDependencies: ReturnDependencies = {
  getPayment: getMercadoPagoPayment,
  synchronize: synchronizeMercadoPagoPayment,
};

export async function reconcileMercadoPagoPaymentReturn(
  paymentId: string,
  dependencies: ReturnDependencies = productionDependencies,
): Promise<ReturnReconciliation> {
  console.info("[mercadopago-return] reconciliation started", { paymentId });
  let reconciliation: ReturnReconciliation = { state: "verifying" };

  try {
    const payment = mercadoPagoPaymentSchema.parse(await dependencies.getPayment(paymentId));
    if (payment.id === paymentId) {
      const notification: MercadoPagoNotification = {
        id: `return:${payment.id}`,
        type: "payment",
        action: "return",
        data: { id: payment.id },
      };
      const result = await dependencies.synchronize(notification, payment);

      if (result.status === "approved" || result.status === "synchronized:approved") {
        reconciliation = result.folio
          ? { state: "confirmed", folio: result.folio }
          : { state: "confirmed" };
      } else if (result.status === "pending" || result.status === "synchronized:pending") {
        reconciliation = result.folio
          ? { state: "processing", folio: result.folio }
          : { state: "processing" };
      }
    }
  } catch (error) {
    console.error("[mercadopago-return] payment reconciliation failed", {
      paymentId,
      error: error instanceof Error ? error.name : "UnknownError",
    });
  }

  console.info("[mercadopago-return] reconciliation result", {
    paymentId,
    result: reconciliation.state,
  });
  return reconciliation;
}
