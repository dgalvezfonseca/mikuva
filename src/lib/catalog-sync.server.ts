import "@tanstack/react-start/server-only";

import { eq } from "drizzle-orm";

import { getDatabase } from "@/db/index.server";
import { categories, products, productVariants } from "@/db/schema";

import { buildCatalogSyncPlan, type CatalogSyncPlan } from "./catalog-sync-core";
import { directusFetch } from "./directus.server";

type DirectusResponse = { data: unknown[] };

const CATEGORY_FIELDS = "id,slug,name,description,sort,is_active";
const PRODUCT_FIELDS =
  "id,category,slug,name,short_description,description,base_price,currency,is_active";
const VARIANT_FIELDS = "id,product,name,sku,code,price,metadata,sort,sort_order,is_active";

function responseData(response: DirectusResponse | null): unknown[] {
  if (!Array.isArray(response?.data)) throw new Error("Directus catalog could not be read.");
  return response.data;
}

export async function readDirectusCatalogSyncPlan(): Promise<CatalogSyncPlan> {
  const [categoryResponse, productResponse, variantResponse] = await Promise.all([
    directusFetch<DirectusResponse>(`/items/categories?sort=id&limit=-1&fields=${CATEGORY_FIELDS}`),
    directusFetch<DirectusResponse>(`/items/products?sort=id&limit=-1&fields=${PRODUCT_FIELDS}`),
    directusFetch<DirectusResponse>(
      `/items/product_variants?sort=id&limit=-1&fields=${VARIANT_FIELDS}`,
    ),
  ]);
  return buildCatalogSyncPlan({
    categories: responseData(categoryResponse),
    products: responseData(productResponse),
    variants: responseData(variantResponse),
  });
}

export async function synchronizeDirectusCatalog(): Promise<{
  categories: number;
  products: number;
  variants: number;
}> {
  const plan = await readDirectusCatalogSyncPlan();
  const db = getDatabase();
  await db.transaction(async (tx) => {
    const categoryIds = new Map<string, number>();
    for (const category of plan.categories) {
      const [existing] = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.directusId, category.directusId))
        .limit(1);
      if (existing) {
        await tx
          .update(categories)
          .set({ ...category })
          .where(eq(categories.id, existing.id));
        categoryIds.set(category.directusId, existing.id);
      } else {
        const [created] = await tx.insert(categories).values(category).$returningId();
        if (!created) throw new Error("Could not create category.");
        categoryIds.set(category.directusId, created.id);
      }
    }

    const productIds = new Map<string, number>();
    for (const product of plan.products) {
      const categoryId = categoryIds.get(product.categoryDirectusId);
      if (!categoryId) throw new Error("Product category could not be synchronized.");
      const { categoryDirectusId: _, ...productValues } = product;
      const values = { ...productValues, categoryId };
      const [existing] = await tx
        .select({ id: products.id })
        .from(products)
        .where(eq(products.directusId, product.directusId))
        .limit(1);
      if (existing) {
        await tx.update(products).set(values).where(eq(products.id, existing.id));
        productIds.set(product.directusId, existing.id);
      } else {
        const [created] = await tx.insert(products).values(values).$returningId();
        if (!created) throw new Error("Could not create product.");
        productIds.set(product.directusId, created.id);
      }
    }

    for (const variant of plan.variants) {
      const productId = productIds.get(variant.productDirectusId);
      if (!productId) throw new Error("Variant product could not be synchronized.");
      const { productDirectusId: _, ...variantValues } = variant;
      const values = { ...variantValues, productId };
      const [existing] = await tx
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(eq(productVariants.directusId, variant.directusId))
        .limit(1);
      if (existing)
        await tx.update(productVariants).set(values).where(eq(productVariants.id, existing.id));
      else await tx.insert(productVariants).values(values);
    }
  });
  return {
    categories: plan.categories.length,
    products: plan.products.length,
    variants: plan.variants.length,
  };
}
