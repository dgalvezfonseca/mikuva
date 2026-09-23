import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { SITE } from "@/constants/site";
import { getEditorialPage } from "@/lib/editorial-pages";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/nosotros")({
  loader: () => getEditorialPage({ data: { slug: "nosotros" } }),
  head: ({ loaderData }) => {
    const head = pageHead(
      loaderData?.metaTitle || "Nosotros",
      loaderData?.metaDescription ||
        "Conoce la intención detrás de Mikuva: preservar la memoria familiar con tecnología y cuidado humano.",
      "/nosotros",
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
  component: AboutPage,
});

function AboutPage() {
  const page = Route.useLoaderData();
  if (!page) return <EditorialUnavailable />;
  const philosophy = page.sections.find((section) => section.key === "philosophy");

  return (
    <main>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:gap-20 lg:px-8 lg:py-24">
        <div>
          {page.eyebrow && <p className="eyebrow">{page.eyebrow}</p>}
          <h1 className="display mt-4 text-4xl sm:text-5xl md:text-6xl">{page.title}</h1>
          {page.intro && (
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{page.intro}</p>
          )}
        </div>
        {page.heroImageUrl ? (
          <img
            src={page.heroImageUrl}
            alt={page.title}
            width={1408}
            height={768}
            className="aspect-[4/3] w-full rounded-xl border border-border object-cover"
          />
        ) : (
          <div
            role="img"
            aria-label="Imagen no disponible"
            className="aspect-[4/3] w-full rounded-xl border border-border bg-sand"
          />
        )}
      </section>
      {philosophy && (
        <section className="bg-sand">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-8 lg:py-28">
            {philosophy.imageUrl ? (
              <img
                src={philosophy.imageUrl}
                alt={philosophy.imageAlt || philosophy.title || "Imagen no disponible"}
                loading="lazy"
                width={1408}
                height={768}
                className="aspect-[4/3] w-full rounded-xl border border-border object-cover"
              />
            ) : (
              <div
                role="img"
                aria-label="Imagen no disponible"
                className="aspect-[4/3] w-full rounded-xl border border-border bg-background"
              />
            )}
            <div>
              {philosophy.eyebrow && <p className="eyebrow">{philosophy.eyebrow}</p>}
              {philosophy.title && (
                <h2 className="display mt-4 text-3xl sm:text-4xl">{philosophy.title}</h2>
              )}
              {philosophy.paragraphs.length > 0 && (
                <div className="mt-7 space-y-5 leading-relaxed text-muted-foreground">
                  {philosophy.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              )}
              {philosophy.cta && (
                <Button asChild className="mt-8 rounded-full">
                  <Link to="/como-funciona">{philosophy.cta}</Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function EditorialUnavailable() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-24 text-center lg:px-8">
      <p className="eyebrow">Contenido no disponible</p>
      <h1 className="display mt-4 text-4xl">Esta información no está disponible por ahora.</h1>
    </main>
  );
}
