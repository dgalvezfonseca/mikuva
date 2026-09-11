import { createFileRoute } from "@tanstack/react-router";

import PaymentReturnPage from "@/components/payments/PaymentReturnPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/pago/error")({
  head: () =>
    pageHead("Pago no completado", "La operación no pudo completarse en Mercado Pago.", "/pago/error", {
      noindex: true,
    }),
  component: PaymentErrorPage,
});

function PaymentErrorPage() {
  return (
    <PaymentReturnPage
      eyebrow="Pago no completado"
      title="No se completó la operación."
      description="No recibimos una confirmación de pago. Puedes regresar al checkout para intentarlo nuevamente con la misma solicitud."
      actionLabel="Regresar al checkout"
      actionTo="/checkout"
    />
  );
}
