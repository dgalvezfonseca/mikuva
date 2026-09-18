import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PRICING_NOTE } from "@/constants/site";
import { useCart } from "@/hooks/use-cart";
import { getReelVariantCode } from "@/lib/catalog-variant-code";
import { formatPrice } from "@/lib/format";
import { reelSubtotal } from "@/lib/pricing";
import type { ReelSize } from "@/types/catalog";

type TransactionalFilmProduct = {
  slug: string;
  name: string;
  image: string;
  filmTypes: string[];
  reels: ReelSize[];
};

export default function FilmConfigurator({ product }: { product: TransactionalFilmProduct }) {
  const { addItem } = useCart();
  const reels = product.reels;
  const [filmType, setFilmType] = useState(product.filmTypes[0] ?? "");
  const [reelId, setReelId] = useState(reels[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const reel = reels.find((item) => item.id === reelId) ?? reels[0];
  if (!reel) return null;
  const subtotal = reelSubtotal(reel, quantity);

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-7">
      <h2 className="font-serif text-2xl">Configura tus carretes</h2>
      <fieldset className="mt-6">
        <legend className="text-sm font-semibold">Tipo</legend>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {product.filmTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilmType(type)}
              aria-pressed={filmType === type}
              className={`rounded-lg border px-4 py-3 text-sm ${filmType === type ? "border-primary bg-sand" : "border-border"}`}
            >
              {type}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-6">
        <legend className="text-sm font-semibold">Tamaño del carrete</legend>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {reels.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setReelId(option.id)}
              aria-pressed={reelId === option.id}
              className={`rounded-lg border p-3 text-left ${reelId === option.id ? "border-primary bg-sand" : "border-border"}`}
            >
              <span className="block font-semibold">{option.id}</span>
              <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                {option.feet}
                <br />
                {option.duration}
                <br />
                {formatPrice(option.price)}
              </span>
            </button>
          ))}
        </div>
      </fieldset>
      <div className="mt-6 flex items-center justify-between border-y border-border py-5">
        <span className="text-sm font-semibold">Cantidad</span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Disminuir cantidad"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Minus className="h-4 w-4" />
          </button>
          <output className="min-w-5 text-center font-semibold">{quantity}</output>
          <button
            type="button"
            aria-label="Aumentar cantidad"
            onClick={() => setQuantity((value) => Math.min(10_000, value + 1))}
            disabled={quantity >= 10_000}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-6 flex items-end justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {quantity} {quantity === 1 ? "carrete" : "carretes"} {filmType} de {reel.id}
        </p>
        <p className="text-right text-xs text-muted-foreground">
          Subtotal{" "}
          <strong className="block text-2xl text-foreground">{formatPrice(subtotal)}</strong>
        </p>
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
            unitPrice: reel.price,
            quantity,
            config: {
              variantCode: getReelVariantCode(product.slug, filmType, reel.id),
              summary: `${filmType} · ${reel.label} · ${reel.duration}`,
              filmType,
              reelLabel: reel.label,
            },
          });
          toast.success("Carretes agregados al carrito");
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
