import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PRICING_NOTE } from "@/constants/site";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/format";

type Variant = { code: string; name: string; price: number | null };

export default function DirectusVariantConfigurator({
  product,
}: {
  product: { slug: string; name: string; image: string; variants: Variant[] };
}) {
  const variants = product.variants.filter((variant) => variant.price !== null);
  const [code, setCode] = useState(variants[0]?.code ?? "");
  const selected = variants.find((variant) => variant.code === code);
  const { addItem } = useCart();
  if (!selected || selected.price === null) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-7">
      <label className="text-sm font-semibold" htmlFor={`variant-${product.slug}`}>
        Elige una opción
      </label>
      <select
        id={`variant-${product.slug}`}
        value={code}
        onChange={(event) => setCode(event.target.value)}
        className="mt-3 min-h-11 w-full rounded-md border border-input bg-card px-3 text-sm"
      >
        {variants.map((variant) => (
          <option key={variant.code} value={variant.code}>
            {variant.name} — {formatPrice(variant.price ?? 0)}
          </option>
        ))}
      </select>
      <Button
        type="button"
        size="lg"
        className="mt-5 w-full rounded-md"
        onClick={() => {
          addItem({
            productSlug: product.slug,
            name: product.name,
            image: product.image,
            unitPrice: selected.price ?? 0,
            quantity: 1,
            config: { variantCode: selected.code, summary: selected.name },
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
