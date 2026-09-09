import { createFileRoute } from "@tanstack/react-router";

import PaymentReturnPage from "@/components/payments/PaymentReturnPage";
import { reconcileMercadoPagoPaymentReturn } from "@/lib/mercadopago-return";
import { getMercadoPagoReturnPaymentId } from "@/lib/mercadopago-return-core";
import { routeMeta } from "@/lib/seo";

export const Route = createFileRoute("/pago/exitoso")({
  validateSearch: (search: Record<string, unknown>) => ({
    paymentId: getMercadoPagoReturnPaymentId(search["payment_id"]),
  }),
  loaderDeps: ({ search }) => ({ paymentId: search.paymentId }),
  loader: ({ deps }) =>
    deps.paymentId
      ? reconcileMercadoPagoPaymentReturn({ data: { paymentId: deps.paymentId } })
      : { state: "verifying" as const },
  head: () => ({
    meta: [
      ...routeMeta("Pago en verificación", "Estamos verificando tu regreso desde Mercado Pago."),
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
  const result = Route.useLoaderData();

  if (result.state === "confirmed") {
    return (
      <PaymentReturnPage
        eyebrow="Pago confirmado"
        title="Tu pago fue aprobado correctamente."
        description={
          result.folio
            ? `Confirmamos tu pago de forma segura con Mercado Pago. Folio: ${result.folio}.`
            : "Confirmamos tu pago de forma segura con Mercado Pago."
        }
        actionLabel="Volver a la tienda"
        actionTo="/tienda"
      />
    );
  }

  if (result.state === "processing") {
    return (
      <PaymentReturnPage
        eyebrow="Pago en proceso"
        title="Tu pago continúa en proceso."
        description="Mercado Pago todavía no confirma el pago. Actualizaremos tu solicitud cuando la verificación del servidor termine."
        actionLabel="Volver a la tienda"
        actionTo="/tienda"
      />
    );
  }

  return (
    <PaymentReturnPage
      eyebrow="Regreso desde Mercado Pago"
      title="Estamos verificando el pago."
      description="Recibimos tu regreso desde Mercado Pago. Tu solicitud permanece en verificación; todavía no la marcamos como pagada ni confirmada."
      actionLabel="Volver a la tienda"
      actionTo="/tienda"
    />
  );
}
