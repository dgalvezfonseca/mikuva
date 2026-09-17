import "@tanstack/react-start/server-only";

import { PRICING_NOTE, SITE } from "../constants/site";
import { directusFetch } from "./directus.server";

type DirectusSiteSettings = {
  id: number;
  site_name: string | null;
  tagline: string | null;
  site_description: string | null;
  contact_phone: string | null;
  phone_href: string | null;
  address: string | null;
  pricing_note: string | null;
};

type DirectusSingletonResponse<T> = {
  data: T;
};

export type SiteSettings = {
  name: string;
  tagline: string;
  description: string;
  phone: string;
  phoneHref: string;
  address: string;
  pricingNote: string;
};

const FALLBACK_SITE_SETTINGS: SiteSettings = {
  name: SITE.name,
  tagline: SITE.tagline,
  description: SITE.description,
  phone: SITE.phone,
  phoneHref: SITE.phoneHref,
  address: SITE.address,
  pricingNote: PRICING_NOTE,
};

function valueOrFallback(value: string | null | undefined, fallback: string): string {
  const normalized = value?.trim();

  return normalized || fallback;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const response = await directusFetch<DirectusSingletonResponse<DirectusSiteSettings>>(
    "/items/site_settings?fields=id,site_name,tagline,site_description,contact_phone,phone_href,address,pricing_note",
  );

  if (!response?.data) {
    return FALLBACK_SITE_SETTINGS;
  }

  const settings = response.data;

  return {
    name: valueOrFallback(settings.site_name, SITE.name),
    tagline: valueOrFallback(settings.tagline, SITE.tagline),
    description: valueOrFallback(settings.site_description, SITE.description),
    phone: valueOrFallback(settings.contact_phone, SITE.phone),
    phoneHref: valueOrFallback(settings.phone_href, SITE.phoneHref),
    address: valueOrFallback(settings.address, SITE.address),
    pricingNote: valueOrFallback(settings.pricing_note, PRICING_NOTE),
  };
}
