import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { formatPrice } from "@/lib/format";
import type { StoreProduct } from "@/lib/store-catalog";

export default function StoreProductCard({ product }: { product: StoreProduct }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-transform duration-300 hover:-translate-y-1">
      <Link to="/producto/$slug" params={{ slug: product.slug }} className="overflow-hidden">
        {product.mainImageUrl ? (
          <img
            src={product.mainImageUrl}
            alt={product.name}
            loading="lazy"
            width={1024}
            height={768}
            className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
          />
        ) : (
          <div
            className="flex aspect-[4/3] w-full items-center justify-center bg-muted px-6 text-center text-sm text-muted-foreground"
            role="img"
            aria-label={`Imagen no disponible para ${product.name}`}
          >
            Imagen no disponible
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <p className="eyebrow">{product.category.name}</p>
        <h2 className="mt-2 font-serif text-2xl">
          <Link to="/producto/$slug" params={{ slug: product.slug }} className="hover:text-primary">
            {product.name}
          </Link>
        </h2>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {product.shortDescription}
        </p>
        <div className="mt-6 flex items-end justify-between gap-4 border-t border-border pt-5">
          <p className="text-xs text-muted-foreground">
            {product.priceFrom === null ? "Precio editorial" : "Desde"}
            <span className="block text-lg font-semibold text-foreground">
              {product.priceFrom === null ? "Consulta opciones" : formatPrice(product.priceFrom)}
            </span>
          </p>
          <Link
            to="/producto/$slug"
            params={{ slug: product.slug }}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            Ver opciones <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
