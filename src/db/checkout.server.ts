import "@tanstack/react-start/server-only";

import { and, eq } from "drizzle-orm";

import { checkoutIntentSchema } from "@/lib/checkout-input";

import { getDatabase } from "./index.server";
import { createOrder } from "./orders.server";
import { categories, products, productVariants } from "./schema";

export async function createOrderFromCheckoutIntent(input: unknown) {
  const parsed = checkoutIntentSchema.parse(input);
  const db = getDatabase();
  const resolvedItems = [];

  for (const item of parsed.items) {
    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(
          eq(products.slug, item.productSlug),
          eq(products.isActive, true),
          eq(categories.isActive, true),
        ),
      )
      .limit(1);

    if (!product) throw new Error(`Active product ${item.productSlug} was not found.`);

    let variantId: number | null = null;
    if (item.variantCode) {
      const [variant] = await db
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(
          and(
            eq(productVariants.productId, product.id),
            eq(productVariants.code, item.variantCode),
            eq(productVariants.isActive, true),
          ),
        )
        .limit(1);

      if (!variant) throw new Error(`Active variant ${item.variantCode} was not found.`);
      variantId = variant.id;
    }

    resolvedItems.push({ productId: product.id, variantId, quantity: item.quantity });
  }

  return createOrder({
    checkoutRequestId: parsed.checkoutRequestId,
    customer: parsed.customer,
    items: resolvedItems,
  });
}
