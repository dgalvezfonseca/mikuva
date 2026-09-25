export type DirectusCatalogSyncInput = {
  categories: unknown[];
  products: unknown[];
  variants: unknown[];
};

export type SyncedCategory = {
  directusId: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

export type SyncedProduct = {
  directusId: string;
  categoryDirectusId: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  basePrice: number;
  currency: "MXN";
  isActive: boolean;
};

export type SyncedVariant = {
  directusId: string;
  productDirectusId: string;
  code: string;
  name: string;
  price: number;
  metadata:
    | { type: "volume"; units: number; unitLabel: string }
    | {
        type: "reel";
        format: "8mm" | "super8";
        diameterInches: number;
        approximateFeet?: number;
        approximateMinutes?: number;
      }
    | { type: "simple" }
    | null;
  sortOrder: number;
  isActive: boolean;
};

export type CatalogSyncPlan = {
  categories: SyncedCategory[];
  products: SyncedProduct[];
  variants: SyncedVariant[];
};

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Directus catalog record is invalid.");
  }
  return value as Record<string, unknown>;
}

function id(value: unknown, label: string): string {
  if ((typeof value !== "string" && typeof value !== "number") || !String(value).trim()) {
    throw new Error(`${label} is required.`);
  }
  return String(value);
}

function requiredText(value: unknown, label: string, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new Error(`${label} is invalid.`);
  }
  return value.trim();
}

function optionalText(value: unknown, max: number): string {
  if (value == null) return "";
  if (typeof value !== "string" || value.trim().length > max) throw new Error("Text is invalid.");
  return value.trim();
}

function active(value: unknown): boolean {
  return value === true || value === 1;
}

function sort(value: unknown): number {
  if (value == null) return 0;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0)
    throw new Error("Sort order is invalid.");
  return value;
}

function metadata(value: unknown): SyncedVariant["metadata"] {
  if (value == null) return null;
  const item = record(value);
  if (item["type"] === "simple") return { type: "simple" };
  if (
    item["type"] === "volume" &&
    Number.isSafeInteger(item["units"]) &&
    (item["units"] as number) > 0 &&
    typeof item["unitLabel"] === "string"
  ) {
    return { type: "volume", units: item["units"] as number, unitLabel: item["unitLabel"] };
  }
  if (
    item["type"] === "reel" &&
    (item["format"] === "8mm" || item["format"] === "super8") &&
    typeof item["diameterInches"] === "number" &&
    Number.isFinite(item["diameterInches"])
  ) {
    return {
      type: "reel",
      format: item["format"],
      diameterInches: item["diameterInches"],
      ...(Number.isSafeInteger(item["approximateFeet"])
        ? { approximateFeet: item["approximateFeet"] as number }
        : {}),
      ...(Number.isSafeInteger(item["approximateMinutes"])
        ? { approximateMinutes: item["approximateMinutes"] as number }
        : {}),
    };
  }
  throw new Error("Variant metadata is invalid.");
}

/** Converts Directus MXN pesos to the integer centavos used by MySQL. */
export function mxnToCentavos(value: unknown): number {
  const source =
    typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  if (!/^\d+(?:\.\d{1,2})?$/.test(source)) throw new Error("MXN price is invalid.");
  const [whole, fraction = ""] = source.split(".");
  const centavos = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(centavos)) throw new Error("MXN price is invalid.");
  return centavos;
}

function unique<T extends { directusId: string }>(items: T[], label: string): T[] {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.directusId)) throw new Error(`Duplicate Directus ${label} ID.`);
    ids.add(item.directusId);
  }
  return items;
}

export function buildCatalogSyncPlan(input: DirectusCatalogSyncInput): CatalogSyncPlan {
  const categories = unique(
    input.categories.map((value) => {
      const item = record(value);
      return {
        directusId: id(item["id"], "Category ID"),
        slug: requiredText(item["slug"], "Category slug", 128),
        name: requiredText(item["name"], "Category name", 160),
        description: optionalText(item["description"], 65_535),
        sortOrder: sort(item["sort"]),
        isActive: active(item["is_active"]),
      };
    }),
    "category",
  );
  const categoryIds = new Set(categories.map((item) => item.directusId));
  const products = unique(
    input.products.map((value) => {
      const item = record(value);
      const categoryDirectusId = id(item["category"], "Product category");
      if (!categoryIds.has(categoryDirectusId))
        throw new Error("Product category is missing from Directus catalog.");
      if (item["currency"] !== "MXN") throw new Error("Product currency must be MXN.");
      return {
        directusId: id(item["id"], "Product ID"),
        categoryDirectusId,
        slug: requiredText(item["slug"], "Product slug", 160),
        name: requiredText(item["name"], "Product name", 200),
        shortDescription: optionalText(item["short_description"], 500),
        description: optionalText(item["description"], 65_535),
        basePrice: mxnToCentavos(item["base_price"]),
        currency: "MXN" as const,
        isActive: active(item["is_active"]),
      };
    }),
    "product",
  );
  const productIds = new Set(products.map((item) => item.directusId));
  const variants = unique(
    input.variants.map((value) => {
      const item = record(value);
      const productDirectusId = id(item["product"], "Variant product");
      if (!productIds.has(productDirectusId))
        throw new Error("Variant product is missing from Directus catalog.");
      return {
        directusId: id(item["id"], "Variant ID"),
        productDirectusId,
        code: requiredText(item["code"] ?? item["sku"], "Variant code", 96),
        name: requiredText(item["name"], "Variant name", 200),
        price: mxnToCentavos(item["price"]),
        metadata: metadata(item["metadata"]),
        sortOrder: sort(item["sort_order"] ?? item["sort"]),
        isActive: active(item["is_active"]),
      };
    }),
    "variant",
  );
  return { categories, products, variants };
}
