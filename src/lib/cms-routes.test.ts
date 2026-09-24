import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { isCmsSlug } from "./cms-routes";

describe("CMS route policy", () => {
  test("accepts only a single safe CMS slug", () => {
    assert.equal(isCmsSlug("guia-para-albumes"), true);
    assert.equal(isCmsSlug("Guia"), false);
    assert.equal(isCmsSlug("guia--albumes"), false);
    assert.equal(isCmsSlug("../api"), false);
    assert.equal(isCmsSlug("https://example.com"), false);
    assert.equal(isCmsSlug("guia%2fprivada"), false);
  });

  test("keeps every application route reserved", () => {
    for (const slug of [
      "api",
      "carrito",
      "checkout",
      "pago",
      "pedido",
      "producto",
      "tienda",
      "como-funciona",
      "faq",
      "nosotros",
      "servicios",
      "sitemap.xml",
      "robots.txt",
    ]) {
      assert.equal(isCmsSlug(slug), false, slug);
    }
  });
});
