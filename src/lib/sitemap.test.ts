import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildSitemapUrls, sitemapXml } from "./sitemap";

describe("sitemap", () => {
  test("includes only canonical public URLs, active products, and eligible CMS pages", () => {
    const urls = buildSitemapUrls(["guia-de-albumes", "guia-de-albumes"]);

    assert.ok(urls.includes("https://mikuva.com/"));
    assert.ok(urls.includes("https://mikuva.com/tienda"));
    assert.ok(urls.includes("https://mikuva.com/producto/digitalizacion-de-fotografias"));
    assert.ok(!urls.includes("https://mikuva.com/checkout"));
    assert.ok(!urls.includes("https://mikuva.com/pago/exitoso"));
    assert.ok(!urls.includes("https://mikuva.com/producto/prueba-de-pago"));
    assert.ok(urls.includes("https://mikuva.com/guia-de-albumes"));
    assert.equal(urls.filter((url) => url === "https://mikuva.com/guia-de-albumes").length, 1);
  });

  test("renders a valid XML sitemap document", async () => {
    const xml = await sitemapXml();
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(xml.includes("<urlset"));
    assert.ok(xml.includes("</urlset>"));
  });
});
