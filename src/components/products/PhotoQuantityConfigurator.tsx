import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PRICING_NOTE } from "@/constants/site";
import { useCart } from "@/hooks/use-cart";
import { getVolumeVariantCode } from "@/lib/catalog-variant-code";
import { formatNumber, formatPrice } from "@/lib/format";
import { recommendTier } from "@/lib/pricing";
import type { VolumeTier } from "@/types/catalog";

type TransactionalQuantityProduct = {
  slug: string;
  name: string;
  image: string;
  unitLabel: string;
  tiers: VolumeTier[];
};

export default function PhotoQuantityConfigurator({
  product,
}: {
  product: TransactionalQuantityProduct;
}) {
  const tiers = product.tiers;
  const min = tiers[0]?.units ?? 1;
  const max = tiers[tiers.length - 1]?.units ?? min;
  const [units, setUnits] = useState(min);
  const recommended = recommendTier(tiers, units);
  const { addItem } = useCart();

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-7">
      <h2 className="font-serif text-2xl">¿Cuántas {product.unitLabel} quieres digitalizar?</h2>
      <div className="mt-7 text-center">
        <strong className="font-serif text-4xl font-normal">{formatNumber(units)}</strong>
        <span className="ml-2 text-sm text-muted-foreground">{product.unitLabel}</span>
      </div>
      <label className="sr-only" htmlFor="material-quantity">
        Cantidad de {product.unitLabel}
      </label>
      <input
        id="material-quantity"
        type="range"
        min={min}
        max={max}
        step={Math.max(1, Math.round((max - min) / 100))}
        value={units}
        onChange={(event) => setUnits(Number(event.target.value))}
        className="mt-6 w-full accent-primary"
      />
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{formatNumber(min)}</span>
        <span>{formatNumber(max)}</span>
      </div>
      <div className="mt-7 rounded-lg bg-sand p-5">
        <p className="text-sm text-muted-foreground">Te recomendamos</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <strong className="font-serif text-xl font-normal">{recommended.label}</strong>
          <strong className="text-xl">{formatPrice(recommended.price)}</strong>
        </div>
        {units > recommended.units && (
          <p className="mt-3 text-xs text-muted-foreground">
            Esta es la opción de mayor capacidad disponible. Confirmaremos el excedente al recibir
            tu material.
          </p>
        )}
      </div>
      <Button
        type="button"
        size="lg"
        className="mt-5 w-full rounded-full"
        onClick={() => {
          addItem({
            productSlug: product.slug,
            name: product.name,
            image: product.image,
            unitPrice: recommended.price,
            quantity: 1,
            config: {
              variantCode: getVolumeVariantCode(product.slug, recommended.units),
              summary: `${recommended.label} · ${formatNumber(units)} ${product.unitLabel}`,
              quantity: units,
              tierLabel: recommended.label,
            },
          });
          toast.success("Servicio agregado al carrito");
        }}
      >
        <ShoppingBag aria-hidden /> Agregar al carrito
      </Button>
      <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
        {PRICING_NOTE}
      </p>
    </div>
  );
}
