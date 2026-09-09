import { z } from "zod";

export const mercadoPagoReturnInputSchema = z
  .object({ paymentId: z.string().regex(/^\d{1,160}$/) })
  .strict();

export function getMercadoPagoReturnPaymentId(value: unknown): string | undefined {
  // TanStack Router JSON-parses numeric search values before validateSearch runs.
  // Preserve only an exact, safe decimal identifier before the server-side lookup.
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value < 0) return undefined;
    value = String(value);
  }

  const result = mercadoPagoReturnInputSchema.shape.paymentId.safeParse(value);
  return result.success ? result.data : undefined;
}
