import { createServerFn } from "@tanstack/react-start";

type DirectusStoreCatalog = {
  categories: Array<{
    id: string;
    slug: string;
    name: string;
    tagline: string;
    description: string;
    image: { assetId: string } | null;
  }>;
  products: Array<{
    id: string;
    categoryId: string;
    slug: string;
    name: string;
    shortDescription: string;
    image: { assetId: string } | null;
    basePrice: number | null;
    currency: string;
    configurator: string;
    active: boolean;
    variants: Array<{
      id: string;
      name: string;
      price: number | null;
      isDefault: boolean;
    }>;
  }>;
};

export type StoreCategory = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  imageUrl: string | null;
};

export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  category: Pick<StoreCategory, "id" | "slug" | "name">;
  mainImageUrl: string | null;
  priceFrom: number | null;
  currency: string;
  configurator: string;
  variants: Array<{
    id: string;
    name: string;
    price: number | null;
    isDefault: boolean;
  }>;
};

export type StoreCatalog = {
  categories: StoreCategory[];
  products: StoreProduct[];
};

function assetUrl(assetId: string): string {
  return `/api/directus-assets/${assetId}`;
}

function priceFrom(product: DirectusStoreCatalog["products"][number]): number | null {
  const variantPrices = product.variants.flatMap((variant) =>
    variant.price === null ? [] : [variant.price],
  );

  return variantPrices.length ? Math.min(...variantPrices) : product.basePrice;
}

export function toStoreCatalog(catalog: DirectusStoreCatalog): StoreCatalog {
  const categories = catalog.categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    tagline: category.tagline,
    description: category.description,
    imageUrl: category.image ? assetUrl(category.image.assetId) : null,
  }));
  const categoriesById = new Map(categories.map((category) => [category.id, category]));

  return {
    categories,
    products: catalog.products.flatMap((product) => {
      const category = categoriesById.get(product.categoryId);
      if (!product.active || !category) return [];

      return [
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          shortDescription: product.shortDescription,
          category: { id: category.id, slug: category.slug, name: category.name },
          mainImageUrl: product.image ? assetUrl(product.image.assetId) : null,
          priceFrom: priceFrom(product),
          currency: product.currency,
          configurator: product.configurator,
          variants: product.variants.map(({ id, name, price, isDefault }) => ({
            id,
            name,
            price,
            isDefault,
          })),
        },
      ];
    }),
  };
}

export const getStoreCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const { getDirectusCatalog } = await import("./catalog-directus.server");

  return toStoreCatalog(await getDirectusCatalog());
});
