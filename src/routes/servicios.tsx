import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SITE } from "@/constants/site";
import { getEditorialPage } from "@/lib/editorial-pages";
import { pageHead } from "@/lib/seo";
import { getServicesCatalog } from "@/lib/store-catalog";

export const Route = createFileRoute("/servicios")({
  loader: async () => {
    const [page, products] = await Promise.all([
      getEditorialPage({ data: { slug: "servicios" } }),
      getServicesCatalog(),
    ]);
    return { page, products };
  },
  head: ({ loaderData }) => {
    const head = pageHead(
      loaderData?.page?.metaTitle || "Servicios",
      loaderData?.page?.metaDescription ||
        "Digitalización profesional de fotografías, negativos, diapositivas, álbumes, 8mm y Super 8.",
      "/servicios",
    );
    return loaderData?.page?.ogImageUrl
      ? {
          ...head,
          meta: [
            ...head.meta,
            {
              property: "og:image",
              content: new URL(loaderData.page.ogImageUrl, SITE.url).toString(),
            },
          ],
        }
      : head;
  },
  component: ServicesPage,
});

function ServicesPage() {
  const { page, products } = Route.useLoaderData();

  return (
    <>
      <header className="bg-ivory px-5 py-16 text-center md:py-24 lg:px-8">
        {page?.eyebrow && <p className="eyebrow">{page.eyebrow}</p>}
        <h1 className="display mx-auto mt-4 max-w-4xl text-4xl sm:text-5xl md:text-6xl">
          {page?.title || "Servicios no disponibles por ahora."}
        </h1>
        {page?.intro && (
          <p className="mx-auto mt-6 max-w-2xl leading-relaxed text-muted-foreground">
            {page.intro}
          </p>
        )}
      </header>
      <main>
        {products.map((product, index) => (
          <section key={product.id} className={index % 2 ? "bg-sand" : "bg-background"}>
            <div
              className={`mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:gap-20 lg:px-8 lg:py-24 ${index % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}
            >
              {product.mainImageUrl ? (
                <img
                  src={product.mainImageUrl}
                  alt={product.name}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className="aspect-[4/3] w-full rounded-xl border border-border object-cover"
                />
              ) : (
                <div
                  role="img"
                  aria-label={`Imagen no disponible para ${product.name}`}
                  className="aspect-[4/3] w-full rounded-xl border border-border bg-sand"
                />
              )}
              <div>
                <p className="eyebrow">
                  {String(index + 1).padStart(2, "0")} · Preservación especializada
                </p>
                <h2 className="display mt-3 text-3xl md:text-4xl">{product.name}</h2>
                <p className="mt-5 leading-relaxed text-muted-foreground">{product.description}</p>
                {product.includes.length > 0 && (
                  <ul className="mt-6 space-y-3">
                    {product.includes.slice(0, 3).map((item) => (
                      <li key={item} className="flex gap-3 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                <Button asChild variant="outline" className="mt-8 rounded-full">
                  <Link to="/producto/$slug" params={{ slug: product.slug }}>
                    Ver opciones <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        ))}
        {products.length === 0 && (
          <p
            className="mx-auto max-w-7xl px-5 py-16 text-sm text-muted-foreground lg:px-8"
            role="status"
          >
            El catálogo está temporalmente no disponible. Intenta de nuevo más tarde.
          </p>
        )}
      </main>
    </>
  );
}
