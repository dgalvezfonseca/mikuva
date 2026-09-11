import { createFileRoute, Link } from "@tanstack/react-router";

import { LegalDocument, LegalSection } from "@/components/legal/LegalDocument";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/politica-de-envios")({
  head: () =>
    pageHead(
      "Política de envíos",
      "Consulta cómo se coordina el traslado, recepción y devolución de materiales físicos en Mikuva.",
      "/politica-de-envios",
    ),
  component: ShippingPolicyPage,
});

function ShippingPolicyPage() {
  return (
    <LegalDocument
      eyebrow="Recepción y devolución"
      title="Política de envíos"
      introduction="El transporte del material físico y el proceso de digitalización son etapas distintas. Aquí explicamos cómo se cotizan, coordinan y estiman."
    >
      <LegalSection id="cobertura" title="1. Cobertura y gestión logística">
        <p>
          Los servicios con recolección o envío se ofrecen dentro de la República Mexicana. Mikuva
          utilizará <strong>Envia.com</strong> como plataforma para consultar y gestionar opciones
          logísticas disponibles mediante distintos transportistas. Esto no implica exclusividad con
          una paquetería determinada.
        </p>
        <p>
          La integración automática con Envia.com aún no se encuentra activa. Mientras se habilita,
          cualquier opción de envío, transportista, servicio y costo aplicable deberá comunicarse y
          confirmarse con el cliente antes de incorporarse al total correspondiente.
        </p>
      </LegalSection>

      <LegalSection id="cotizacion" title="2. Cotización y costo del envío">
        <p>
          El precio del envío puede variar según el origen, destino, código postal, dimensiones,
          peso, servicio disponible y transportista. Mikuva no promete tarifas fijas ni una
          paquetería específica.
        </p>
        <p>
          Cuando la cotización automática esté disponible, Mikuva volverá a validar la opción
          elegida antes del pago. El costo, el transportista, el servicio, el tiempo estimado y el
          total sólo serán válidos después de esa confirmación.
        </p>
      </LegalSection>

      <LegalSection id="domicilio" title="3. Datos de domicilio">
        <p>
          Para cotizar, coordinar la recepción o devolución y generar una guía podrán solicitarse:
          calle, número exterior, número interior opcional, colonia, código postal, municipio o
          alcaldía, estado, país y referencias de entrega. Estos datos se tratarán conforme al{" "}
          <Link to="/aviso-de-privacidad">Aviso de privacidad</Link>.
        </p>
      </LegalSection>

      <LegalSection id="embalaje" title="4. Preparación y envío a Mikuva">
        <p>
          El embalaje adecuado del material antes de entregarlo al transportista es responsabilidad
          del cliente. Se recomienda utilizar una caja rígida, protección contra humedad y material
          de amortiguación que impida el movimiento de los originales.
        </p>
        <p>
          Mikuva no responde por paquetes dañados, extraviados o incompletos durante el trayecto de
          ida a sus instalaciones cuando el hecho sea atribuible al transporte. El cliente puede
          contratar la cobertura o seguro que ofrezca el transportista para el valor declarado del
          material.
        </p>
      </LegalSection>

      <LegalSection id="procesamiento" title="5. Tiempos internos de digitalización">
        <p>
          Los plazos publicados son aproximados y comienzan a partir de la recepción del material.
          Pueden variar por volumen, formato, estado físico y alcance confirmado del pedido:
        </p>
        <ul>
          <li>
            Fotografías, álbumes, negativos y diapositivas: aproximadamente{" "}
            <strong>72 horas</strong>.
          </li>
          <li>
            Película 8 mm y Super 8: aproximadamente <strong>5 a 7 días hábiles</strong>.
          </li>
        </ul>
        <p>
          Estos plazos corresponden al procesamiento interno de Mikuva y no incluyen el tiempo de
          traslado de la paquetería.
        </p>
      </LegalSection>

      <LegalSection id="transito" title="6. Tiempos de tránsito y devolución">
        <p>
          Las fechas mostradas por Envia.com o por los transportistas son estimaciones y pueden
          cambiar por cobertura, operación de la paquetería, clima, temporada u otras circunstancias
          ajenas a Mikuva.
        </p>
        <p>
          Una vez concluido el trabajo, los archivos digitales se entregan por el medio acordado y
          los originales físicos se preparan para su devolución. Salvo una corrección aprobada
          atribuible a Mikuva, el cliente cubre los costos de retorno que hayan sido previamente
          informados y aceptados.
        </p>
      </LegalSection>

      <LegalSection id="incidencias-envio" title="7. Incidencias de transporte">
        <p>
          Cualquier daño, retraso o pérdida durante el transporte deberá reportarse tan pronto como
          sea posible con el número de guía y evidencia disponible para gestionar el caso conforme a
          las condiciones del transportista seleccionado.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
