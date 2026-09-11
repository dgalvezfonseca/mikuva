import { createFileRoute, Link } from "@tanstack/react-router";

import FAQAccordion from "@/components/faq/FAQAccordion";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";
import type { FaqItem } from "@/types/catalog";

const FAQS: FaqItem[] = [
  {
    question: "¿Cómo envío mis fotografías?",
    answer: "Antes de enviar, recibirás instrucciones de empaque específicas para tu material.",
  },
  {
    question: "¿Mis originales regresan?",
    answer: "Sí, el servicio contempla la devolución de los originales.",
  },
  {
    question: "¿Qué resolución utilizan?",
    answer: "La resolución depende del formato, tamaño y estado del material.",
  },
  {
    question: "¿Cuánto tarda el proceso?",
    answer: "El tiempo depende del volumen, formato y condición del material.",
  },
  {
    question: "¿Puedo enviar álbumes completos?",
    answer:
      "Sí. Mikuva contempla la digitalización de álbumes sin desmontar las fotografías. Revisaremos antes el tamaño y el estado de la encuadernación.",
  },
  {
    question: "¿Digitalizan negativos?",
    answer:
      "Sí. El catálogo contempla tiras de 35 mm y formatos medios; confirma tu formato exacto antes del envío.",
  },
  {
    question: "¿Digitalizan Super 8?",
    answer: "Sí. El catálogo contempla película 8 mm y Super 8 en distintos tamaños de carrete.",
  },
  {
    question: "¿Cómo calculo cuántas fotografías tengo?",
    answer:
      "Cuenta una muestra pequeña y mide el grosor del montón para obtener una aproximación. También puedes enviarnos fotografías del material para orientarte.",
  },
  {
    question: "¿Qué pasa si tengo más fotografías que mi paquete?",
    answer: "No se hará un cargo sin tu autorización.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () =>
    pageHead(
      "Preguntas frecuentes",
      "Respuestas sobre el envío, cuidado, digitalización y devolución de tus recuerdos.",
      "/faq",
    ),
  component: FAQPage,
});

function FAQPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 lg:px-8 lg:py-24">
      <header className="max-w-2xl">
        <p className="eyebrow">Antes de comenzar</p>
        <h1 className="display mt-4 text-4xl sm:text-5xl">Preguntas frecuentes</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          Queremos que tengas claridad antes de entregar un solo original.
        </p>
      </header>
      <div className="mt-12">
        <FAQAccordion items={FAQS} />
      </div>
      <aside className="mt-14 rounded-xl bg-sand p-7 sm:flex sm:items-center sm:justify-between sm:gap-8">
        <div>
          <h2 className="font-serif text-2xl">¿Tu material necesita una revisión especial?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cuéntanos qué tienes antes de preparar el envío.
          </p>
        </div>
        <Button asChild className="mt-5 shrink-0 rounded-full sm:mt-0">
          <Link to="/contacto">Hablar con Mikuva</Link>
        </Button>
      </aside>
    </div>
  );
}
