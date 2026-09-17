import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { getDirectusCatalog } from "./catalog-directus.server";

const originalFetch = globalThis.fetch;
const originalUrl = process.env["DIRECTUS_URL"];
const originalToken = process.env["DIRECTUS_TOKEN"];

function restoreDirectusEnvironment() {
  if (originalUrl === undefined) delete process.env["DIRECTUS_URL"];
  else process.env["DIRECTUS_URL"] = originalUrl;
  if (originalToken === undefined) delete process.env["DIRECTUS_TOKEN"];
  else process.env["DIRECTUS_TOKEN"] = originalToken;
  globalThis.fetch = originalFetch;
}

describe("Directus catalog", () => {
  test("normalizes related active catalog content from the four collection queries", async () => {
    process.env["DIRECTUS_URL"] = "http://directus.test";
    process.env["DIRECTUS_TOKEN"] = "test-token";
    const requestedPaths: string[] = [];
    const responses: Record<string, unknown[]> = {
      "/items/categories": [
        {
          id: 10,
          slug: "fotografias",
          name: "Fotos desde Directus",
          tagline: "Editorial",
          description: "Descripción desde Directus",
          image: "category-file",
          is_active: true,
        },
        { id: 11, slug: "oculta", name: "Oculta", is_active: false },
      ],
      "/items/products": [
        {
          id: 20,
          category: 10,
          slug: "fotos-directus",
          name: "Producto desde Directus",
          short_description: "Resumen",
          description: "Detalle",
          base_price: "1250.50",
          currency: "MXN",
          image: "cover-file",
          is_featured: true,
          is_active: true,
          unit_label: "fotografías",
          configurator: "quantity",
          includes: ["Escaneo"],
          preparation: ["Ordena"],
          faqs: [{ question: "¿Pregunta?", answer: "Respuesta" }],
          film_types: [],
        },
        { id: 21, category: 10, slug: "oculto", name: "Oculto", is_active: false },
      ],
      "/items/product_variants": [
        {
          id: 30,
          product: 20,
          name: "Paquete editorial",
          sku: "SKU-30",
          code: "directus-30",
          price: "1250.50",
          is_default: true,
          is_active: true,
          metadata: { units: 100 },
        },
        { id: 31, product: 20, name: "Inactiva", is_active: false },
      ],
      "/items/product_images": [
        { id: 40, product: 20, file: "gallery-file", alt_text: "Foto del producto" },
      ],
    };

    globalThis.fetch = async (input) => {
      const url = new URL(input instanceof Request ? input.url : input.toString());
      requestedPaths.push(`${url.pathname}?${url.searchParams.toString()}`);
      return new Response(JSON.stringify({ data: responses[url.pathname] ?? [] }), {
        headers: { "Content-Type": "application/json" },
      });
    };

    try {
      const catalog = await getDirectusCatalog();

      assert.deepEqual(catalog.categories, [
        {
          id: "10",
          slug: "fotografias",
          name: "Fotos desde Directus",
          tagline: "Editorial",
          description: "Descripción desde Directus",
          image: { assetId: "category-file" },
        },
      ]);
      assert.equal(catalog.products.length, 1);
      assert.equal(catalog.products[0]?.name, "Producto desde Directus");
      assert.equal(catalog.products[0]?.basePrice, 1250.5);
      assert.deepEqual(catalog.products[0]?.gallery, [
        { id: "40", assetId: "gallery-file", altText: "Foto del producto" },
      ]);
      assert.deepEqual(catalog.products[0]?.variants, [
        {
          id: "30",
          name: "Paquete editorial",
          sku: "SKU-30",
          code: "directus-30",
          price: 1250.5,
          isDefault: true,
          metadata: { units: 100 },
        },
      ]);
      assert.equal(requestedPaths.length, 4);
      assert.ok(
        requestedPaths.every(
          (path) =>
            path.includes("filter%5Bis_active%5D%5B_eq%5D=true") ||
            path.startsWith("/items/product_images?"),
        ),
      );
    } finally {
      restoreDirectusEnvironment();
    }
  });

  test("returns an empty catalog when Directus is unavailable", async () => {
    process.env["DIRECTUS_URL"] = "http://directus.test";
    process.env["DIRECTUS_TOKEN"] = "test-token";
    globalThis.fetch = async () => {
      throw new Error("Directus unavailable");
    };

    try {
      assert.deepEqual(await getDirectusCatalog(), { categories: [], products: [] });
    } finally {
      restoreDirectusEnvironment();
    }
  });
});
