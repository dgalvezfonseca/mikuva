import { z } from "zod";

const checkoutCustomerSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(140),
    email: z.string().trim().toLowerCase().email().max(254),
    phone: z
      .string()
      .trim()
      .min(8)
      .max(32)
      .regex(/^[0-9+() .-]+$/),
  })
  .strict();

const checkoutItemSchema = z
  .object({
    productSlug: z
      .string()
      .trim()
      .min(1)
      .max(160)
      .regex(/^[a-z0-9-]+$/),
    variantCode: z
      .string()
      .trim()
      .min(1)
      .max(96)
      .regex(/^[a-z0-9:-]+$/)
      .nullable(),
    quantity: z.number().int().positive().max(10_000),
  })
  .strict();

export const checkoutIntentSchema = z
  .object({
    checkoutRequestId: z.string().uuid(),
    customer: checkoutCustomerSchema,
    items: z.array(checkoutItemSchema).min(1).max(100),
  })
  .strict();

export type CheckoutIntent = z.infer<typeof checkoutIntentSchema>;
