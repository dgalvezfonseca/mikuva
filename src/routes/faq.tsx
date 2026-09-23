import { createFileRoute, Link } from "@tanstack/react-router";

import FAQAccordion from "@/components/faq/FAQAccordion";
import { Button } from "@/components/ui/button";
import { SITE } from "@/constants/site";
import { getEditorialPage } from "@/lib/editorial-pages";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/faq")({
  loader: () => getEditorialPage({ data: { slug: "faq" } }),
  head: ({ loaderData }) => {
    const head = pageHead(
      loaderData?.metaTitle || "Preguntas frecuentes",
      loaderData?.metaDescription ||
        "Respuestas sobre el envío, cuidado, digitalización y devolución de tus recuerdos.",
      "/faq",
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
  component: FAQPage,
});

function FAQPage() {
  const page = Route.useLoaderData();
  if (!page) return <EditorialUnavailable />;
  const finalCta = page.sections.find((section) => section.key === "final_cta");

  return (
    <div className="mx-auto max-w-4xl px-5 py-16 lg:px-8 lg:py-24">
      <header className="max-w-2xl">
        {page.eyebrow && <p className="eyebrow">{page.eyebrow}</p>}
        <h1 className="display mt-4 text-4xl sm:text-5xl">{page.title}</h1>
        {page.intro && (
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{page.intro}</p>
        )}
      </header>
      <div className="mt-12">
        <FAQAccordion items={page.faqs} />
      </div>
      {finalCta && (
        <aside className="mt-14 rounded-xl bg-sand p-7 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div>
            {finalCta.title && <h2 className="font-serif text-2xl">{finalCta.title}</h2>}
            {finalCta.description && (
              <p className="mt-2 text-sm text-muted-foreground">{finalCta.description}</p>
            )}
          </div>
          {finalCta.cta && (
            <Button asChild className="mt-5 shrink-0 rounded-full sm:mt-0">
              <Link to="/contacto">{finalCta.cta}</Link>
            </Button>
          )}
        </aside>
      )}
    </div>
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
