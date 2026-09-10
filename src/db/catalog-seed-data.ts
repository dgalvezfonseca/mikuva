import type { ProductVariantMetadata } from "./schema";

type CatalogCategorySeed = {
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
};

type CatalogProductSeed = {
  categorySlug: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  basePriceCents: number;
};

type CatalogVariantSeed = {
  productSlug: string;
  code: string;
  name: string;
  priceCents: number;
  metadata: ProductVariantMetadata;
  sortOrder: number;
};

const pesosToCents = (pesos: number) => pesos * 100;

export const CATALOG_CATEGORY_SEEDS: CatalogCategorySeed[] = [
  { slug: "fotografias", name: "Fotografías", description: "Fotografías impresas.", sortOrder: 0 },
  { slug: "negativos", name: "Negativos", description: "Negativos fotográficos.", sortOrder: 1 },
  {
    slug: "diapositivas",
    name: "Diapositivas",
    description: "Diapositivas fotográficas.",
    sortOrder: 2,
  },
  { slug: "albumes", name: "Álbumes", description: "Álbumes fotográficos.", sortOrder: 3 },
  { slug: "peliculas", name: "Películas", description: "Películas 8mm y Super 8.", sortOrder: 4 },
];

export const CATALOG_PRODUCT_SEEDS: CatalogProductSeed[] = [
  {
    categorySlug: "fotografias",
    slug: "digitalizacion-de-fotografias",
    name: "Digitalización de fotografías",
    shortDescription: "Fotografías impresas escaneadas en alta resolución.",
    description: "Servicio de digitalización de fotografías impresas.",
    basePriceCents: pesosToCents(500),
  },
  {
    categorySlug: "negativos",
    slug: "digitalizacion-de-negativos",
    name: "Digitalización de negativos",
    shortDescription: "Tiras de negativos 35mm y formato medio.",
    description: "Servicio de digitalización de negativos fotográficos.",
    basePriceCents: pesosToCents(725),
  },
  {
    categorySlug: "diapositivas",
    slug: "digitalizacion-de-diapositivas",
    name: "Digitalización de diapositivas",
    shortDescription: "Transparencias montadas, listas para verse de nuevo.",
    description: "Servicio de digitalización de diapositivas fotográficas.",
    basePriceCents: pesosToCents(725),
  },
  {
    categorySlug: "albumes",
    slug: "digitalizacion-de-albumes",
    name: "Digitalización de álbumes",
    shortDescription: "Álbumes completos sin desmontar las fotografías.",
    description: "Servicio de digitalización de álbumes fotográficos.",
    basePriceCents: pesosToCents(1800),
  },
  {
    categorySlug: "peliculas",
    slug: "digitalizacion-8mm",
    name: "Digitalización de película 8mm",
    shortDescription: "Carretes caseros de 8mm cuadro por cuadro.",
    description: "Servicio de digitalización de película 8mm.",
    basePriceCents: pesosToCents(300),
  },
  {
    categorySlug: "peliculas",
    slug: "digitalizacion-super-8",
    name: "Digitalización de Super 8",
    shortDescription: "Carretes Super 8 con transferencia digital estable.",
    description: "Servicio de digitalización de película Super 8.",
    basePriceCents: pesosToCents(300),
  },
];

function volumeVariants(
  productSlug: string,
  unitLabel: string,
  tiers: ReadonlyArray<readonly [units: number, pricePesos: number]>,
): CatalogVariantSeed[] {
  return tiers.map(([units, pricePesos], sortOrder) => ({
    productSlug,
    code: `${productSlug}:volume:${units}`,
    name: `Paquete ${units.toLocaleString("es-MX")} ${unitLabel}`,
    priceCents: pesosToCents(pricePesos),
    metadata: { type: "volume", units, unitLabel },
    sortOrder,
  }));
}

const reelTiers = [
  { diameterInches: 3, approximateFeet: 50, approximateMinutes: 3, pricePesos: 300 },
  { diameterInches: 4, approximateFeet: 100, approximateMinutes: 6, pricePesos: 600 },
  { diameterInches: 5, approximateFeet: 200, approximateMinutes: 12, pricePesos: 1200 },
  { diameterInches: 6, approximateFeet: 300, approximateMinutes: 15, pricePesos: 1500 },
  { diameterInches: 7, approximateFeet: 400, approximateMinutes: 25, pricePesos: 2500 },
  { diameterInches: 9, approximateFeet: 590, approximateMinutes: 30, pricePesos: 3000 },
] as const;

function reelVariants(
  productSlug: string,
  format: "8mm" | "super8",
  formatName: string,
): CatalogVariantSeed[] {
  return reelTiers.map((tier, sortOrder) => ({
    productSlug,
    code: `${productSlug}:reel:${format}:${tier.diameterInches}`,
    name: `Carrete ${tier.diameterInches} pulgadas — ${formatName}`,
    priceCents: pesosToCents(tier.pricePesos),
    metadata: {
      type: "reel",
      format,
      diameterInches: tier.diameterInches,
      approximateFeet: tier.approximateFeet,
      approximateMinutes: tier.approximateMinutes,
    },
    sortOrder,
  }));
}

export const CATALOG_VARIANT_SEEDS: CatalogVariantSeed[] = [
  ...volumeVariants("digitalizacion-de-fotografias", "fotografías", [
    [100, 500],
    [500, 1500],
    [1000, 2500],
    [3000, 6750],
    [5000, 10000],
  ]),
  ...volumeVariants("digitalizacion-de-negativos", "negativos", [
    [100, 725],
    [200, 1400],
    [500, 3475],
    [1000, 6900],
    [3000, 20550],
    [5000, 34000],
  ]),
  ...volumeVariants("digitalizacion-de-diapositivas", "diapositivas", [
    [100, 725],
    [200, 1400],
    [500, 3475],
    [1000, 6900],
    [3000, 20550],
    [5000, 34000],
  ]),
  ...volumeVariants("digitalizacion-de-albumes", "fotografías", [
    [200, 1800],
    [400, 3200],
  ]),
  ...reelVariants("digitalizacion-8mm", "8mm", "8mm"),
  ...reelVariants("digitalizacion-super-8", "super8", "Super 8"),
];
