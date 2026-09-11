import { SITE } from "@/constants/site";

export function pageHead(
  title: string,
  description: string,
  pathname: string,
  options?: { noindex?: boolean },
) {
  const canonicalUrl = new URL(pathname, SITE.url).toString();
  const fullTitle = `${title} — Mikuva`;

  return {
    meta: [
      { title: fullTitle },
    { name: "description", content: description },
      { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
      { property: "og:url", content: canonicalUrl },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
      ...(options?.noindex ? [{ name: "robots", content: "noindex,nofollow" }] : []),
    ],
    links: [{ rel: "canonical", href: canonicalUrl }],
  };
}
