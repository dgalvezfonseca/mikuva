import "@tanstack/react-start/server-only";

import { directusFetch } from "./directus.server";

type DirectusId = string | number;
type DirectusBoolean = boolean | 0 | 1 | null;

type DirectusCollectionResponse<T> = {
  data: T[];
};

type DirectusCategory = {
  id: DirectusId;
  slug: string | null;
  name: string | null;
  tagline: string | null;
  description: string | null;
  image: string | null;
  sort: number | null;
  is_active: DirectusBoolean;
};

type DirectusProduct = {
  id: DirectusId;
  category: DirectusId | null;
  slug: string | null;
  name: string | null;
  short_description: string | null;
  description: string | null;
  base_price: number | string | null;
  currency: string | null;
  image: string | null;
  is_featured: DirectusBoolean;
  is_active: DirectusBoolean;
  unit_label: string | null;
  configurator: string | null;
  includes: unknown;
  preparation: unknown;
  faqs: unknown;
  film_types: unknown;
  sort: number | null;
};

type DirectusProductVariant = {
  id: DirectusId;
  product: DirectusId | null;
  name: string | null;
  sku: string | null;
  price: number | string | null;
  is_default: DirectusBoolean;
  is_active: DirectusBoolean;
  code: string | null;
  metadata: unknown;
  sort_order: number | null;
  sort: number | null;
};

type DirectusProductImage = {
  id: DirectusId;
  product: DirectusId | null;
  file: string | null;
  sort: number | null;
  alt_text: string | null;
};

export type CatalogAsset = {
  assetId: string;
};

export type CatalogFaq = {
  question: string;
  answer: string;
};

export type CatalogCategory = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: CatalogAsset | null;
};

export type CatalogVariant = {
  id: string;
  name: string;
  sku: string;
  code: string;
  price: number | null;
  isDefault: boolean;
  metadata: unknown;
};

export type CatalogProductImage = CatalogAsset & {
  id: string;
  altText: string;
};

export type CatalogProduct = {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  image: CatalogAsset | null;
  gallery: CatalogProductImage[];
  basePrice: number | null;
  currency: string;
  featured: boolean;
  unitLabel: string;
  configurator: string;
  active: boolean;
  includes: string[];
  preparation: string[];
  faqs: CatalogFaq[];
  filmTypes: string[];
  variants: CatalogVariant[];
};

export type DirectusCatalog = {
  categories: CatalogCategory[];
  products: CatalogProduct[];
};

const CATEGORY_FIELDS = "id,sort,slug,name,tagline,description,image,is_active";
const PRODUCT_FIELDS =
  "id,sort,category,slug,name,short_description,description,base_price,currency,image,is_featured,is_active,unit_label,configurator,includes,preparation,faqs,film_types";
const VARIANT_FIELDS =
  "id,sort,sort_order,product,name,sku,price,is_default,is_active,code,metadata";
const IMAGE_FIELDS = "id,sort,product,file,alt_text";

function responseData<T>(response: DirectusCollectionResponse<T> | null): T[] {
  return Array.isArray(response?.data) ? response.data : [];
}

function text(value: string | null): string {
  return value?.trim() ?? "";
}

function asset(value: string | null): CatalogAsset | null {
  const assetId = text(value);

  return assetId ? { assetId } : null;
}

function decimal(value: number | string | null): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function boolean(value: DirectusBoolean): boolean {
  return value === true || value === 1;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function faqs(value: unknown): CatalogFaq[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (
      !isRecord(item) ||
      typeof item["question"] !== "string" ||
      typeof item["answer"] !== "string"
    ) {
      return [];
    }

    const question = item["question"].trim();
    const answer = item["answer"].trim();
    return question && answer ? [{ question, answer }] : [];
  });
}

async function fetchActiveCategories(): Promise<DirectusCategory[]> {
  return responseData(
    await directusFetch<DirectusCollectionResponse<DirectusCategory>>(
      `/items/categories?filter[is_active][_eq]=true&sort=sort,slug&limit=-1&fields=${CATEGORY_FIELDS}`,
    ),
  );
}

async function fetchActiveProducts(): Promise<DirectusProduct[]> {
  return responseData(
    await directusFetch<DirectusCollectionResponse<DirectusProduct>>(
      `/items/products?filter[is_active][_eq]=true&sort=sort,slug&limit=-1&fields=${PRODUCT_FIELDS}`,
    ),
  );
}

