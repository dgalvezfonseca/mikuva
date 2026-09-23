import "@tanstack/react-start/server-only";

import { directusFetch } from "./directus.server";

type DirectusId = number | string;
type DirectusBoolean = boolean | 0 | 1 | null | undefined;

type DirectusCollectionResponse<T> = { data: T[] };

type DirectusPage = {
  id: DirectusId;
  sort: number | null;
  slug: string | null;
  title: string | null;
  eyebrow: string | null;
  intro: string | null;
  hero_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  is_active: DirectusBoolean;
};

type DirectusPageSection = {
  id: DirectusId;
  sort: number | null;
  page: DirectusId | null;
  section_key: string | null;
  eyebrow: string | null;
  title: string | null;
  description: string | null;
  content: unknown;
  image: string | null;
  image_alt: string | null;
  is_active: DirectusBoolean;
};

type DirectusProcessStep = {
  id: DirectusId;
  sort: number | null;
  context: string | null;
  title: string | null;
  text: string | null;
  is_active: DirectusBoolean;
};

type DirectusFaq = {
  id: DirectusId;
  sort: number | null;
  question: string | null;
  answer: string | null;
  is_active: DirectusBoolean;
};

export type EditorialSection = {
  key: string;
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
  paragraphs: string[];
  cta: string;
  imageUrl: string | null;
  imageAlt: string;
};

export type EditorialPage = {
  slug: string;
  title: string;
  eyebrow: string;
  intro: string;
  heroImageUrl: string | null;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string | null;
  sections: EditorialSection[];
  processSteps: Array<{ title: string; text: string }>;
  faqs: Array<{ question: string; answer: string }>;
};

const PAGE_FIELDS =
  "id,sort,slug,title,eyebrow,intro,hero_image,meta_title,meta_description,og_image,is_active";
const SECTION_FIELDS =
  "id,sort,page,section_key,eyebrow,title,description,content,image,image_alt,is_active";
const PROCESS_STEP_FIELDS = "id,sort,context,title,text,is_active";
const FAQ_FIELDS = "id,sort,question,answer,is_active";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function responseData<T>(response: DirectusCollectionResponse<T> | null): T[] {
  return Array.isArray(response?.data) ? response.data : [];
}

function text(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function enabled(value: DirectusBoolean): boolean {
  return value === true || value === 1;
}

function assetUrl(value: string | null): string | null {
  const assetId = text(value);
  return UUID.test(assetId) ? `/api/directus-assets/${assetId}` : null;
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];
}

function order<T extends { id: DirectusId; sort: number | null }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      (a.sort ?? Number.MAX_SAFE_INTEGER) - (b.sort ?? Number.MAX_SAFE_INTEGER) ||
      String(a.id).localeCompare(String(b.id), undefined, { numeric: true }),
  );
}

function sectionContent(value: unknown) {
  const content = record(value);
  return {
    items: strings(content?.["items"]),
    paragraphs: strings(content?.["paragraphs"]),
    cta: typeof content?.["cta"] === "string" ? content["cta"].trim() : "",
  };
}

export function toEditorialPage(
  slug: string,
  pages: DirectusPage[],
  sections: DirectusPageSection[],
  processSteps: DirectusProcessStep[],
  faqs: DirectusFaq[],
): EditorialPage | null {
  const page = pages.find(
    (item) => enabled(item.is_active) && text(item.slug) === slug && text(item.title),
  );
  if (!page) return null;

  const pageSections = order(
    sections.filter(
      (section) =>
        enabled(section.is_active) &&
        section.page !== null &&
        String(section.page) === String(page.id) &&
        Boolean(text(section.section_key)),
    ),
  ).map((section) => {
    const content = sectionContent(section.content);
    return {
      key: text(section.section_key),
      eyebrow: text(section.eyebrow),
      title: text(section.title),
      description: text(section.description),
      ...content,
      imageUrl: assetUrl(section.image),
      imageAlt: text(section.image_alt),
    };
  });

  return {
    slug: text(page.slug),
    title: text(page.title),
    eyebrow: text(page.eyebrow),
    intro: text(page.intro),
    heroImageUrl: assetUrl(page.hero_image),
    metaTitle: text(page.meta_title),
    metaDescription: text(page.meta_description),
    ogImageUrl: assetUrl(page.og_image),
    sections: pageSections,
    processSteps:
      slug === "como-funciona"
        ? order(
            processSteps.filter(
              (step) =>
                enabled(step.is_active) &&
                text(step.context) === "how_it_works" &&
                Boolean(text(step.title)) &&
                Boolean(text(step.text)),
            ),
          ).map((step) => ({ title: text(step.title), text: text(step.text) }))
        : [],
    faqs:
      slug === "faq"
        ? order(
            faqs.filter(
              (faq) =>
                enabled(faq.is_active) && Boolean(text(faq.question)) && Boolean(text(faq.answer)),
            ),
          ).map((faq) => ({ question: text(faq.question), answer: text(faq.answer) }))
        : [],
  };
}

export async function getEditorialPageBySlug(slug: string): Promise<EditorialPage | null> {
  const [pages, sections, processSteps, faqs] = await Promise.all([
    directusFetch<DirectusCollectionResponse<DirectusPage>>(
      `/items/pages?sort=sort,id&limit=-1&fields=${PAGE_FIELDS}`,
    ),
    directusFetch<DirectusCollectionResponse<DirectusPageSection>>(
      `/items/page_sections?sort=sort,id&limit=-1&fields=${SECTION_FIELDS}`,
    ),
    directusFetch<DirectusCollectionResponse<DirectusProcessStep>>(
      `/items/process_steps?sort=sort,id&limit=-1&fields=${PROCESS_STEP_FIELDS}`,
    ),
    directusFetch<DirectusCollectionResponse<DirectusFaq>>(
      `/items/faqs?sort=sort,id&limit=-1&fields=${FAQ_FIELDS}`,
    ),
  ]);

  return toEditorialPage(
    slug,
    responseData(pages),
    responseData(sections),
    responseData(processSteps),
    responseData(faqs),
  );
}
