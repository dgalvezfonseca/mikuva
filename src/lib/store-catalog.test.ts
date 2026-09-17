import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { toStoreCatalog } from "./store-catalog";

const activeCatalog = {
  categories: [
    {
      id: "category-1",
      slug: "fotografias",
      name: "Fotografías desde Directus",
      tagline: "",
      description: "",
      image: { assetId: "category-asset" },
    },
  ],
  products: [
    {
      id: "product-1",
      categoryId: "category-1",
      slug: "digitalizacion-directus",
      name: "Producto desde Directus",
      shortDescription: "Descripción breve",
      image: { assetId: "product-asset" },
      basePrice: 1000,
      currency: "MXN",
      configurator: "quantity",
      active: true,
      variants: [
        { id: "variant-1", name: "Paquete", price: 700, isDefault: true },
        { id: "variant-2", name: "Alternativa", price: 900, isDefault: false },
      ],
    },
    {
      id: "inactive-product",
      categoryId: "category-1",
      slug: "no-debe-mostrarse",
      name: "Inactivo",
      shortDescription: "",
      image: null,
      basePrice: null,
      currency: "MXN",
      configurator: "quantity",
      active: false,
      variants: [],
    },
    {
      id: "product-without-image",
      categoryId: "category-1",
      slug: "sin-imagen",
      name: "Producto sin imagen",
      shortDescription: "",
      image: null,
      basePrice: null,
      currency: "MXN",
      configurator: "quantity",
      active: true,
      variants: [],
    },
  ],
};

describe("store catalog", () => {
  test("adapts active Directus products and assets for the store", () => {
    const catalog = toStoreCatalog(activeCatalog);

    assert.deepEqual(catalog.categories, [
      {
        id: "category-1",
        slug: "fotografias",
        name: "Fotografías desde Directus",
        tagline: "",
        description: "",
        imageUrl: "/api/directus-assets/category-asset",
      },
    ]);
    assert.deepEqual(catalog.products[0], {
      id: "product-1",
      slug: "digitalizacion-directus",
      name: "Producto desde Directus",
      shortDescription: "Descripción breve",
      category: { id: "category-1", slug: "fotografias", name: "Fotografías desde Directus" },
      mainImageUrl: "/api/directus-assets/product-asset",
      priceFrom: 700,
      currency: "MXN",
      configurator: "quantity",
      variants: [
        { id: "variant-1", name: "Paquete", price: 700, isDefault: true },
        { id: "variant-2", name: "Alternativa", price: 900, isDefault: false },
      ],
    });
  });

  test("keeps empty catalogs and products without a main image safe", () => {
    assert.deepEqual(toStoreCatalog({ categories: [], products: [] }), {
      categories: [],
      products: [],
    });
    const catalog = toStoreCatalog(activeCatalog);

    assert.equal(
      catalog.products.some((product) => product.id === "inactive-product"),
      false,
    );
    assert.equal(
      catalog.products.find((product) => product.id === "product-without-image")?.mainImageUrl,
      null,
    );
  });
});
