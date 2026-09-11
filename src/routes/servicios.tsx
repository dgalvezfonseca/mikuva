import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PRODUCTS } from "@/data/catalog";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/servicios")({
  head: () =>
    pageHead(
      "Servicios",
      "Digitalización profesional de fotografías, negativos, diapositivas, álbumes, 8mm y Super 8.",
      "/servicios",
    ),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <>
      <header className="bg-ivory px-5 py-16 text-center md:py-24 lg:px-8">
        <p className="eyebrow">Cada formato, su propio cuidado</p>
        <h1 className="display mx-auto mt-4 max-w-4xl text-4xl sm:text-5xl md:text-6xl">
          Del papel y la película a un archivo que puedes volver a compartir.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl leading-relaxed text-muted-foreground">
          Trabajamos cada original de acuerdo con su formato, estado y orden. El proceso empieza por
          entender qué tienes y cómo quieres conservarlo.
        </p>
      </header>
      <main>
        {PRODUCTS.map((product, index) => (
          <section key={product.id} className={index % 2 ? "bg-sand" : "bg-background"}>
            <div
              className={`mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:gap-20 lg:px-8 lg:py-24 ${index % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}
            >
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
                width={1024}
                height={768}
                className="aspect-[4/3] w-full rounded-xl border border-border object-cover"
              />
              <div>
                <p className="eyebrow">
                  {String(index + 1).padStart(2, "0")} · Preservación especializada
                </p>
                <h2 className="display mt-3 text-3xl md:text-4xl">{product.name}</h2>
                <p className="mt-5 leading-relaxed text-muted-foreground">{product.description}</p>
                <ul className="mt-6 space-y-3">
                  {product.includes.slice(0, 3).map((item) => (
                    <li key={item} className="flex gap-3 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="mt-8 rounded-full">
                  <Link to="/producto/$slug" params={{ slug: product.slug }}>
                    Ver opciones <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
