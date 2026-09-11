import { createFileRoute, Link } from "@tanstack/react-router";

import preparacion from "@/assets/historicas/Preparacion-fotografias-mikuva.png";
import hero from "@/assets/historicas/portadamikuva.png";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/nosotros")({
  head: () =>
    pageHead(
      "Nosotros",
      "Conoce la intención detrás de Mikuva: preservar la memoria familiar con tecnología y cuidado humano.",
      "/nosotros",
    ),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:gap-20 lg:px-8 lg:py-24">
        <div>
          <p className="eyebrow">Sobre Mikuva</p>
          <h1 className="display mt-4 text-4xl sm:text-5xl md:text-6xl">
            La memoria familiar merece un lugar más seguro que una caja olvidada.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Mikuva nace de una idea sencilla: ayudar a que las historias guardadas en papel y
            película sigan presentes, visibles y compartibles.
          </p>
        </div>
        <img
          src={hero}
          alt="Fotografías impresas y una tableta con un retrato familiar"
          width={1408}
          height={768}
          className="aspect-[4/3] w-full rounded-xl border border-border object-cover"
        />
      </section>
      <section className="bg-sand">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-8 lg:py-28">
          <img
            src={preparacion}
            alt="Manos organizando varias pilas de fotografías familiares"
            loading="lazy"
            width={1408}
            height={768}
            className="aspect-[4/3] w-full rounded-xl border border-border object-cover"
          />
          <div>
            <p className="eyebrow">Tecnología con criterio humano</p>
            <h2 className="display mt-4 text-3xl sm:text-4xl">
              Cada original es una pieza única, no una unidad de producción.
            </h2>
            <div className="mt-7 space-y-5 leading-relaxed text-muted-foreground">
              <p>
                El equipo permite capturar detalle; el cuidado humano decide cómo manipular, ordenar
                y revisar cada pieza.
              </p>
              <p>
                Por eso diseñamos un proceso que privilegia la trazabilidad, la comunicación y el
                control de calidad. Sin afirmar experiencia, cifras o certificaciones que todavía no
                hayan sido documentadas.
              </p>
              <p>
                La misión es preservar recuerdos de una forma clara, respetuosa y útil para las
                siguientes generaciones.
              </p>
            </div>
            <Button asChild className="mt-8 rounded-full">
              <Link to="/como-funciona">Conocer el proceso</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
