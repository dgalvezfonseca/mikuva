import type { Category, Product } from "@/types/catalog";

import fotografias from "@/assets/historicas/Fotos-minimikuva.png";
import negativos from "@/assets/historicas/image_fx_-13.png";
import diapositivas from "@/assets/historicas/image_fx_-10-1.png";
import albumes from "@/assets/historicas/Album.png";
import ochoMm from "@/assets/historicas/IMG_0787.jpeg";
import super8 from "@/assets/historicas/IMG_0788.jpeg";
import preparacion from "@/assets/historicas/Preparacion-fotografias-mikuva.png";

/**
 * Mock data estructurado igual que el esquema previsto en base de datos
 * (categories / products / product_options). Sustituible por una consulta real
 * sin cambiar la interfaz de los componentes.
 */

export const CATEGORIES: Category[] = [
  {
    slug: "fotografias",
    name: "Fotografías",
    tagline: "Impresiones sueltas, retratos y fotos de estudio.",
    image: fotografias,
  },
  {
    slug: "negativos",
    name: "Negativos",
    tagline: "Tiras de 35mm y formatos medios.",
    image: negativos,
  },
  {
    slug: "diapositivas",
    name: "Diapositivas",
    tagline: "Transparencias montadas en cartón o plástico.",
    image: diapositivas,
  },
  {
    slug: "albumes",
    name: "Álbumes",
    tagline: "Álbumes completos, sin desmontar las fotos.",
    image: albumes,
  },
  {
    slug: "peliculas",
    name: "Películas",
    tagline: "Carretes caseros de 8mm y Super 8.",
    image: super8,
  },
];

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.name]),
);

const photoTiers = [
  { units: 100, price: 500, label: "Paquete 100" },
  { units: 500, price: 1500, label: "Paquete 500" },
  { units: 1000, price: 2500, label: "Paquete 1,000" },
  { units: 3000, price: 6750, label: "Paquete 3,000" },
  { units: 5000, price: 10000, label: "Paquete 5,000" },
];

const reelSizes = [
  { id: '3"', label: "3 pulgadas", feet: "≈ 50 pies", duration: "≈ 3 min", price: 300 },
  { id: '4"', label: "4 pulgadas", feet: "≈ 100 pies", duration: "≈ 6 min", price: 600 },
  { id: '5"', label: "5 pulgadas", feet: "≈ 200 pies", duration: "≈ 12 min", price: 1200 },
  { id: '6"', label: "6 pulgadas", feet: "≈ 300 pies", duration: "≈ 15 min", price: 1500 },
  { id: '7"', label: "7 pulgadas", feet: "≈ 400 pies", duration: "≈ 25 min", price: 2500 },
  { id: '9"', label: "9 pulgadas", feet: "≈ 590 pies", duration: "≈ 30 min", price: 3000 },
];

const commonFaqs = [
  {
    question: "¿Cómo les hago llegar mi material?",
    answer:
      "Puedes entregarlo en persona o enviarlo por paquetería. La dirección, las modalidades disponibles y la guía definitiva están [INFORMACIÓN POR CONFIRMAR].",
  },
  {
    question: "¿Me devuelven los originales?",
    answer:
      "El servicio contempla la devolución de tus originales. Los detalles de envío, seguro y tiempos están [INFORMACIÓN POR CONFIRMAR].",
  },
  {
    question: "¿Cuánto tarda el proceso?",
    answer:
      "Depende del volumen y del estado del material. Los plazos de referencia y la forma de confirmarlos están [INFORMACIÓN POR CONFIRMAR].",
  },
];

