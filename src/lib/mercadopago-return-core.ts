import { z } from "zod";

export const mercadoPagoReturnInputSchema = z
  .object({ paymentId: z.string().regex(/^\d{1,160}$/) })
  .strict();

export function getMercadoPagoReturnPaymentId(value: unknown): string | undefined {
  const result = mercadoPagoReturnInputSchema.shape.paymentId.safeParse(value);
  return result.success ? result.data : undefined;
}
