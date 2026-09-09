import { createFileRoute, Link } from "@tanstack/react-router";

import { LegalDocument, LegalSection } from "@/components/legal/LegalDocument";
import { SITE } from "@/constants/site";
import { routeMeta } from "@/lib/seo";

export const Route = createFileRoute("/aviso-de-privacidad")({
  head: () => ({
    meta: routeMeta(
      "Aviso de privacidad",
      "Conoce qué datos trata Mikuva, para qué los utiliza y cómo puedes ejercer tus derechos.",
    ),
  }),
  component: PrivacyNoticePage,
});

function PrivacyNoticePage() {
  return (
    <LegalDocument
      eyebrow="Privacidad y datos personales"
      title="Aviso de privacidad"
      introduction="Este aviso explica de forma integral cómo Mikuva obtiene, utiliza, protege y conserva los datos necesarios para prestar sus servicios."
    >
      <p>
        En cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los
        Particulares, <strong>Arguz Digitalización S.A. de C.V.</strong> (RFC ADI050519TR7), que
        opera bajo el nombre comercial <strong>Mikuva</strong> (en adelante, “Mikuva” o “el
        Responsable”), es responsable del tratamiento de sus datos personales.
      </p>
      <p>
        El Responsable tiene su domicilio en Av. Miguel Hidalgo 24-B, Col. Lomas Granjas de
        Guadalupe, C.P. 54760, Cuautitlán Izcalli, Estado de México.
      </p>

      <LegalSection id="datos-recabados" title="1. Datos personales recabados">
        <p>
          Los datos varían según la forma en que la persona utiliza el sitio o contrata el servicio:
        </p>
        <ul>
          <li>
            <strong>Pedido y checkout:</strong> nombre, apellidos, correo electrónico, teléfono,
            productos y variantes solicitados, cantidades, folio, importes y estados del pedido y
            del pago.
          </li>
          <li>
            <strong>Contacto:</strong> nombre, correo electrónico, teléfono, tipo de material y la
            información que la persona decida incluir en el mensaje.
          </li>
          <li>
            <strong>Logística:</strong> cuando se habilite la cotización y gestión de envíos, podrán
            solicitarse calle, número exterior, número interior opcional, colonia, código postal,
            municipio o alcaldía, estado, país y referencias de entrega.
          </li>
          <li>
            <strong>Material físico y contenido:</strong> fotografías, películas y otros medios que
            pueden contener rostros, imágenes de menores de edad, lugares, fechas, dedicatorias o
            datos de terceras personas. Estos contenidos pueden incluir datos personales sensibles.
          </li>
          <li>
            <strong>Datos técnicos:</strong> información de navegación generada por cookies o
            tecnologías similares, de acuerdo con las preferencias de consentimiento descritas en
            este aviso.
          </li>
        </ul>
        <p>
          Mikuva <strong>no recopila ni almacena directamente</strong> números de tarjeta, CVV,
          fechas de vencimiento, contraseñas bancarias ni documentos oficiales de identificación.
          Los datos financieros del pago son procesados por Mercado Pago.
        </p>
      </LegalSection>

      <LegalSection id="finalidades" title="2. Finalidades del tratamiento">
        <h3>Finalidades necesarias para prestar el servicio</h3>
        <ul>
          <li>Procesar, confirmar y administrar pedidos de digitalización.</li>
          <li>Identificar al cliente y mantener comunicación sobre su pedido.</li>
          <li>Coordinar la recepción y devolución de materiales físicos.</li>
          <li>
            Cotizar envíos, preparar guías y gestionar la logística cuando esas funciones se
            encuentren habilitadas y sean solicitadas por el cliente.
          </li>
          <li>Procesar pagos y verificar estados de transacción mediante Mercado Pago.</li>
          <li>Digitalizar el material y entregar los archivos resultantes.</li>
          <li>Atender incidencias, correcciones y solicitudes relacionadas con la entrega.</li>
          <li>Prevenir fraude y cumplir obligaciones contractuales, fiscales y legales.</li>
        </ul>
        <h3>Finalidades opcionales</h3>
        <p>
          Con consentimiento previo, Mikuva utiliza Matomo para medir el uso del sitio y Chatwoot
          para ofrecer chat de atención. Google Maps puede cargarse en la página de contacto para
          mostrar la ubicación. Estas opciones pueden administrarse desde el control de privacidad
          disponible en el sitio.
        </p>
      </LegalSection>

      <LegalSection id="material" title="3. Fotografías, material físico y archivos digitales">
        <p>
          El material físico se utiliza exclusivamente para prestar el servicio de digitalización.
          Su acceso se limita al personal que necesita intervenir en el proceso. Mikuva no adquiere
          derechos de propiedad sobre las imágenes entregadas por el cliente.
        </p>
        <p>
          Después de entregar el trabajo, Mikuva conserva temporalmente durante{" "}
          <strong>15 días naturales posteriores a la entrega</strong> las copias digitales
          correspondientes al trabajo, incluyendo archivos TIFF y JPEG. Esta conservación permite
          atender incidencias, correcciones o necesidades relacionadas con la entrega. Al concluir
          ese periodo, dichas copias se eliminan de los servidores de Mikuva conforme al proceso de
          eliminación aplicable.
        </p>
        <p>
          La eliminación de estas copias de trabajo no implica borrar anticipadamente los registros
          administrativos, fiscales, contractuales o de pago que deban conservarse por una
          obligación legal o para acreditar la prestación del servicio.
        </p>
      </LegalSection>

      <LegalSection id="proveedores" title="4. Proveedores y tratamiento por terceros">
        <p>
          Para operar el sitio y prestar el servicio, Mikuva utiliza proveedores que reciben sólo la
          información necesaria para su función:
        </p>
        <ul>
          <li>
            <strong>Mercado Pago:</strong> procesa pagos mediante Checkout Pro. Mikuva recibe
            identificadores de operación y estados de pago, pero no los datos completos de la
            tarjeta.
          </li>
          <li>
            <strong>Web3Forms:</strong> procesa el envío del formulario de contacto desde el
            servidor de Mikuva.
          </li>
          <li>
            <strong>Envia.com:</strong> forma parte de la operación logística prevista como
            plataforma para consultar y gestionar opciones ofrecidas por distintos transportistas.
            Cuando esta función se habilite y el cliente solicite un envío, se compartirán sólo los
            datos necesarios para cotizar, coordinar la recepción o devolución y generar la guía
            correspondiente. La integración automática todavía no está activa.
          </li>
          <li>
            <strong>Chatwoot, Matomo y Google Maps:</strong> se cargan únicamente según las
            preferencias de consentimiento elegidas por la persona usuaria.
          </li>
          <li>
            <strong>Google Fonts:</strong> proporciona las tipografías del sitio y puede recibir
            datos técnicos de conexión, como dirección IP, navegador y referencia de la solicitud.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="cookies" title="5. Cookies, almacenamiento local y servicios opcionales">
        <p>
          El sitio utiliza una cookie necesaria para recordar las preferencias de privacidad y
          almacenamiento local para conservar temporalmente el carrito. Los servicios funcionales y
          de analítica requieren consentimiento previo.
        </p>
        <div
          className="legal-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Cookies y tecnologías utilizadas"
        >
          <table>
            <thead>
              <tr>
                <th>Tecnología</th>
                <th>Finalidad</th>
                <th>Duración</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>mikuva_cookie_consent</code>
                </td>
                <td>Recuerda las categorías y servicios autorizados.</td>
                <td>182 días</td>
              </tr>
              <tr>
                <td>
                  <code>localStorage: mikuva.cart.v1</code>
                </td>
                <td>
                  Conserva identificadores, configuración, cantidades y precios del carrito; no
                  contiene datos personales de contacto ni datos financieros.
                </td>
                <td>Hasta vaciar el carrito o eliminar los datos del sitio en el navegador</td>
              </tr>
              <tr>
                <td>
                  <code>_pk_id.*</code> / <code>_pk_ses.*</code>
                </td>
                <td>Matomo: medición de visitas, sólo con consentimiento de analítica.</td>
                <td>13 meses / 30 minutos</td>
              </tr>
              <tr>
                <td>
                  <code>cw_conversation</code>
                </td>
                <td>
                  Chatwoot: mantiene la conversación del chat, sólo con consentimiento funcional.
                </td>
                <td>Variable según la sesión del servicio</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Chatwoot también puede crear una cookie <code>cw_user_{"{identifier}"}</code> si una
          integración utiliza la función <code>setUser</code>; Mikuva no utiliza esa función
          actualmente. No se atribuyen cookies específicas a Google Maps porque su presencia no ha
          sido confirmada en la implementación.
        </p>
      </LegalSection>

      <LegalSection id="arco" title="6. Derechos ARCO, revocación y contacto">
        <p>
          La persona titular puede solicitar acceso, rectificación, cancelación u oposición al
          tratamiento de sus datos, así como revocar su consentimiento o limitar el uso o
          divulgación de su información. La solicitud debe identificar a la persona titular, el
          derecho que desea ejercer y los datos relacionados con su petición.
        </p>
        <p>
          Mientras se confirma un correo exclusivo de privacidad, las solicitudes pueden iniciarse
          mediante el <Link to="/contacto">formulario de contacto</Link> o por teléfono al{" "}
          <a href={"tel:" + SITE.phoneHref}>{SITE.phone}</a>. Mikuva comunicará la determinación
          adoptada dentro del plazo máximo de veinte días contado desde la recepción de la
          solicitud, conforme a la legislación aplicable.
        </p>
        <p className="legal-manual">
          <strong>LEGAL MANUAL REQUIRED:</strong> el propietario debe confirmar y publicar el correo
          específico para solicitudes de privacidad y derechos ARCO.
        </p>
      </LegalSection>

      <LegalSection id="cambios" title="7. Cambios a este aviso">
        <p>
          Las modificaciones a este aviso se publicarán en esta misma ruta. La versión mostrada y su
          fecha de actualización permiten identificar el texto vigente.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
