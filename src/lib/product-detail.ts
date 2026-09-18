import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { toStoreCatalog, type StoreProduct } from "./store-catalog";
import type { DirectusCatalog } from "./catalog-directus.server";
import type { Product, ReelSize, VolumeTier } from "@/types/catalog";

export type ProductDetailImage = {
  url: string;
  alt: string;
};

export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: { id: string; slug: string; name: string };
  unitLabel: string;
  configurator: string;
  mainImageUrl: string | null;
  gallery: ProductDetailImage[];
  priceFrom: number | null;
  currency: string;
  includes: string[];
  preparation: string[];
  faqs: Array<{ question: string; answer: string }>;
  filmTypes: string[];
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string | null;
};

export type TransactionalProductConfig = {
  slug: string;
  name: string;
  image: string;
  filmTypes: string[];
  tiers: VolumeTier[];
  reels: ReelSize[];
};

export type ProductDetailPageData = ProductDetail & {
  related: StoreProduct[];
  transactionalConfig: TransactionalProductConfig | null;
};

const productDetailInputSchema = z.object({
  slug: z.string().min(1).max(160),
});

function assetUrl(assetId: string): string {
  return `/api/directus-assets/${assetId}`;
}

function plainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function priceFrom(product: DirectusCatalog["products"][number]): number | null {
  const variantPrices = product.variants.flatMap((variant) =>
    variant.price === null ? [] : [variant.price],
  );

  return variantPrices.length ? Math.min(...variantPrices) : product.basePrice;
}

export function toTransactionalConfig(
  product: Pick<Product, "slug" | "name" | "image" | "filmTypes" | "tiers" | "reels"> | undefined,
): TransactionalProductConfig | null {
  if (!product) return null;

  return {
    slug: product.slug,
    name: product.name,
    image: product.image,
    filmTypes: [...(product.filmTypes ?? [])],
    tiers: (product.tiers ?? []).map(({ units, price, label }) => ({ units, price, label })),
    reels: (product.reels ?? []).map(({ id, label, feet, duration, price }) => ({
      id,
      label,
      feet,
      duration,
      price,
    })),
  };
}

export function toProductDetail(catalog: DirectusCatalog, slug: string): ProductDetail | null {
  const product = catalog.products.find((item) => item.slug === slug && item.active);
  const category = product && catalog.categories.find((item) => item.id === product.categoryId);
  if (!product || !category) return null;

  const mainImageAlt = product.image
    ? product.gallery.find((image) => image.assetId === product.image?.assetId)?.altText ||
      product.name
    : "";
  const gallery = [
    ...(product.image ? [{ assetId: product.image.assetId, altText: mainImageAlt }] : []),
    ...product.gallery,
  ]
    .filter(
      (image, index, images) =>
        images.findIndex((item) => item.assetId === image.assetId) === index,
    )
    .map((image, index) => ({
      url: assetUrl(image.assetId),
      alt: image.altText || `${product.name}, imagen ${index + 1}`,
    }));

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    description: plainText(product.description),
    category: { id: category.id, slug: category.slug, name: category.name },
    unitLabel: product.unitLabel,
    configurator: product.configurator,
    mainImageUrl: product.image ? assetUrl(product.image.assetId) : null,
    gallery,
    priceFrom: priceFrom(product),
    currency: product.currency,
    includes: product.includes,
    preparation: product.preparation,
    faqs: product.faqs,
    filmTypes: product.filmTypes,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    ogImageUrl: product.ogImage ? assetUrl(product.ogImage.assetId) : null,
  };
}

export const getProductDetail = createServerFn({ method: "GET" })
  .validator(productDetailInputSchema)
  .handler(async ({ data }): Promise<ProductDetailPageData | null> => {
    const { getDirectusCatalog } = await import("./catalog-directus.server");
    const catalog = await getDirectusCatalog();
    const detail = toProductDetail(catalog, data.slug);
    if (!detail) return null;

    const { getProductBySlug } = await import("../data/catalog");
    const transactionalProduct = getProductBySlug(detail.slug);

    return {
      ...detail,
      related: toStoreCatalog(catalog)
        .products.filter((product) => product.slug !== detail.slug)
        .slice(0, 3),
      transactionalConfig: toTransactionalConfig(transactionalProduct),
    };
  });
