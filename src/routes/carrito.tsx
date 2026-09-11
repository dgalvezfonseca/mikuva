import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";

import CartItemRow from "@/components/cart/CartItemRow";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/format";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/carrito")({
  head: () =>
    pageHead(
      "Carrito",
      "Revisa los servicios de digitalización elegidos para tus recuerdos.",
      "/carrito",
      { noindex: true },
    ),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, clear } = useCart();
  if (!items.length)
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-24 text-center">
        <ShoppingBag className="h-12 w-12 text-primary/50" aria-hidden />
        <p className="eyebrow mt-6">Tu selección</p>
        <h1 className="display mt-3 text-4xl">Tu carrito todavía está esperando recuerdos.</h1>
        <p className="mt-4 text-muted-foreground">
          Explora los formatos que podemos ayudarte a preservar.
        </p>
        <Button asChild size="lg" className="mt-8 rounded-full">
          <Link to="/tienda">Explorar servicios</Link>
        </Button>
      </div>
    );
  return (
    <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Tu selección</p>
          <h1 className="display mt-3 text-4xl sm:text-5xl">Carrito</h1>
        </div>
        <button
          type="button"
          onClick={clear}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-destructive"
        >
          Vaciar carrito
        </button>
      </div>
      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_360px] lg:items-start">
        <div>
          {items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>
        <aside className="rounded-xl border border-border bg-card p-6 lg:sticky lg:top-28">
          <h2 className="font-serif text-2xl">Resumen</h2>
          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="font-semibold">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4 text-muted-foreground">
              <dt>Envío</dt>
              <dd className="text-right">Se calcula posteriormente</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-4 text-lg">
              <dt>Total</dt>
              <dd className="font-semibold">{formatPrice(subtotal)}</dd>
            </div>
          </dl>
          <Button asChild size="lg" className="mt-7 w-full rounded-full">
            <Link to="/checkout">Continuar</Link>
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            El pago se procesa de forma segura con Mercado Pago dentro de Mikuva.
          </p>
        </aside>
      </div>
    </div>
  );
}
