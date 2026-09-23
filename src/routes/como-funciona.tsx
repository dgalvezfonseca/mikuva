import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Box, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SITE } from "@/constants/site";
import { getEditorialPage } from "@/lib/editorial-pages";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/como-funciona")({
  loader: () => getEditorialPage({ data: { slug: "como-funciona" } }),
  head: ({ loaderData }) => {
    const head = pageHead(
      loaderData?.metaTitle || "Cómo funciona",
      loaderData?.metaDescription ||
        "Conoce paso a paso cómo Mikuva recibe, digitaliza, revisa y devuelve tus recuerdos familiares.",
      "/como-funciona",
    );
    return loaderData?.ogImageUrl
      ? {
          ...head,
          meta: [
            ...head.meta,
            { property: "og:image", content: new URL(loaderData.ogImageUrl, SITE.url).toString() },
          ],
        }
      : head;
  },
  component: HowItWorksPage,
});

function HowItWorksPage() {
  const page = Route.useLoaderData();
  if (!page) return <EditorialUnavailable />;

  const packing = page.sections.find((section) => section.key === "packing");
  const beforeShipping = page.sections.find((section) => section.key === "before_shipping");

  return (
    <>
      <header className="bg-ivory px-5 py-16 md:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {page.eyebrow && <p className="eyebrow">{page.eyebrow}</p>}
          <h1 className="display mt-4 max-w-4xl text-4xl sm:text-5xl md:text-6xl">{page.title}</h1>
          {page.intro && (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {page.intro}
            </p>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <ol className="grid gap-x-12 gap-y-0 md:grid-cols-2">
          {page.processSteps.map((step, index) => (
            <li
              key={step.title}
              className="grid grid-cols-[48px_1fr] gap-5 border-t border-border py-8"
            >
              <span className="font-serif text-2xl text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="font-serif text-2xl">{step.title}</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        {(packing || beforeShipping) && (
          <section className="mt-16 grid gap-6 rounded-2xl bg-sand p-6 sm:p-10 md:grid-cols-2">
            {packing && (
              <div>
                <Box className="h-6 w-6 text-primary" aria-hidden />
                {packing.title && <h2 className="mt-4 font-serif text-2xl">{packing.title}</h2>}
                {packing.items.length > 0 && (
                  <ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
                    {packing.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {beforeShipping && (
              <div>
                <ShieldCheck className="h-6 w-6 text-primary" aria-hidden />
                {beforeShipping.title && (
                  <h2 className="mt-4 font-serif text-2xl">{beforeShipping.title}</h2>
                )}
                {beforeShipping.description && (
                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                    {beforeShipping.description}
                  </p>
                )}
                {beforeShipping.cta && (
                  <Button asChild variant="outline" className="mt-7 rounded-full bg-transparent">
                    <Link to="/contacto">
                      {beforeShipping.cta} <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}

function EditorialUnavailable() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-24 text-center lg:px-8">
      <p className="eyebrow">Contenido no disponible</p>
      <h1 className="display mt-4 text-4xl">Esta información no está disponible por ahora.</h1>
      <p className="mt-5 text-muted-foreground">
        Intenta de nuevo más tarde o ponte en contacto con Mikuva.
      </p>
    </main>
  );
}
