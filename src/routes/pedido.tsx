import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import OrderTimeline from "@/components/orders/OrderTimeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orderFolio } from "@/lib/format";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/pedido")({
  head: () =>
    pageHead(
      "Consultar pedido",
      "Consulta visualmente el avance de tu proceso de digitalización.",
      "/pedido",
      { noindex: true },
    ),
  component: OrderPage,
});

function OrderPage() {
  const [showExample, setShowExample] = useState(false);
  return (
    <div className="mx-auto max-w-5xl px-5 py-16 lg:px-8 lg:py-24">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <p className="eyebrow">Seguimiento</p>
          <h1 className="display mt-4 text-4xl sm:text-5xl">¿Dónde están mis recuerdos?</h1>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            Esta primera versión muestra cómo funcionará el seguimiento. Todavía no consulta pedidos
            reales.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setShowExample(true);
            }}
            className="mt-8 space-y-5 rounded-xl border border-border bg-card p-6"
          >
            <div>
              <Label htmlFor="order-number">Número de pedido</Label>
              <Input id="order-number" required placeholder="MK-2026-00000" className="mt-2" />
            </div>
            <div>
              <Label htmlFor="order-email">Email</Label>
              <Input
                id="order-email"
                type="email"
                required
                placeholder="tu@email.com"
                className="mt-2"
              />
            </div>
            <Button type="submit" className="w-full rounded-full">
              Ver seguimiento de ejemplo
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Consulta real pendiente de integración con Supabase.
            </p>
          </form>
        </div>
        <section className="rounded-xl bg-sand p-6 sm:p-9">
          <p className="eyebrow">
            {showExample ? `Ejemplo · ${orderFolio(42, 2026)}` : "Vista previa"}
          </p>
          <h2 className="mt-3 font-serif text-2xl">Proceso de tu material</h2>
          {showExample ? (
            <OrderTimeline currentStatus="digitalizacion" />
          ) : (
            <div className="mt-8 rounded-lg border border-dashed border-primary/30 p-8 text-center text-sm text-muted-foreground">
              Ingresa los datos para mostrar un timeline con información de demostración.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
