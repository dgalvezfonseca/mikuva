import { createFileRoute, Link } from "@tanstack/react-router";

import { LegalDocument, LegalSection } from "@/components/legal/LegalDocument";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/politica-de-devoluciones")({
  head: () =>
    pageHead(
      "Política de devoluciones",
      "Condiciones para cancelaciones, reembolsos e incidencias de calidad en servicios de Mikuva.",
      "/politica-de-devoluciones",
    ),
  component: ReturnsPolicyPage,
});

function ReturnsPolicyPage() {
  return (
    <LegalDocument
      eyebrow="Cancelaciones y calidad"
      title="Política de devoluciones"
      introduction="Los servicios de Mikuva se realizan sobre material único y a la medida. Esta política distingue cancelaciones, reembolsos e incidencias técnicas."
    >
      <p>
        Mikuva no cuenta con un sistema de reembolsos automatizados. Las solicitudes se revisan de
        forma individual y deben presentarse mediante el{" "}
        <Link to="/contacto">formulario de contacto</Link>, acompañadas del folio del pedido y la
        información necesaria para identificar el caso.
      </p>

      <LegalSection id="antes-envio" title="1. Cancelación antes de enviar el material">
        <p>
          Si el cliente cancela antes de despachar sus originales, Mikuva procesará el reembolso
          total mediante Mercado Pago. El tiempo para que el importe se refleje depende del medio de
          pago, el banco emisor y las políticas de Mercado Pago.
        </p>
      </LegalSection>

      <LegalSection id="recibido" title="2. Material recibido, sin procesar">
        <p>
          Si el material ya llegó a las instalaciones de Mikuva pero la digitalización todavía no
          comenzó, se reembolsará el costo del servicio de digitalización. Los gastos de transporte
          de ida o vuelta que ya se hayan generado no son reembolsables.
        </p>
      </LegalSection>

      <LegalSection id="iniciado" title="3. Servicio iniciado o finalizado">
        <p>
          Debido a que la digitalización es un servicio realizado a la medida, no se aceptan
          cancelaciones ni devoluciones de dinero una vez iniciado el proceso técnico, sin perjuicio
          de la garantía de calidad indicada a continuación y de los derechos que correspondan al
          cliente conforme a la legislación aplicable.
        </p>
      </LegalSection>

      <LegalSection id="calidad" title="4. Garantía de calidad y redigitalización">
        <p>
          El cliente cuenta con <strong>15 días naturales</strong> desde la recepción de sus
          archivos digitales para reportar archivos faltantes, archivos corruptos o defectos
          técnicos atribuibles al proceso de digitalización de Mikuva.
        </p>
        <p>
          Esta cobertura no aplica a deterioro, falta de información, pérdida de detalle, hongos,
          humedad, daños, alteraciones de color u otros defectos que ya existían en el material
          físico original y que no fueron causados por la digitalización.
        </p>
        <p>
          Cuando Mikuva confirme que la incidencia es atribuible a su proceso, redigitalizará sin
          costo adicional los elementos afectados y cubrirá los gastos de envío asociados a esa
          corrección.
        </p>
      </LegalSection>

      <LegalSection id="como-reportar" title="5. Cómo reportar una incidencia">
        <p>
          La solicitud debe incluir el folio del pedido, una descripción clara del problema y la
          identificación de los archivos afectados. Mikuva podrá solicitar información adicional
          estrictamente necesaria para revisar el caso.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
