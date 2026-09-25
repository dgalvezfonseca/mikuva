import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildCatalogSyncPlan, mxnToCentavos } from "./catalog-sync-core";

const catalog = () => ({
  categories: [{ id: 1, slug: "fotos", name: "Fotos", description: "", sort: 2, is_active: 1 }],
  products: [
    {
      id: 2,
      category: 1,
      slug: "fotos",
      name: "Fotos",
      short_description: "",
      description: "",
      base_price: "12.50",
      currency: "MXN",
      is_active: 1,
    },
  ],
  variants: [
    {
      id: 3,
      product: 2,
      code: "foto-10",
      name: "10 fotos",
      price: "12.50",
      metadata: { type: "simple" },
      sort_order: 1,
      is_active: 1,
    },
  ],
});

describe("Directus catalog synchronization plan", () => {
  test("accepts create and update payloads idempotently by Directus IDs", () => {
    const first = buildCatalogSyncPlan(catalog());
    const changed = catalog();
    changed.products[0]!.name = "Fotos actualizadas";
    changed.variants[0]!.price = "13.00";
    const second = buildCatalogSyncPlan(changed);
    assert.equal(first.products[0]?.directusId, second.products[0]?.directusId);
    assert.equal(second.products[0]?.name, "Fotos actualizadas");
    assert.equal(second.variants[0]?.price, 1300);
    assert.deepEqual(buildCatalogSyncPlan(changed), second);
  });

  test("preserves inactive records as non-purchasable state", () => {
    const input = catalog();
    input.products[0]!.is_active = 0;
    input.variants[0]!.is_active = 0;
    const plan = buildCatalogSyncPlan(input);
    assert.equal(plan.products[0]?.isActive, false);
    assert.equal(plan.variants[0]?.isActive, false);
  });

  test("rejects invalid money and broken Directus relationships before any database write", () => {
    assert.throws(() => mxnToCentavos("-1"));
    assert.throws(() => mxnToCentavos("Infinity"));
    assert.throws(() => mxnToCentavos("12.345"));
    const input = catalog();
    input.variants[0]!.product = 999;
    assert.throws(() => buildCatalogSyncPlan(input));
  });
});
