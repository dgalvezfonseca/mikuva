import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { toProductDetail, toTransactionalConfig } from "./product-detail";
import type { DirectusCatalog } from "./catalog-directus.server";
import { getReelVariantCode } from "./catalog-variant-code";

const catalog: DirectusCatalog = {
  categories: [
    {
      id: "category-1",
      slug: "fotografias",
      name: "Fotografías desde Directus",
      tagline: "",
      description: "",
      image: null,
    },
  ],
  products: [
    {
      id: "product-1",
      categoryId: "category-1",
      slug: "producto-directus",
      name: "Producto desde Directus",
      shortDescription: "Descripción breve",
      description: "<p>Texto <strong>editorial</strong></p>",
      image: { assetId: "main-asset" },
      gallery: [
        { id: "image-1", assetId: "main-asset", altText: "Portada editorial" },
        { id: "image-2", assetId: "gallery-asset", altText: "" },
      ],
      basePrice: 1200,
      currency: "MXN",
      featured: true,
      unitLabel: "fotografías",
      configurator: "quantity",
      active: true,
      includes: ["Escaneo"],
      preparation: ["Ordena"],
      faqs: [{ question: "¿Pregunta?", answer: "Respuesta" }],
      filmTypes: ["8mm"],
      metaTitle: "Título SEO",
      metaDescription: "Descripción SEO",
      ogImage: { assetId: "og-asset" },
      variants: [
        {
          id: "variant-1",
          name: "Paquete",
          sku: "",
          code: "",
          price: 700,
          isDefault: true,
          metadata: null,
        },
      ],
    },
    {
      id: "inactive-product",
      categoryId: "category-1",
      slug: "inactivo",
      name: "No accesible",
      shortDescription: "",
      description: "",
      image: null,
      gallery: [],
      basePrice: 100,
      currency: "MXN",
      featured: false,
      unitLabel: "",
      configurator: "quantity",
      active: false,
      includes: [],
      preparation: [],
      faqs: [],
      filmTypes: [],
      metaTitle: "",
      metaDescription: "",
      ogImage: null,
      variants: [],
    },
    {
      id: "without-image",
      categoryId: "category-1",
      slug: "sin-imagen",
      name: "Sin imagen",
      shortDescription: "",
      description: "",
      image: null,
      gallery: [],
      basePrice: 900,
      currency: "MXN",
      featured: false,
      unitLabel: "",
      configurator: "quantity",
      active: true,
      includes: [],
      preparation: [],
      faqs: [],
      filmTypes: [],
      metaTitle: "",
      metaDescription: "",
      ogImage: null,
      variants: [],
    },
  ],
};

describe("product detail", () => {
  test("adapts active Directus editorial content, gallery, and prices", () => {
    const detail = toProductDetail(catalog, "producto-directus");

    assert.deepEqual(detail, {
      id: "product-1",
      slug: "producto-directus",
      name: "Producto desde Directus",
      shortDescription: "Descripción breve",
      description: "Texto editorial",
      category: { id: "category-1", slug: "fotografias", name: "Fotografías desde Directus" },
      unitLabel: "fotografías",
      configurator: "quantity",
      mainImageUrl: "/api/directus-assets/main-asset",
      gallery: [
        { url: "/api/directus-assets/main-asset", alt: "Portada editorial" },
        {
          url: "/api/directus-assets/gallery-asset",
          alt: "Producto desde Directus, imagen 2",
        },
      ],
      priceFrom: 700,
      currency: "MXN",
      includes: ["Escaneo"],
      preparation: ["Ordena"],
      faqs: [{ question: "¿Pregunta?", answer: "Respuesta" }],
      filmTypes: ["8mm"],
      metaTitle: "Título SEO",
      metaDescription: "Descripción SEO",
      ogImageUrl: "/api/directus-assets/og-asset",
      variants: [],
    });
  });

  test("rejects unavailable products and keeps missing images safe", () => {
    assert.equal(toProductDetail(catalog, "inactivo"), null);
    assert.equal(toProductDetail(catalog, "no-existe"), null);
    assert.equal(toProductDetail({ categories: [], products: [] }, "producto-directus"), null);

    const withoutImage = toProductDetail(catalog, "sin-imagen");
    assert.equal(withoutImage?.mainImageUrl, null);
    assert.deepEqual(withoutImage?.gallery, []);
    assert.equal(withoutImage?.priceFrom, 900);
  });

  test("keeps film variant codes independent from Directus editorial film types", () => {
    const transactionalConfig = toTransactionalConfig({
      slug: "digitalizacion-super-8",
      name: "Super 8 transaccional",
      image: "/legacy-super-8.jpg",
      filmTypes: ["Super 8"],
      tiers: [],
      reels: [],
    });
    const editedCatalog: DirectusCatalog = {
      ...catalog,
      products: catalog.products.map((product) =>
        product.slug === "producto-directus" ? { ...product, filmTypes: ["16mm"] } : product,
      ),
    };

    assert.deepEqual(toProductDetail(editedCatalog, "producto-directus")?.filmTypes, ["16mm"]);
    assert.deepEqual(transactionalConfig?.filmTypes, ["Super 8"]);
    assert.equal(
      getReelVariantCode(
        transactionalConfig?.slug ?? "",
        transactionalConfig?.filmTypes[0] ?? "",
        '3"',
      ),
      "digitalizacion-super-8:reel:super8:3",
    );
  });
});
