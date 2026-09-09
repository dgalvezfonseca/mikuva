import { createServerFn } from "@tanstack/react-start";

import { checkoutIntentSchema } from "./checkout-input";

function getErrorCode(error: unknown): string | undefined {
  let current = error;
  for (let depth = 0; depth < 4 && current && typeof current === "object"; depth += 1) {
    const candidate = current as { code?: unknown; cause?: unknown };
    if (typeof candidate.code === "string") return candidate.code;
    current = candidate.cause;
  }
  return undefined;
}

function getPublicCheckoutError(error: unknown, code: string | undefined): string {
  if (code === "ECONNREFUSED") {
    return "El servicio local de pedidos no está disponible. Verifica la conexión de base de datos e inténtalo de nuevo.";
  }

  const message = error instanceof Error ? error.message : "";
  if (message.startsWith("Active product") || message.startsWith("Active variant")) {
    return "Uno de los servicios del carrito ya no está disponible. Actualiza tu carrito e inténtalo de nuevo.";
  }
  if (message.includes("MERCADOPAGO_") || message.includes("APP_URL")) {
    return "Falta completar la configuración de pago del servidor.";
  }

  return "No pudimos preparar el pago por un problema de configuración o conexión. Inténtalo de nuevo.";
}

export const beginMercadoPagoCheckout = createServerFn({ method: "POST" })
  .validator(checkoutIntentSchema)
  .handler(async ({ data }) => {
    try {
      const [{ createOrderFromCheckoutIntent }, { createCheckoutPreference }] = await Promise.all([
        import("@/db/checkout.server"),
        import("@/lib/mercadopago.server"),
      ]);
      const { enforceRateLimit } = await import("@/lib/rate-limit.server");
      enforceRateLimit("checkout", { limit: 10, windowMs: 5 * 60_000 });
      const order = await createOrderFromCheckoutIntent(data);
      const preference = await createCheckoutPreference(order.id);

      return { initPoint: preference.initPoint, folio: order.folio };
    } catch (error) {
      const code = getErrorCode(error);
      console.error("[checkout] could not start Checkout Pro", {
        error: error instanceof Error ? error.name : "UnknownError",
        code,
      });
      throw new Error(getPublicCheckoutError(error, code));
    }
  });
