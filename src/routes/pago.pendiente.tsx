import { createFileRoute } from "@tanstack/react-router";

import PaymentReturnPage from "@/components/payments/PaymentReturnPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/pago/pendiente")({
  head: () =>
    pageHead("Pago pendiente", "Tu operación en Mercado Pago continúa pendiente.", "/pago/pendiente", {
      noindex: true,
    }),
  component: PaymentPendingPage,
});

function PaymentPendingPage() {
  return (
    <PaymentReturnPage
      eyebrow="Pago pendiente"
      title="La operación aún no termina."
      description="Mercado Pago indicó que la operación continúa pendiente. No marcaremos tu solicitud como pagada hasta recibir una confirmación verificable del servidor."
      actionLabel="Volver a la tienda"
      actionTo="/tienda"
    />
  );
}
