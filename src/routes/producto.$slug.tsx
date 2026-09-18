import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, ChevronRight } from "lucide-react";

import FAQAccordion from "@/components/faq/FAQAccordion";
import FilmConfigurator from "@/components/products/FilmConfigurator";
import PhotoQuantityConfigurator from "@/components/products/PhotoQuantityConfigurator";
import ProductGallery from "@/components/products/ProductGallery";
import StoreProductCard from "@/components/products/StoreProductCard";
import { Section, SectionHeading } from "@/components/ui/section";
import { PROCESS_STEPS } from "@/constants/process";
import { SITE } from "@/constants/site";
import { formatPrice } from "@/lib/format";
import { getProductDetail } from "@/lib/product-detail";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/producto/$slug")({
  loader: async ({ params }) => {
    const product = await getProductDetail({ data: { slug: params.slug } });
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData }) => {
    const title = loaderData?.metaTitle || loaderData?.name || "Servicio";
    const description =
      loaderData?.metaDescription ||
      loaderData?.shortDescription ||
      "Servicio de digitalización Mikuva";
    const head = pageHead(
      title,
      description,
      loaderData ? `/producto/${loaderData.slug}` : "/tienda",
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
  component: ProductPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-28 text-center">
      <p className="eyebrow">Servicio no encontrado</p>
      <h1 className="display mt-3 text-4xl">Este servicio no está en el catálogo.</h1>
      <p className="mt-4 text-muted-foreground">
        Puede haber cambiado de nombre o ya no estar disponible.
      </p>
      <Link
        to="/tienda"
        className="mt-7 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
      >
        Volver a la tienda
      </Link>
    </div>
  ),
});

function ProductPage() {
  const product = Route.useLoaderData();
  const transactionalProduct = product.transactionalConfig && {
    unitLabel: product.unitLabel,
    ...product.transactionalConfig,
  };
  return (
    <>
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-6 lg:px-8 lg:pb-24">
        <nav
          aria-label="Migas de pan"
          className="flex flex-wrap items-center gap-2 py-5 text-xs text-muted-foreground"
        >
          <Link to="/">Inicio</Link>
          <ChevronRight className="h-3 w-3" aria-hidden />
          <Link to="/tienda">Tienda</Link>
          <ChevronRight className="h-3 w-3" aria-hidden />
          <span aria-current="page">{product.name}</span>
        </nav>
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <ProductGallery images={product.gallery} name={product.name} />
          <div>
            <p className="eyebrow">{product.category.name}</p>
            <h1 className="display mt-3 text-4xl sm:text-5xl">{product.name}</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {product.description}
            </p>
            {product.priceFrom !== null && (
              <p className="mt-5 text-sm text-muted-foreground">
                Desde{" "}
                <strong className="text-xl text-foreground">
                  {formatPrice(product.priceFrom)}
                </strong>
              </p>
            )}
            <div className="mt-8">
              {product.configurator === "film" &&
              transactionalProduct?.reels.length &&
              transactionalProduct.filmTypes.length ? (
                <FilmConfigurator product={transactionalProduct} />
              ) : product.configurator === "quantity" && transactionalProduct?.tiers.length ? (
                <PhotoQuantityConfigurator product={transactionalProduct} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
      {(product.includes.length > 0 || product.preparation.length > 0) && (
        <Section tone="sand">
          <div className="grid gap-12 md:grid-cols-2">
            {product.includes.length > 0 && (
              <div>
                <SectionHeading
                  eyebrow="Qué incluye"
                  title="Un proceso completo, no solo un escaneo."
                />
                <ul className="mt-8 space-y-4">
                  {product.includes.map((item) => (
                    <li key={item} className="flex gap-3">
                      <Check className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {product.preparation.length > 0 && (
              <div>
                <SectionHeading eyebrow="Antes de enviarlo" title="Cómo preparar tu material." />
                <ol className="mt-8 space-y-4">
                  {product.preparation.map((item, index) => (
                    <li key={item} className="flex gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/40 text-xs text-primary">
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </Section>
      )}
      <Section>
        <SectionHeading eyebrow="Cómo funciona" title="Tus originales acompañados en cada etapa." />
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEPS.map((step, index) => (
            <li key={step.title} className="border-t border-primary/40 pt-5">
              <p className="eyebrow">Paso {index + 1}</p>
              <h3 className="mt-2 font-serif text-xl">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </Section>
      {product.faqs.length > 0 && (
        <Section tone="ivory">
          <SectionHeading
            eyebrow="Preguntas sobre este servicio"
            title="Antes de confiar tus originales."
          />
          <div className="mt-10 max-w-3xl">
            <FAQAccordion items={product.faqs} />
          </div>
        </Section>
      )}
      {product.related.length > 0 && (
        <Section>
          <SectionHeading
            eyebrow="También puedes preservar"
            title="Otros formatos de tu archivo familiar."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {product.related.map((item) => (
              <StoreProductCard key={item.id} product={item} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
