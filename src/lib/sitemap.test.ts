import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { sitemapUrls, sitemapXml } from "./sitemap";

describe("sitemap", () => {
  test("includes only canonical public URLs and active catalog products", () => {
    const urls = sitemapUrls();

    assert.ok(urls.includes("https://mikuva.com/"));
    assert.ok(urls.includes("https://mikuva.com/tienda"));
    assert.ok(urls.includes("https://mikuva.com/producto/digitalizacion-de-fotografias"));
    assert.ok(!urls.includes("https://mikuva.com/checkout"));
    assert.ok(!urls.includes("https://mikuva.com/pago/exitoso"));
    assert.ok(!urls.includes("https://mikuva.com/producto/prueba-de-pago"));
  });

  test("renders a valid XML sitemap document", () => {
    assert.ok(sitemapXml().startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(sitemapXml().includes("<urlset"));
    assert.ok(sitemapXml().includes("</urlset>"));
  });
});
