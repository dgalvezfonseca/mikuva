import { SITE } from "@/constants/site";
import { PRODUCTS } from "@/data/catalog";

const PUBLIC_PATHS = [
  "/",
  "/servicios",
  "/tienda",
  "/como-funciona",
  "/nosotros",
  "/faq",
  "/contacto",
  "/aviso-de-privacidad",
  "/terminos-y-condiciones",
  "/politica-de-envios",
  "/politica-de-devoluciones",
] as const;

function escapeXml(value: string): string {
  return value.replace(/[<>&'\"]/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      '"': "&quot;",
    };
    return entities[character] ?? character;
  });
}

export function sitemapUrls(): string[] {
  return [
    ...PUBLIC_PATHS.map((path) => new URL(path, SITE.url).toString()),
    ...PRODUCTS.filter((product) => product.active).map((product) =>
      new URL(`/producto/${product.slug}`, SITE.url).toString(),
    ),
  ];
}

export function sitemapXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapUrls()
    .map((url) => `\n  <url><loc>${escapeXml(url)}</loc></url>`)
    .join("")}\n</urlset>\n`;
}
