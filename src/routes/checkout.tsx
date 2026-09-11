import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/use-cart";
import { beginMercadoPagoCheckout } from "@/lib/checkout";
import { formatPrice } from "@/lib/format";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/checkout")({
  head: () =>
    pageHead("Checkout", "Confirma tus datos y continúa al entorno seguro de Mercado Pago.", "/checkout", {
      noindex: true,
    }),
  component: CheckoutPage,
});

const FIELDS = [
  { id: "nombre", label: "Nombre", autoComplete: "given-name" },
  { id: "apellidos", label: "Apellidos", autoComplete: "family-name" },
  { id: "email", label: "Email", type: "email", autoComplete: "email" },
  { id: "telefono", label: "Teléfono", type: "tel", autoComplete: "tel" },
];

function value(formData: FormData, name: string): string {
  const entry = formData.get(name);
  return typeof entry === "string" ? entry : "";
}

function CheckoutPage() {
  const { items, subtotal } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestId = useRef<string | null>(null);
  const submissionLock = useRef(false);
  const hasLegacyItems = items.some((item) => !item.config.variantCode);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLock.current || !items.length || hasLegacyItems) return;
    submissionLock.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      requestId.current ??= window.crypto.randomUUID();
      const formData = new FormData(event.currentTarget);
      const result = await beginMercadoPagoCheckout({
        data: {
          checkoutRequestId: requestId.current,
          customer: {
            firstName: value(formData, "nombre"),
            lastName: value(formData, "apellidos"),
            email: value(formData, "email"),
            phone: value(formData, "telefono"),
          },
          items: items.map((item) => ({
            productSlug: item.productSlug,
            variantCode: item.config.variantCode ?? null,
            quantity: item.quantity,
          })),
        },
      });
      window.location.assign(result.initPoint);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No pudimos iniciar Mercado Pago. Inténtalo nuevamente.",
      );
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-20">
      <Link
        to="/carrito"
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Volver al carrito
      </Link>
      <p className="eyebrow mt-6">Pago seguro</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">Finaliza tu solicitud</h1>
      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px] lg:items-start">
        <form
          onSubmit={handleSubmit}
          onChange={() => {
            requestId.current = null;
          }}
          className="space-y-10"
        >
          <fieldset disabled={isSubmitting}>
            <legend className="font-serif text-2xl">Datos de contacto</legend>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Los usaremos para identificar tu solicitud. El pago se realiza en el checkout seguro
              de Mercado Pago.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <div key={field.id}>
                  <Label htmlFor={field.id}>{field.label}</Label>
                  <Input
                    id={field.id}
                    name={field.id}
                    type={field.type ?? "text"}
                    autoComplete={field.autoComplete}
                    maxLength={field.id === "email" ? 254 : field.id === "apellidos" ? 140 : 100}
                    minLength={field.id === "telefono" ? 8 : 1}
                    pattern={field.id === "telefono" ? "[0-9+() .-]+" : undefined}
                    required
                    className="mt-2 bg-card"
                  />
                </div>
              ))}
            </div>
          </fieldset>
          {errorMessage && (
            <p
              role="alert"
              className="border-l-2 border-destructive py-2 pl-4 text-sm leading-relaxed text-destructive"
            >
              {errorMessage}
            </p>
          )}
          {hasLegacyItems && !errorMessage && (
            <p
              role="status"
              className="border-l-2 border-primary py-2 pl-4 text-sm leading-relaxed"
            >
              Este carrito fue creado antes de habilitar pagos. Elimina sus servicios y agrégalos
              nuevamente para continuar.
            </p>
          )}
          <div>
            <Button
              type="submit"
              size="lg"
              className="min-h-11 w-full rounded-md"
              disabled={isSubmitting || !items.length || hasLegacyItems}
            >
              <Lock aria-hidden />
              {isSubmitting ? "Redirigiendo…" : "Continuar a Mercado Pago"}
            </Button>
            <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
              Mercado Pago procesa el pago en su sitio seguro. Mikuva no captura datos de tarjeta.
            </p>
          </div>
        </form>
        <aside className="rounded-xl border border-border bg-card p-6 lg:sticky lg:top-28">
          <h2 className="font-serif text-2xl">Resumen del pedido</h2>
          {items.length ? (
            <div className="mt-5 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-4 border-b border-border pb-4 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {item.name} × {item.quantity}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.config.summary}</p>
                  </div>
                  <strong>{formatPrice(item.unitPrice * item.quantity)}</strong>
                </div>
              ))}
              <div className="flex justify-between pt-2 text-lg">
                <span>Total estimado</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                El servidor verifica productos, variantes y precios vigentes antes de crear el pago.
              </p>
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              Tu carrito está vacío.{" "}
              <Link to="/tienda" className="text-primary underline">
                Explorar servicios
              </Link>
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
