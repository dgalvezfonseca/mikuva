import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import { getCmsPageBySlug, getCmsSitemapSlugs, toCmsPage } from "./cms-pages.server";
import { pageHead } from "./seo";

const originalFetch = globalThis.fetch;
const originalUrl = process.env["DIRECTUS_URL"];
const originalToken = process.env["DIRECTUS_TOKEN"];
const assetId = "646c74a7-af08-45f4-b392-61c5a0e36624";

function restoreEnvironment() {
  globalThis.fetch = originalFetch;
  if (originalUrl === undefined) delete process.env["DIRECTUS_URL"];
  else process.env["DIRECTUS_URL"] = originalUrl;
  if (originalToken === undefined) delete process.env["DIRECTUS_TOKEN"];
  else process.env["DIRECTUS_TOKEN"] = originalToken;
}

afterEach(restoreEnvironment);

function page(overrides: Record<string, unknown> = {}) {
  return {
    id: 8,
    slug: "guia-de-albumes",
    title: "Guía de álbumes",
    eyebrow: "Archivo familiar",
    intro: "Una guía clara.",
    hero_image: assetId,
    meta_title: "SEO álbumes",
    meta_description: "Descripción SEO.",
    og_image: assetId,
    is_active: 1 as const,
    is_indexable: true,
    ...overrides,
  };
}

function section(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    sort: 1,
    page: 8,
    block_type: "rich_text",
    eyebrow: null,
    title: "Texto",
    description: "Descripción",
    content: { paragraphs: ["Primer párrafo"] },
    image: null,
    image_alt: null,
    is_active: 1 as const,
    ...overrides,
  };
}

describe("CMS pages", () => {
  test("normalizes a published page, orders active sections, and proxies assets", () => {
    const result = toCmsPage(page(), [
      section({ id: 2, sort: 2, block_type: "benefits", content: { items: ["Cuidado"] } }),
      section({
        id: 1,
        sort: 1,
        block_type: "hero",
        content: { paragraphs: ["Seguro"], actions: [{ label: "Contacto", href: "/contacto" }] },
      }),
      section({ id: 3, sort: 0, block_type: "unknown" }),
      section({ id: 4, sort: 0, is_active: 0 }),
      section({ id: 5, sort: 0, page: 99 }),
      section({
        id: 6,
        sort: 3,
        block_type: "gallery",
        content: { asset_ids: [assetId, "not-an-asset"], alt_texts: ["Álbum"] },
      }),
      section({
        id: 7,
        sort: 4,
        block_type: "faq",
        content: { items: [{ question: "¿Cómo?", answer: "Con cuidado." }] },
      }),
      section({
        id: 8,
        sort: 5,
        block_type: "cta",
        content: {
          actions: [
            { label: "Abrir", href: "/contacto" },
            { label: "No", href: "javascript:alert(1)" },
          ],
        },
      }),
      section({ id: 9, sort: 6, block_type: "image_text", image: assetId }),
      section({ id: 10, sort: 7, block_type: "rich_text" }),
    ]);

    assert.equal(result?.slug, "guia-de-albumes");
    assert.equal(result?.indexable, true);
    assert.equal(result?.heroImageUrl, `/api/directus-assets/${assetId}`);
    assert.deepEqual(
      result?.sections.map((item) => item.type),
      ["hero", "benefits", "gallery", "faq", "cta", "image_text", "rich_text"],
    );
    assert.equal(
      result?.sections[2]?.type === "gallery" && result.sections[2].images[0]?.url,
      `/api/directus-assets/${assetId}`,
    );
    assert.equal(result?.sections[4]?.type === "cta" && result.sections[4].actions.length, 1);
    assert.equal(JSON.stringify(result).includes("DIRECTUS_TOKEN"), false);
    assert.equal(JSON.stringify(result).includes("http://"), false);
  });

  test("rejects missing, inactive, invalid, and reserved pages", () => {
    assert.equal(toCmsPage(page({ is_active: 0 }), []), null);
    assert.equal(toCmsPage(page({ slug: "../api" }), []), null);
    assert.equal(toCmsPage(page({ slug: "tienda" }), []), null);
    assert.equal(toCmsPage(page({ title: "" }), []), null);
  });

  test("uses the real reader contract and fails closed when Directus is unavailable", async () => {
    process.env["DIRECTUS_URL"] = "http://directus.test";
    process.env["DIRECTUS_TOKEN"] = "test-token";
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ data: [page()] }), { status: 200 });
    assert.equal((await getCmsPageBySlug("guia-de-albumes"))?.sections.length, 0);
    globalThis.fetch = async () => {
      throw new Error("Directus unavailable");
    };
    assert.equal(await getCmsPageBySlug("guia-de-albumes"), null);
  });

  test("returns only published, indexable, safe sitemap slugs", async () => {
    process.env["DIRECTUS_URL"] = "http://directus.test";
    process.env["DIRECTUS_TOKEN"] = "test-token";
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          data: [
            { slug: "guia-de-albumes", is_active: 1, is_indexable: 1 },
            { slug: "noindex", is_active: 1, is_indexable: 0 },
            { slug: "borrador", is_active: 0, is_indexable: 1 },
            { slug: "tienda", is_active: 1, is_indexable: 1 },
          ],
        }),
        { status: 200 },
      );
    assert.deepEqual(await getCmsSitemapSlugs(), ["guia-de-albumes"]);
  });

  test("returns no CMS sitemap slugs when Directus is unavailable", async () => {
    process.env["DIRECTUS_URL"] = "http://directus.test";
    process.env["DIRECTUS_TOKEN"] = "test-token";
    globalThis.fetch = async () => {
      throw new Error("Directus unavailable");
    };
    assert.deepEqual(await getCmsSitemapSlugs(), []);
  });

  test("builds SEO with canonical URLs and index controls", () => {
    const head = pageHead("SEO álbumes", "Descripción SEO.", "/guia-de-albumes", {
      robots: "noindex,follow",
    });
    assert.deepEqual(head.links, [
      { rel: "canonical", href: "https://mikuva.com/guia-de-albumes" },
    ]);
    assert.ok(
      head.meta.some((item) => item.name === "robots" && item.content === "noindex,follow"),
    );
  });
});
