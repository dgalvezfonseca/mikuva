import { z } from "zod";

import type { PaymentStatus } from "@/db/schema";

const identifierSchema = z
  .union([z.string(), z.number().int().nonnegative()])
  .transform((value) => String(value).trim())
  .pipe(z.string().min(1).max(191));

export const mercadoPagoNotificationSchema = z
  .object({
    id: identifierSchema,
    type: z.string().trim().min(1).max(64),
    action: z.string().trim().min(1).max(96).optional(),
    data: z.object({ id: identifierSchema }).passthrough(),
  })
  .passthrough();

export const mercadoPagoPaymentSchema = z
  .object({
    id: identifierSchema,
    status: z.string().trim().min(1).max(64),
    external_reference: z.string().trim().min(1).max(64),
    transaction_amount: z.union([z.string(), z.number().finite()]),
    currency_id: z.string().trim().length(3),
    live_mode: z.boolean().optional(),
    collector_id: identifierSchema.optional(),
  })
  .passthrough();

export type MercadoPagoNotification = z.infer<typeof mercadoPagoNotificationSchema>;
export type MercadoPagoPayment = z.infer<typeof mercadoPagoPaymentSchema>;

export type PaymentValidationFailure =
  | "environment_mismatch"
  | "collector_unconfigured"
  | "collector_mismatch"
  | "external_reference_mismatch"
  | "amount_mismatch"
  | "currency_mismatch";

export function mxnToCentavos(value: string | number): number {
  const decimal = typeof value === "number" ? String(value) : value.trim();
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(decimal);
  if (!match) throw new Error("Amount must be a non-negative decimal with at most two places.");

  const whole = BigInt(match[1] ?? "0");
  const fraction = BigInt((match[2] ?? "").padEnd(2, "0") || "0");
  const centavos = whole * 100n + fraction;
  if (centavos > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Amount exceeds the supported integer range.");
  }
  return Number(centavos);
}

export function mapMercadoPagoStatus(status: string): PaymentStatus | null {
  switch (status) {
    case "approved":
      return "approved";
    case "pending":
    case "in_process":
    case "authorized":
      return "pending";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "cancelled";
    case "refunded":
      return "refunded";
    case "in_mediation":
    case "charged_back":
    default:
      return null;
  }
}

export function resolvePaymentTransition(
  current: PaymentStatus,
  authoritative: PaymentStatus | null,
): PaymentStatus {
  if (!authoritative || current === "refunded") return current;
  if (authoritative === "refunded") return "refunded";
  if (current === "approved" && authoritative !== "approved") return current;
  if ((current === "rejected" || current === "cancelled") && authoritative === "pending") {
    return current;
  }
  return authoritative;
}

export function reconcileLocalPaymentStatus(
  paymentStatus: PaymentStatus,
  orderPaymentStatus: PaymentStatus,
): PaymentStatus {
  if (paymentStatus === orderPaymentStatus) return paymentStatus;
  if (paymentStatus === "refunded" || orderPaymentStatus === "refunded") return "refunded";
  if (paymentStatus === "approved" || orderPaymentStatus === "approved") return "approved";
  if (paymentStatus !== "pending") return paymentStatus;
  return orderPaymentStatus;
}

export function validatePaymentAgainstLocal(input: {
  payment: MercadoPagoPayment;
  orderFolio: string;
  orderTotal: number;
  orderCurrency: string;
  expectedLiveMode: boolean | undefined;
  expectedCollectorId: string | undefined;
}): PaymentValidationFailure | null {
  const { payment, orderFolio, orderTotal, orderCurrency, expectedLiveMode, expectedCollectorId } =
    input;

  if (expectedLiveMode === undefined || payment.live_mode !== expectedLiveMode) {
    return "environment_mismatch";
  }
  if (!expectedCollectorId) return "collector_unconfigured";
  if (payment.collector_id !== expectedCollectorId) return "collector_mismatch";

  if (payment.external_reference !== orderFolio) return "external_reference_mismatch";

  let remoteAmount: number;
  try {
    remoteAmount = mxnToCentavos(payment.transaction_amount);
  } catch {
    return "amount_mismatch";
  }
  if (remoteAmount !== orderTotal) return "amount_mismatch";
  if (payment.currency_id !== "MXN" || payment.currency_id !== orderCurrency) {
    return "currency_mismatch";
  }
  return null;
}
