export const CMS_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const RESERVED_CMS_SLUGS = new Set([
  "api",
  "aviso-de-privacidad",
  "carrito",
  "checkout",
  "como-funciona",
  "contacto",
  "faq",
  "index",
  "llms.txt",
  "nosotros",
  "pago",
  "pedido",
  "politica-de-cookies",
  "politica-de-devoluciones",
  "politica-de-envios",
  "producto",
  "robots.txt",
  "servicios",
  "sitemap.xml",
  "terminos-de-servicio",
  "terminos-y-condiciones",
  "tienda",
]);

export function isCmsSlug(slug: string): boolean {
  return CMS_SLUG_PATTERN.test(slug) && !RESERVED_CMS_SLUGS.has(slug);
}
