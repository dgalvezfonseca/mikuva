import { createFileRoute, Link } from "@tanstack/react-router";

import { LegalDocument, LegalSection } from "@/components/legal/LegalDocument";
import { routeMeta } from "@/lib/seo";

export const Route = createFileRoute("/terminos-y-condiciones")({
  head: () => ({
    meta: routeMeta(
      "Términos y condiciones",
      "Condiciones comerciales aplicables a los servicios de digitalización contratados con Mikuva.",
    ),
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalDocument
      eyebrow="Condiciones del servicio"
      title="Términos y condiciones"
      introduction="Estas condiciones explican cómo se cotiza, confirma, procesa y entrega un servicio de digitalización de Mikuva."
    >
      <p>
        Mikuva es una marca operada por <strong>Arguz Digitalización S.A. de C.V.</strong> y ofrece
        servicios de digitalización de fotografías, negativos, diapositivas, álbumes, películas 8
        mm, Super 8 y otros medios físicos indicados en su catálogo.
      </p>

      <LegalSection id="servicio-precios" title="1. Servicio, cantidades y precios">
        <p>
          Los precios de digitalización mostrados en el sitio, expresados en pesos mexicanos (MXN),
          se calculan según la información, formato y cantidad declarados por el cliente al
          configurar su pedido.
        </p>
        <p>
          Si al recibir físicamente el material existe una diferencia en cantidad, formato o tipo de
          material respecto de lo declarado, Mikuva comunicará el ajuste correspondiente y
          solicitará la autorización del cliente antes de continuar o realizar un cargo adicional.
          Mikuva valida los productos, variantes y precios vigentes antes de generar el pago.
        </p>
      </LegalSection>

      <LegalSection id="pago" title="2. Pedidos y proceso de pago">
        <p>
          Los pagos se procesan mediante Checkout Pro de Mercado Pago. Mikuva no solicita ni recibe
          directamente números de tarjeta, CVV o fechas de vencimiento.
        </p>
        <p>
          Un pedido se considera pagado únicamente cuando la confirmación verificable de Mercado
          Pago es recibida y validada por el servidor de Mikuva. Volver a una página de éxito en el
          navegador no confirma por sí mismo el pago. Los estados de pago pueden incluir pendiente,
          aprobado, rechazado, cancelado y reembolsado.
        </p>
      </LegalSection>

      <LegalSection id="logistica" title="3. Recepción, envío y devolución del material">
        <p>
          La recepción y devolución del material se sujetan a la{" "}
          <Link to="/politica-de-envios">Política de envíos</Link>. Los costos y tiempos de
          transporte son distintos del precio y del tiempo interno de digitalización. Las opciones
          logísticas pueden variar según el origen, destino, dimensiones, peso, servicio disponible
          y transportista.
        </p>
      </LegalSection>

      <LegalSection id="derechos-material" title="4. Derechos sobre el material">
        <p>
          El cliente declara que es propietario del material o que cuenta con autorización
          suficiente de las personas titulares para solicitar su digitalización. Mikuva no adquiere
          derechos de propiedad sobre las imágenes o grabaciones recibidas.
        </p>
        <p>
          Mikuva puede rechazar material cuya digitalización sea ilegal o vulnere derechos de
          terceros, y coordinará su devolución cuando corresponda.
        </p>
      </LegalSection>

      <LegalSection id="condicion-material" title="5. Condición previa y responsabilidad técnica">
        <p>
          El cliente debe informar si el material presenta fragilidad por antigüedad, hongos,
          humedad, adhesivos, roturas u otro deterioro previo. Mikuva no responde por defectos o
          daños que ya existían en el soporte original ni por el deterioro inherente a su condición.
        </p>
        <p>
          En incidentes excepcionales atribuibles exclusivamente al proceso interno de Mikuva, la
          responsabilidad se limita al reemplazo del valor de un medio físico virgen equivalente,
          sin perjuicio de los derechos que correspondan al cliente conforme a la legislación
          aplicable.
        </p>
      </LegalSection>

      <LegalSection id="archivos" title="6. Entrega y conservación temporal de archivos">
        <p>
          Después de la entrega, Mikuva conserva durante 15 días naturales las copias digitales del
          trabajo, incluyendo TIFF y JPEG, únicamente para atender incidencias o correcciones
          relacionadas con esa entrega. Al concluir el periodo, las copias se eliminan de sus
          servidores conforme al proceso aplicable.
        </p>
      </LegalSection>

      <LegalSection id="cancelaciones" title="7. Cancelaciones, devoluciones y calidad">
        <p>
          Las condiciones para cancelar un servicio, solicitar un reembolso o reportar un defecto
          técnico se detallan en la{" "}
          <Link to="/politica-de-devoluciones">Política de devoluciones</Link>.
        </p>
      </LegalSection>

      <LegalSection id="aceptacion" title="8. Aceptación y modificaciones">
        <p>
          Al solicitar un servicio, el cliente reconoce haber consultado estas condiciones y las
          políticas vinculadas. Cualquier modificación se publicará en esta ruta con su fecha de
          actualización y no tendrá efectos retroactivos sobre condiciones ya aceptadas, salvo
          obligación legal.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
