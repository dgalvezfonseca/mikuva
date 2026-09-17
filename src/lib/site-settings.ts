import { createServerFn } from "@tanstack/react-start";

export type FooterSiteSettings = {
  name: string;
  phone: string;
  phoneHref: string;
  address: string;
};

export const getFooterSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { getSiteSettings } = await import("./site-settings.server");
  const { name, phone, phoneHref, address } = await getSiteSettings();

  return { name, phone, phoneHref, address };
});
