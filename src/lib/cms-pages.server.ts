import "@tanstack/react-start/server-only";

import { isCmsSlug } from "./cms-routes";
import { directusFetch } from "./directus.server";

type DirectusId = string | number;
type DirectusBoolean = boolean | 0 | 1 | null | undefined;
type DirectusCollectionResponse<T> = { data: T[] };

type DirectusPage = {
  id: DirectusId;
  slug: string | null;
  title: string | null;
  eyebrow: string | null;
  intro: string | null;
  hero_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  is_active: DirectusBoolean;
  is_indexable: DirectusBoolean;
};

type DirectusPageSection = {
  id: DirectusId;
  sort: number | null;
  page: DirectusId | null;
  block_type: string | null;
  eyebrow: string | null;
  title: string | null;
  description: string | null;
  content: unknown;
  image: string | null;
  image_alt: string | null;
  is_active: DirectusBoolean;
};

export type CmsBlockType =
  "hero" | "rich_text" | "image_text" | "benefits" | "gallery" | "faq" | "cta";

type CmsAction = { label: string; href: string };
type CmsBaseSection = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string;
};

export type CmsSection =
  | (CmsBaseSection & { type: "hero"; paragraphs: string[]; actions: CmsAction[] })
  | (CmsBaseSection & { type: "rich_text" | "image_text"; paragraphs: string[] })
  | (CmsBaseSection & { type: "benefits"; items: string[] })
  | (CmsBaseSection & { type: "gallery"; images: Array<{ url: string; alt: string }> })
  | (CmsBaseSection & { type: "faq"; items: Array<{ question: string; answer: string }> })
  | (CmsBaseSection & { type: "cta"; actions: CmsAction[] });

export type CmsPage = {
  slug: string;
  title: string;
  eyebrow: string;
  intro: string;
  heroImageUrl: string | null;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string | null;
  indexable: boolean;
  sections: CmsSection[];
};

const PAGE_FIELDS =
  "id,slug,title,eyebrow,intro,hero_image,meta_title,meta_description,og_image,is_active,is_indexable";
const SECTION_FIELDS =
  "id,sort,page,block_type,eyebrow,title,description,content,image,image_alt,is_active";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BLOCK_TYPES = new Set<CmsBlockType>([
  "hero",
  "rich_text",
  "image_text",
  "benefits",
  "gallery",
  "faq",
  "cta",
]);

function data<T>(response: DirectusCollectionResponse<T> | null): T[] {
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

function action(value: unknown): CmsAction | null {
  const item = record(value);
  const label = typeof item?.["label"] === "string" ? item["label"].trim() : "";
  const href = typeof item?.["href"] === "string" ? item["href"].trim() : "";
  return label && /^\/[a-z0-9/-]*$/.test(href) && !href.startsWith("//") ? { label, href } : null;
}

function actions(value: unknown): CmsAction[] {
  return Array.isArray(value)
    ? value.flatMap((item) => {
        const normalized = action(item);
        return normalized ? [normalized] : [];
      })
    : [];
}

function blockType(value: string | null): CmsBlockType | null {
  return value && BLOCK_TYPES.has(value as CmsBlockType) ? (value as CmsBlockType) : null;
}

function order<T extends { id: DirectusId; sort: number | null }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      (a.sort ?? Number.MAX_SAFE_INTEGER) - (b.sort ?? Number.MAX_SAFE_INTEGER) ||
      String(a.id).localeCompare(String(b.id), undefined, { numeric: true }),
  );
}

function section(section: DirectusPageSection): CmsSection | null {
  if (!enabled(section.is_active)) return null;
  const type = blockType(section.block_type);
  if (!type) return null;
  const content = record(section.content);
  const base: CmsBaseSection = {
    id: String(section.id),
    eyebrow: text(section.eyebrow),
    title: text(section.title),
    description: text(section.description),
    imageUrl: assetUrl(section.image),
    imageAlt: text(section.image_alt),
  };
  const paragraphs = strings(content?.["paragraphs"]);

  switch (type) {
    case "hero":
      return { ...base, type, paragraphs, actions: actions(content?.["actions"]) };
    case "rich_text":
    case "image_text":
      return { ...base, type, paragraphs };
    case "benefits":
      return { ...base, type, items: strings(content?.["items"]) };
    case "gallery": {
      const altTexts = strings(content?.["alt_texts"]);
      const images = strings(content?.["asset_ids"]).flatMap((assetId, index) => {
        const url = assetUrl(assetId);
        return url ? [{ url, alt: altTexts[index] || base.imageAlt || "Imagen de la página" }] : [];
      });
      return { ...base, type, images };
    }
    case "faq": {
      const items = Array.isArray(content?.["items"])
        ? content["items"].flatMap((item) => {
            const faq = record(item);
            const question = typeof faq?.["question"] === "string" ? faq["question"].trim() : "";
            const answer = typeof faq?.["answer"] === "string" ? faq["answer"].trim() : "";
            return question && answer ? [{ question, answer }] : [];
          })
        : [];
      return { ...base, type, items };
    }
    case "cta":
      return { ...base, type, actions: actions(content?.["actions"]) };
  }
}

export function toCmsPage(page: DirectusPage, sections: DirectusPageSection[]): CmsPage | null {
  const slug = text(page.slug);
  const title = text(page.title);
  if (!enabled(page.is_active) || !isCmsSlug(slug) || !title) return null;

  return {
    slug,
    title,
    eyebrow: text(page.eyebrow),
    intro: text(page.intro),
    heroImageUrl: assetUrl(page.hero_image),
    metaTitle: text(page.meta_title),
    metaDescription: text(page.meta_description),
    ogImageUrl: assetUrl(page.og_image),
    indexable: enabled(page.is_indexable),
    sections: order(sections)
      .filter((item) => item.page !== null && String(item.page) === String(page.id))
      .flatMap((item) => {
        const normalized = section(item);
        return normalized ? [normalized] : [];
      }),
  };
}

export async function getCmsPageBySlug(slug: string): Promise<CmsPage | null> {
  if (!isCmsSlug(slug)) return null;
  const pages = data(
    await directusFetch<DirectusCollectionResponse<DirectusPage>>(
      `/items/pages?filter[slug][_eq]=${encodeURIComponent(slug)}&limit=1&fields=${PAGE_FIELDS}`,
    ),
  );
  const page = pages[0];
  if (!page) return null;
  const sections = data(
    await directusFetch<DirectusCollectionResponse<DirectusPageSection>>(
      `/items/page_sections?filter[page][_eq]=${encodeURIComponent(String(page.id))}&sort=sort,id&limit=-1&fields=${SECTION_FIELDS}`,
    ),
  );
  return toCmsPage(page, sections);
}

export async function getCmsSitemapSlugs(): Promise<string[]> {
  const pages = data(
    await directusFetch<
      DirectusCollectionResponse<Pick<DirectusPage, "slug" | "is_active" | "is_indexable">>
    >("/items/pages?sort=slug&limit=-1&fields=slug,is_active,is_indexable"),
  );
  return pages.flatMap((page) =>
    enabled(page.is_active) && enabled(page.is_indexable) && isCmsSlug(text(page.slug))
      ? [text(page.slug)]
      : [],
  );
}
