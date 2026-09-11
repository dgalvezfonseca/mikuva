import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Box, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";

const STEPS = [
  [
    "Elige tu servicio",
    "Selecciona el formato y una cantidad aproximada. Puedes pedir orientación antes de decidir.",
  ],
  [
    "Prepara tus recuerdos",
    "Agrupa el material en el orden que quieres conservar y evita adhesivos sobre los originales.",
  ],
  [
    "Envíalos o entrégalos",
    "Te confirmaremos la forma de entrega antes de recibir el material.",
  ],
  [
    "Recibimos el material",
    "Revisamos contigo el contenido recibido y documentamos cualquier condición visible.",
  ],
  [
    "Digitalizamos",
    "Usamos un flujo específico para papel, negativos, transparencias, álbumes o película.",
  ],
  [
    "Realizamos control de calidad",
    "Comprobamos archivos, encuadre y organización antes de preparar la entrega.",
  ],
  [
    "Te entregamos tus archivos",
    "Preparamos la entrega de los archivos digitalizados.",
  ],
  [
    "Regresamos tus originales",
    "Coordinamos la devolución de todo el material físico al cerrar el proceso.",
  ],
] as const;

export const Route = createFileRoute("/como-funciona")({
  head: () =>
    pageHead(
      "Cómo funciona",
      "Conoce paso a paso cómo Mikuva recibe, digitaliza, revisa y devuelve tus recuerdos familiares.",
      "/como-funciona",
    ),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <>
      <header className="bg-ivory px-5 py-16 md:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow">Del original a tus archivos</p>
          <h1 className="display mt-4 max-w-4xl text-4xl sm:text-5xl md:text-6xl">
            Siempre sabes dónde están tus recuerdos y qué sigue.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Un proceso claro reduce la incertidumbre cuando el material es irremplazable. Estas son
            las etapas que preparamos para cada pedido.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <ol className="grid gap-x-12 gap-y-0 md:grid-cols-2">
          {STEPS.map(([title, text], index) => (
            <li key={title} className="grid grid-cols-[48px_1fr] gap-5 border-t border-border py-8">
              <span className="font-serif text-2xl text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="font-serif text-2xl">{title}</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <section className="mt-16 grid gap-6 rounded-2xl bg-sand p-6 sm:p-10 md:grid-cols-2">
          <div>
            <Box className="h-6 w-6 text-primary" aria-hidden />
            <h2 className="mt-4 font-serif text-2xl">Recomendaciones de empaque</h2>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>Usa sobres o separadores sin adhesivo directo sobre las imágenes.</li>
              <li>Protege las fotografías entre superficies rígidas sin presionarlas.</li>
              <li>Coloca carretes y diapositivas en cajas que no permitan movimiento.</li>
              <li>Incluye una lista del contenido y conserva una copia.</li>
            </ul>
          </div>
          <div>
            <ShieldCheck className="h-6 w-6 text-primary" aria-hidden />
            <h2 className="mt-4 font-serif text-2xl">Antes de enviar</h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Espera la confirmación de la dirección, el método de recepción y cualquier instrucción
              específica para material frágil.
            </p>
            <Button asChild variant="outline" className="mt-7 rounded-full bg-transparent">
              <Link to="/contacto">
                Resolver una duda <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