export const PRODUCTS: Product[] = [
  {
    id: "prd_fotografias",
    slug: "digitalizacion-de-fotografias",
    name: "Digitalización de fotografías",
    category: "fotografias",
    shortDescription: "Fotografías impresas escaneadas en alta resolución.",
    description:
      "Escaneamos tus fotografías impresas una por una, con limpieza previa y revisión de cada archivo. Conservamos el orden en el que nos entregas el material para que puedas reconocer cada etapa de tu historia.",
    image: fotografias,
    gallery: [fotografias, preparacion, albumes],
    priceFrom: 500,
    unitLabel: "fotografías",
    configurator: "quantity",
    tiers: photoTiers,
    includes: [
      "Escaneo individual en alta resolución",
      "Limpieza de polvo y ajuste básico de color",
      "Archivos JPG organizados por carpetas",
      "Devolución de originales en su orden",
    ],
    preparation: [
      "Separa las fotografías por grupos o épocas.",
      "Retira clips, grapas y notas adheridas.",
      "Evita pegar cinta adhesiva sobre la imagen.",
    ],
    faqs: commonFaqs,
    active: true,
  },
  {
    id: "prd_negativos",
    slug: "digitalizacion-de-negativos",
    name: "Digitalización de negativos",
    category: "negativos",
    shortDescription: "Tiras de negativos 35mm y formato medio.",
    description:
      "Digitalizamos tus negativos con equipo dedicado a película, recuperando detalle y color que muchas veces nunca se vio en papel.",
    image: negativos,
    gallery: [negativos, preparacion],
    priceFrom: 725,
    unitLabel: "cuadros",
    configurator: "quantity",
    tiers: [
      { units: 100, price: 725, label: "Paquete 100" },
      { units: 200, price: 1400, label: "Paquete 200" },
      { units: 500, price: 3475, label: "Paquete 500" },
      { units: 1000, price: 6900, label: "Paquete 1,000" },
      { units: 3000, price: 20550, label: "Paquete 3,000" },
      { units: 5000, price: 34000, label: "Paquete 5,000" },
    ],
    includes: [
      "Escaneo dedicado de película",
      "Corrección de color e inversión",
      "Archivos JPG y opción TIFF",
      "Devolución de originales en fundas",
    ],
    preparation: [
      "Mantén las tiras en sus fundas originales.",
      "No cortes cuadro por cuadro.",
      "Evita tocar la superficie con los dedos.",
    ],
    faqs: commonFaqs,
    active: true,
  },
  {
    id: "prd_diapositivas",
    slug: "digitalizacion-de-diapositivas",
    name: "Digitalización de diapositivas",
    category: "diapositivas",
    shortDescription: "Transparencias montadas, listas para verse de nuevo.",
    description:
      "Recuperamos tus diapositivas cuadro por cuadro, incluso las que llevan décadas guardadas en cajas o carruseles.",
    image: diapositivas,
    gallery: [diapositivas, preparacion],
    priceFrom: 725,
    unitLabel: "diapositivas",
    configurator: "quantity",
    tiers: [
      { units: 100, price: 725, label: "Paquete 100" },
      { units: 200, price: 1400, label: "Paquete 200" },
      { units: 500, price: 3475, label: "Paquete 500" },
      { units: 1000, price: 6900, label: "Paquete 1,000" },
      { units: 3000, price: 20550, label: "Paquete 3,000" },
      { units: 5000, price: 34000, label: "Paquete 5,000" },
    ],
    includes: [
      "Escaneo cuadro por cuadro",
      "Limpieza y ajuste de color",
      "Archivos JPG organizados",
      "Devolución de originales",
    ],
    preparation: [
      "Conserva el orden del carrusel o caja.",
      "Indica si hay marcos de vidrio.",
      "Señala las series que quieres priorizar.",
    ],
    faqs: commonFaqs,
    active: true,
  },
  {
    id: "prd_albumes",
    slug: "digitalizacion-de-albumes",
    name: "Digitalización de álbumes",
    category: "albumes",
    shortDescription: "Álbumes completos sin desmontar las fotografías.",
    description:
      "Digitalizamos álbumes completos respetando su encuadernación. Puedes elegir el escaneo página por página o foto por foto.",
    image: albumes,
    gallery: [albumes, preparacion],
    priceFrom: 1800,
    unitLabel: "fotografías",
    configurator: "quantity",
    tiers: [
      { units: 200, price: 1800, label: "Paquete 200" },
      { units: 400, price: 3200, label: "Paquete 400" },
    ],
    includes: [
      "Escaneo de página completa",
      "Opción de recorte por fotografía",
      "Manejo sin desmontar el álbum",
      "Devolución en su empaque original",
    ],
    preparation: [
      "Marca con una nota las páginas prioritarias.",
      "No retires las fotos pegadas.",
      "Avísanos si el álbum está frágil o desprendido.",
    ],
    faqs: commonFaqs,
    active: true,
  },
  {
    id: "prd_8mm",
    slug: "digitalizacion-8mm",
    name: "Digitalización de película 8mm",
    category: "peliculas",
    shortDescription: "Carretes caseros de 8mm cuadro por cuadro.",
    description:
      "Transferimos tus carretes de 8mm cuadro por cuadro, sin proyectar la película sobre una pared. El resultado es un video estable y limpio.",
    image: ochoMm,
    gallery: [ochoMm, super8, preparacion],
    priceFrom: 300,
    unitLabel: "carretes",
    configurator: "film",
    filmTypes: ["8mm"],
    reels: reelSizes,
    includes: [
      "Transferencia cuadro por cuadro",
      "Limpieza previa del carrete",
      "Archivo MP4 por carrete",
      "Devolución de carretes originales",
    ],
    preparation: [
      "Revisa que el carrete no esté pegado o mohoso.",
      "Anota el tamaño aproximado de cada carrete.",
      "Empaca los carretes en su lata o caja.",
    ],
    faqs: commonFaqs,
    active: true,
  },
  {
    id: "prd_super8",
    slug: "digitalizacion-super-8",
    name: "Digitalización de Super 8",
    category: "peliculas",
    shortDescription: "Carretes Super 8 con transferencia digital estable.",
    description:
      "Tratamiento específico para Super 8, respetando la cadencia original de la película y con revisión de cada transferencia.",
    image: super8,
    gallery: [super8, ochoMm, preparacion],
    priceFrom: 300,
    unitLabel: "carretes",
    configurator: "film",
    filmTypes: ["Super 8"],
    reels: reelSizes,
    includes: [
      "Transferencia cuadro por cuadro",
      "Ajuste de exposición",
      "Archivo MP4 por carrete",
      "Devolución de carretes originales",
    ],
    preparation: [
      "Identifica cada carrete con una etiqueta.",
      "No intentes rebobinar películas frágiles.",
      "Guarda los carretes en un lugar seco antes del envío.",
    ],
    faqs: commonFaqs,
    active: true,
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getRelatedProducts(slug: string, limit = 3): Product[] {
  return PRODUCTS.filter((p) => p.slug !== slug && p.active).slice(0, limit);
}

export const HOME_FAQS = [
  ...commonFaqs,
  {
    question: "¿En qué resolución entregan las fotografías?",
    answer:
      "La resolución exacta depende del formato y del estado del material. Las especificaciones finales de entrega están [INFORMACIÓN POR CONFIRMAR].",
  },
  {
    question: "¿Cómo recibo mis archivos?",
    answer:
      "Las opciones de descarga o entrega en una unidad física, así como su organización, están [INFORMACIÓN POR CONFIRMAR].",
  },
  {
    question: "¿Qué pasa con mi privacidad?",
    answer:
      "El aviso de privacidad explica el tratamiento y acceso a tus archivos. Después de la entrega, Mikuva conserva las copias TIFF y JPEG durante 15 días naturales para atender incidencias o correcciones y después las elimina de sus servidores.",
  },
];
