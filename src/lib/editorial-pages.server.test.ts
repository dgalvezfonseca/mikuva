import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import { getEditorialPageBySlug, toEditorialPage } from "./editorial-pages.server";

const originalFetch = globalThis.fetch;
const originalUrl = process.env["DIRECTUS_URL"];
const originalToken = process.env["DIRECTUS_TOKEN"];

function restoreEnvironment() {
  globalThis.fetch = originalFetch;
  if (originalUrl === undefined) delete process.env["DIRECTUS_URL"];
  else process.env["DIRECTUS_URL"] = originalUrl;
  if (originalToken === undefined) delete process.env["DIRECTUS_TOKEN"];
  else process.env["DIRECTUS_TOKEN"] = originalToken;
}

afterEach(restoreEnvironment);

describe("Directus editorial pages", () => {
  test("normalizes SQLite booleans, page relations, sorting, and safe asset URLs", () => {
    const page = toEditorialPage(
      "como-funciona",
      [
        {
          id: 4,
          sort: 1,
          slug: "como-funciona",
          title: "Proceso",
          eyebrow: "Guía",
          intro: "Introducción",
          hero_image: "646c74a7-af08-45f4-b392-61c5a0e36624",
          meta_title: "Cómo funciona",
          meta_description: "Descripción",
          og_image: null,
          is_active: 1,
        },
        {
          id: 7,
          sort: 2,
          slug: "como-funciona",
          title: "No visible",
          eyebrow: null,
          intro: null,
          hero_image: null,
          meta_title: null,
          meta_description: null,
          og_image: null,
          is_active: 0,
        },
      ],
      [
        {
          id: 2,
          sort: 1,
          page: 4,
          section_key: "packing",
          eyebrow: null,
          title: "Empaque",
          description: null,
          content: { items: ["Segundo", "Primero"], cta: "" },
          image: "b606b912-79b1-4a99-b473-5b0a91f34248",
          image_alt: "Material preparado",
          is_active: true,
        },
        {
          id: 1,
          sort: 1,
          page: 4,
          section_key: "before_shipping",
          eyebrow: null,
          title: "Antes de enviar",
          description: "Confirma la dirección.",
          content: { cta: "Resolver una duda" },
          image: null,
          image_alt: null,
          is_active: 1,
        },
        {
          id: 3,
          sort: 0,
          page: 99,
          section_key: "orphan",
          eyebrow: null,
          title: "No corresponde",
          description: null,
          content: null,
          image: null,
          image_alt: null,
          is_active: 1,
        },
        {
          id: 4,
          sort: 0,
          page: 4,
          section_key: "inactive",
          eyebrow: null,
          title: "No visible",
          description: null,
          content: null,
          image: null,
          image_alt: null,
          is_active: 0,
        },
      ],
      [
        {
          id: 2,
          sort: 1,
          context: "how_it_works",
          title: "Segundo",
          text: "Paso 2",
          is_active: true,
        },
        {
          id: 1,
          sort: 1,
          context: "how_it_works",
          title: "Primero",
          text: "Paso 1",
          is_active: 1,
        },
        {
          id: 3,
          sort: 0,
          context: "home",
          title: "Home",
          text: "No debe incluirse",
          is_active: 1,
        },
        {
          id: 4,
          sort: 0,
          context: "how_it_works",
          title: "Inactivo",
          text: "No debe incluirse",
          is_active: false,
        },
      ],
      [],
    );

    assert.deepEqual(page, {
      slug: "como-funciona",
      title: "Proceso",
      eyebrow: "Guía",
      intro: "Introducción",
      heroImageUrl: "/api/directus-assets/646c74a7-af08-45f4-b392-61c5a0e36624",
      metaTitle: "Cómo funciona",
      metaDescription: "Descripción",
      ogImageUrl: null,
      sections: [
        {
          key: "before_shipping",
          eyebrow: "",
          title: "Antes de enviar",
          description: "Confirma la dirección.",
          items: [],
          paragraphs: [],
          cta: "Resolver una duda",
          imageUrl: null,
          imageAlt: "",
        },
        {
          key: "packing",
          eyebrow: "",
          title: "Empaque",
          description: "",
          items: ["Segundo", "Primero"],
          paragraphs: [],
          cta: "",
          imageUrl: "/api/directus-assets/b606b912-79b1-4a99-b473-5b0a91f34248",
          imageAlt: "Material preparado",
        },
      ],
      processSteps: [
        { title: "Primero", text: "Paso 1" },
        { title: "Segundo", text: "Paso 2" },
      ],
      faqs: [],
    });
  });

  test("returns only active FAQs in sort/id order and handles malformed optional content", () => {
    const page = toEditorialPage(
      "faq",
      [
        {
          id: 5,
          sort: null,
          slug: "faq",
          title: "FAQ",
          eyebrow: null,
          intro: null,
          hero_image: "not-a-uuid",
          meta_title: null,
          meta_description: null,
          og_image: "not-a-uuid",
          is_active: true,
        },
      ],
      [],
      [],
      [
        { id: 2, sort: 1, question: "Dos", answer: "Respuesta dos", is_active: 1 },
        { id: 1, sort: 1, question: "Uno", answer: "Respuesta uno", is_active: true },
        { id: 3, sort: 0, question: "No", answer: "Inactiva", is_active: 0 },
        { id: 4, sort: 0, question: null, answer: "Inválida", is_active: 1 },
      ],
    );

    assert.equal(page?.heroImageUrl, null);
    assert.equal(page?.ogImageUrl, null);
    assert.deepEqual(page?.faqs, [
      { question: "Uno", answer: "Respuesta uno" },
      { question: "Dos", answer: "Respuesta dos" },
    ]);
    assert.equal(JSON.stringify(page).includes("DIRECTUS_TOKEN"), false);
    assert.equal(JSON.stringify(page).includes("http://"), false);
  });

  test("returns null when Directus fails without leaking its response", async () => {
    process.env["DIRECTUS_URL"] = "http://directus.test";
    process.env["DIRECTUS_TOKEN"] = "test-token";
    globalThis.fetch = async () => {
      throw new Error("Directus unavailable");
    };

    assert.equal(await getEditorialPageBySlug("faq"), null);
  });
});