async function fetchActiveVariants(): Promise<DirectusProductVariant[]> {
  return responseData(
    await directusFetch<DirectusCollectionResponse<DirectusProductVariant>>(
      `/items/product_variants?filter[is_active][_eq]=true&sort=sort_order,sort,id&limit=-1&fields=${VARIANT_FIELDS}`,
    ),
  );
}

async function fetchProductImages(): Promise<DirectusProductImage[]> {
  return responseData(
    await directusFetch<DirectusCollectionResponse<DirectusProductImage>>(
      `/items/product_images?sort=sort,id&limit=-1&fields=${IMAGE_FIELDS}`,
    ),
  );
}

function normalizeCategory(category: DirectusCategory): CatalogCategory | null {
  if (!boolean(category.is_active)) return null;

  const slug = text(category.slug);
  const name = text(category.name);

  if (!slug || !name) return null;

  return {
    id: String(category.id),
    slug,
    name,
    tagline: text(category.tagline),
    description: text(category.description),
    image: asset(category.image),
  };
}

function normalizeVariant(variant: DirectusProductVariant): CatalogVariant {
  return {
    id: String(variant.id),
    name: text(variant.name),
    sku: text(variant.sku),
    code: text(variant.code),
    price: decimal(variant.price),
    isDefault: boolean(variant.is_default),
    metadata: variant.metadata ?? null,
  };
}

export async function getActiveCatalogCategories(): Promise<CatalogCategory[]> {
  return (await fetchActiveCategories()).flatMap((category) => {
    const normalized = normalizeCategory(category);
    return normalized ? [normalized] : [];
  });
}

export async function getActiveCatalogProducts(): Promise<DirectusProduct[]> {
  return fetchActiveProducts();
}

export async function getActiveCatalogVariants(): Promise<DirectusProductVariant[]> {
  return fetchActiveVariants();
}

export async function getCatalogProductImages(): Promise<DirectusProductImage[]> {
  return fetchProductImages();
}

export async function getDirectusCatalog(): Promise<DirectusCatalog> {
  const [categories, products, variants, images] = await Promise.all([
    fetchActiveCategories(),
    fetchActiveProducts(),
    fetchActiveVariants(),
    fetchProductImages(),
  ]);
  const normalizedCategories = categories.flatMap((category) => {
    const normalized = normalizeCategory(category);
    return normalized ? [normalized] : [];
  });
  const categoryIds = new Set(normalizedCategories.map((category) => category.id));
  const variantsByProduct = new Map<string, CatalogVariant[]>();
  const imagesByProduct = new Map<string, CatalogProductImage[]>();

  for (const variant of variants) {
    if (!boolean(variant.is_active) || variant.product === null) continue;
    const productId = String(variant.product);
    const productVariants = variantsByProduct.get(productId) ?? [];
    productVariants.push(normalizeVariant(variant));
    variantsByProduct.set(productId, productVariants);
  }

  for (const image of images) {
    const imageAsset = asset(image.file);
    if (image.product === null || !imageAsset) continue;
    const productId = String(image.product);
    const productImages = imagesByProduct.get(productId) ?? [];
    productImages.push({
      id: String(image.id),
      assetId: imageAsset.assetId,
      altText: text(image.alt_text),
    });
    imagesByProduct.set(productId, productImages);
  }

  const normalizedProducts = products.flatMap((product) => {
    if (!boolean(product.is_active) || product.category === null) return [];
    const categoryId = String(product.category);
    const slug = text(product.slug);
    const name = text(product.name);
    if (!categoryIds.has(categoryId) || !slug || !name) return [];

    return [
      {
        id: String(product.id),
        categoryId,
        slug,
        name,
        shortDescription: text(product.short_description),
        description: text(product.description),
        image: asset(product.image),
        gallery: imagesByProduct.get(String(product.id)) ?? [],
        basePrice: decimal(product.base_price),
        currency: text(product.currency),
        featured: boolean(product.is_featured),
        unitLabel: text(product.unit_label),
        configurator: text(product.configurator),
        active: boolean(product.is_active),
        includes: stringArray(product.includes),
        preparation: stringArray(product.preparation),
        faqs: faqs(product.faqs),
        filmTypes: stringArray(product.film_types),
        variants: variantsByProduct.get(String(product.id)) ?? [],
      },
    ];
  });

  return { categories: normalizedCategories, products: normalizedProducts };
}
