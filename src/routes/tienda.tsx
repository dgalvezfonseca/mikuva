import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import ProductCard from "@/components/products/ProductCard";
import { CATEGORIES, PRODUCTS } from "@/data/catalog";
import { pageHead } from "@/lib/seo";
import type { CategorySlug } from "@/types/catalog";

const FILTERS: Array<{ label: string; value: "todos" | CategorySlug }> = [
  { label: "Todos", value: "todos" },
  ...CATEGORIES.map((category) => ({ label: category.name, value: category.slug })),
];

export const Route = createFileRoute("/tienda")({
  validateSearch: (search: Record<string, unknown>): { categoria?: string } =>
    typeof search["categoria"] === "string" ? { categoria: search["categoria"] } : {},
  head: () =>
    pageHead(
      "Tienda de digitalización",
      "Elige el tipo y volumen de recuerdos que quieres digitalizar con cuidado profesional.",
      "/tienda",
    ),
  component: StorePage,
});

function StorePage() {
  const { categoria } = Route.useSearch();
  const active: "todos" | CategorySlug = FILTERS.some((filter) => filter.value === categoria)
    ? (categoria as CategorySlug)
    : "todos";
  const navigate = Route.useNavigate();
  const products = useMemo(
    () =>
      PRODUCTS.filter(
        (product) => product.active && (active === "todos" || product.category === active),
      ),
    [active],
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
          {FILTERS.map((filter) => (
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
        <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">
          {products.length} {products.length === 1 ? "servicio" : "servicios"}
        </p>
        <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
    </>
  );
}
