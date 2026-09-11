export const SITE = {
  name: "Mikuva",
  url: "https://mikuva.com",
  tagline: "Preservación y digitalización de recuerdos familiares",
  description:
    "Digitalizamos fotografías, negativos, diapositivas, álbumes y películas 8mm y Super 8 para conservar tus historias por generaciones.",
  phone: "+52 (55) 3004-2777",
  phoneHref: "+525530042777",
  address: "Av. Miguel Hidalgo 24-B, Lago de Gpe, Cuautitlán Izcalli, EdoMex, 54760",
  social: {
    instagram: "[INSTAGRAM]",
    facebook: "[FACEBOOK]",
  },
} as const;

export const MAIN_NAV = [
  { label: "Inicio", to: "/" },
  { label: "Servicios", to: "/servicios" },
  { label: "Tienda", to: "/tienda" },
  { label: "Cómo funciona", to: "/como-funciona" },
  { label: "Preguntas frecuentes", to: "/faq" },
  { label: "Nosotros", to: "/nosotros" },
  { label: "Contacto", to: "/contacto" },
] as const;

export const LEGAL_NAV = [
  { label: "Aviso de privacidad", to: "/aviso-de-privacidad" },
  { label: "Términos y condiciones", to: "/terminos-y-condiciones" },
  { label: "Política de envíos", to: "/politica-de-envios" },
  { label: "Política de devoluciones", to: "/politica-de-devoluciones" },
] as const;

export const PRICING_NOTE =
  "Los precios de digitalización se calculan según la información y cantidad declaradas. Si el material recibido difiere en cantidad, formato o tipo, te comunicaremos cualquier ajuste para obtener tu autorización antes de continuar.";
