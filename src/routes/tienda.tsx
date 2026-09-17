import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import StoreProductCard from "@/components/products/StoreProductCard";
import { pageHead } from "@/lib/seo";
import { getStoreCatalog } from "@/lib/store-catalog";

export const Route = createFileRoute("/tienda")({
  validateSearch: (search: Record<string, unknown>): { categoria?: string } =>
    typeof search["categoria"] === "string" ? { categoria: search["categoria"] } : {},
  head: () =>
    pageHead(
      "Tienda de digitalización",
      "Elige el tipo y volumen de recuerdos que quieres digitalizar con cuidado profesional.",
      "/tienda",
    ),
  loader: () => getStoreCatalog(),
  component: StorePage,
});

function StorePage() {
  const { categoria } = Route.useSearch();
  const { categories, products: catalogProducts } = Route.useLoaderData();
  const filters = [
    { label: "Todos", value: "todos" },
    ...categories.map(({ name, slug }) => ({ label: name, value: slug })),
  ];
  const active = filters.some((filter) => filter.value === categoria) ? categoria : "todos";
  const navigate = Route.useNavigate();
  const products = useMemo(
    () =>
      catalogProducts.filter((product) => active === "todos" || product.category.slug === active),
    [active, catalogProducts],
  );

  return (
    <>
      <header className="border-b border-border bg-ivory px-5 py-16 md:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow">Servicios por formato</p>
          <h1 className="display mt-4 text-4xl sm:text-5xl md:text-6xl">
            Digitaliza tus recuerdos
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Elige el tipo de material que quieres preservar.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
        <div
          className="flex gap-2 overflow-x-auto pb-3"
          role="group"
          aria-label="Filtrar servicios por material"
        >
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={active === filter.value}
              onClick={() =>
                navigate({ search: filter.value === "todos" ? {} : { categoria: filter.value } })
              }
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${active === filter.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50"}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        {catalogProducts.length === 0 ? (
          <p className="mt-5 text-sm text-muted-foreground" role="status">
            El catálogo está temporalmente no disponible. Intenta de nuevo más tarde.
          </p>
        ) : (
          <>
            <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">
              {products.length} {products.length === 1 ? "servicio" : "servicios"}
            </p>
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <StoreProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
