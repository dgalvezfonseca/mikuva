# Feature Specification: Mercado Pago Checkout Pro

**Feature Branch**: `001-mercadopago-checkout-pro`  
**Created**: 2026-09-08  
**Status**: Draft  
**Input**: User description: "Reemplazar Stripe como proveedor de pagos de Mikuva por Mercado Pago Checkout Pro como único proveedor activo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pagar mediante Checkout Pro (Priority: P1)

Como comprador, quiero iniciar el pago de mi solicitud y continuar en el entorno oficial de Mercado Pago para completar el pago sin introducir datos de tarjeta dentro de Mikuva.

**Why this priority**: Es el camino indispensable para que un comprador pueda pagar una solicitud.

**Independent Test**: Se puede crear una solicitud válida desde el checkout y comprobar que el comprador recibe una única URL oficial de Checkout Pro para continuar el pago.

**Acceptance Scenarios**:

1. **Given** un checkout con artículos y cantidades válidos, **When** el comprador solicita pagar, **Then** Mikuva crea o reutiliza de forma segura una solicitud pendiente basada en los precios y cantidades autorizados y redirige al comprador a la URL oficial de Checkout Pro.
2. **Given** una solicitud que ya tiene un intento de pago activo, **When** el comprador vuelve a solicitar pagar, **Then** Mikuva no crea un segundo cobro y dirige al comprador al intento existente o comunica que no puede iniciarse otro.
3. **Given** datos alterados, incompletos o no válidos enviados desde el navegador, **When** el comprador solicita pagar, **Then** Mikuva rechaza la operación sin crear un pago y muestra un mensaje útil.

---

### User Story 2 - Confirmar pagos verificados (Priority: P1)

Como equipo de Mikuva, quiero que el estado local de una solicitud cambie solo después de una confirmación verificable de Mercado Pago, para poder entregar servicios con confianza.

**Why this priority**: Un pago no verificado puede causar pérdida económica o entregar un servicio sin cobro.

**Independent Test**: Se puede enviar una notificación válida y una repetida de un pago aprobado, pendiente, rechazado y reembolsado, y comprobar que el estado final y el historial quedan reconciliados una sola vez.

**Acceptance Scenarios**:

1. **Given** una notificación pública de un pago, **When** Mikuva la recibe, **Then** verifica su autenticidad y consulta el pago autorizado antes de modificar la solicitud local.
2. **Given** un pago autorizado que coincide en monto MXN, moneda y referencia con una solicitud local, **When** su estado es aprobado, **Then** Mikuva marca la solicitud como aprobada una sola vez y registra el evento de pago.
3. **Given** una notificación repetida, tardía o fuera de orden, **When** Mikuva la procesa, **Then** conserva una transición de estado válida, evita efectos duplicados y conserva el historial del evento.
4. **Given** un pago cuyo monto, moneda o referencia no coincide con la solicitud, **When** Mikuva lo verifica, **Then** no marca la solicitud como pagada y deja evidencia suficiente para su investigación.

---

### User Story 3 - Entender el resultado sin confirmar indebidamente (Priority: P2)

Como comprador que vuelve desde Mercado Pago, quiero ver una página clara de éxito, pendiente o fallo para saber qué ocurrió sin que mi regreso por sí solo confirme el pago.

**Why this priority**: Reduce incertidumbre del comprador y evita que una URL de retorno se convierta en una vía de confirmación insegura.

**Independent Test**: Se pueden visitar directamente las tres páginas de retorno, con y sin parámetros de pago, y comprobar que informan el resultado sin modificar el estado de ninguna solicitud.

**Acceptance Scenarios**:

1. **Given** un comprador que regresa tras completar Checkout Pro, **When** visita la página de éxito, **Then** ve que el pago está en verificación y su visita no cambia el estado de la solicitud.
2. **Given** un comprador que regresa con un pago pendiente o fallido, **When** visita la página correspondiente, **Then** recibe una explicación clara y una vía para volver a Mikuva sin confirmar el pago.

---

### User Story 4 - Operar con un único proveedor activo (Priority: P2)

Como equipo de Mikuva, quiero que Mercado Pago Checkout Pro sea el único flujo de pagos activo, para no mantener proveedores ni formularios de tarjeta que puedan confundir o ampliar la superficie de riesgo.

**Why this priority**: Reduce la complejidad operativa y asegura una experiencia de pago coherente.

**Independent Test**: Se puede recorrer el checkout, las rutas públicas de pago y la configuración de ejecución para comprobar que no existe un flujo activo de Stripe, Payment Brick, Checkout Bricks ni captura de tarjeta en Mikuva.

**Acceptance Scenarios**:

1. **Given** un comprador en el checkout, **When** elige pagar, **Then** solo se le ofrece continuar hacia Mercado Pago Checkout Pro.
2. **Given** la aplicación en ejecución, **When** se revisan los flujos de pago disponibles, **Then** Stripe, Payment Brick, Checkout Bricks y formularios de tarjeta embebidos no están activos ni son accesibles.

### Edge Cases

- La creación de la preferencia falla, expira o devuelve una URL que no pertenece a Mercado Pago: no se redirige al comprador y no se confirma la solicitud.
- Dos solicitudes de pago simultáneas para la misma solicitud: solo una puede producir un intento de pago activo y reutilizable.
- La notificación carece de autenticidad, identifica un pago inexistente o no permite consultar el pago autorizado: no cambia ningún estado local.
- El pago aprobado llega antes o después de la visita a una página de retorno: solo la reconciliación verificada determina el estado local.
- El proveedor comunica un estado no reconocido o una transición que degradaría un pago ya aprobado o reembolsado: se conserva el estado seguro y se registra el evento.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE usar Mercado Pago Checkout Pro como único proveedor y flujo de pago activo para solicitudes pagadas en MXN.
- **FR-002**: El sistema DEBE crear y validar cada solicitud de pago en el servidor usando exclusivamente precios, cantidades y totales autorizados; no DEBE aceptar importes ni totales enviados por el navegador.
- **FR-003**: El sistema DEBE crear o reutilizar un único intento de pago pendiente por solicitud de forma segura ante reintentos y concurrencia, impidiendo doble cobro.
- **FR-004**: El sistema DEBE obtener una URL oficial y segura de Checkout Pro antes de redirigir al comprador; no DEBE redirigir a una URL no oficial o no válida.
- **FR-005**: El sistema DEBE permitir que Mercado Pago procese el pago fuera de Mikuva; no DEBE mostrar Payment Brick, Checkout Bricks, formularios de tarjeta embebidos ni otra captura de tarjeta dentro de Mikuva.
- **FR-006**: El sistema DEBE exponer una vía pública para recibir notificaciones de pago y verificar cada notificación y su pago autorizado antes de reconciliar datos locales.
- **FR-007**: Antes de aprobar una solicitud, el sistema DEBE validar que el pago autorizado coincide con la solicitud en importe, moneda MXN y referencia de orden.
- **FR-008**: El sistema DEBE actualizar de manera atómica e idempotente el estado del pago y de la solicitud, conservar transiciones válidas frente a eventos duplicados, tardíos o desordenados, y registrar cada evento recibido en `payment_events`.
- **FR-009**: El sistema DEBE mantener los secretos de Mercado Pago exclusivamente fuera del navegador y no exponerlos en páginas, redirecciones, mensajes ni registros.
- **FR-010**: El sistema DEBE ofrecer páginas informativas de resultado exitoso, pendiente y fallido; visitar cualquiera de estas páginas o cualquier URL de retorno NUNCA DEBE marcar una solicitud como pagada.
- **FR-011**: El sistema DEBE retirar Stripe de todo flujo y configuración de ejecución de pagos, sin introducir un proveedor alternativo activo.
- **FR-012**: El sistema DEBE usar `https://mikuva.com` como base pública para los enlaces de retorno y notificaciones del flujo final.

### Key Entities

- **Solicitud**: Registro local de compra con artículos, importes autorizados en MXN, referencia única y estado de pago.
- **Intento de pago**: Registro asociado a una solicitud que identifica la preferencia y, cuando exista, el pago de Mercado Pago, su importe, moneda, referencia y estado.
- **Evento de pago**: Registro inmutable de una notificación procesada, su identificador único, resultado de validación y estado reconciliado para impedir procesamiento duplicado.
- **Notificación de pago**: Aviso recibido desde Mercado Pago que identifica un pago que debe verificarse antes de afectar una solicitud.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En pruebas de aceptación, el 100% de los checkouts válidos redirige al comprador a Checkout Pro con el importe y la moneda MXN de su solicitud autorizada.
- **SC-002**: En pruebas de reintento y concurrencia para una misma solicitud, el 100% de los casos produce como máximo un intento de cobro activo.
- **SC-003**: En pruebas de notificaciones aprobadas, pendientes, rechazadas, reembolsadas, duplicadas y fuera de orden, el 100% de los resultados locales coincide con el pago verificado y no duplica eventos ni efectos.
- **SC-004**: En pruebas de visitas directas a las páginas y URLs de retorno, el 100% de las visitas deja sin cambios el estado de pago local.
- **SC-005**: Un comprador con una conexión normal puede iniciar el pago y llegar al entorno de Mercado Pago en menos de 10 segundos en al menos el 95% de las pruebas de aceptación.

## Assumptions

- Las solicitudes existentes, el inventario de precios autorizados y el historial de pagos se conservan; esta función no exige borrar datos históricos de Stripe.
- Las credenciales y la cuenta de Mercado Pago necesarias para Checkout Pro estarán disponibles únicamente en el entorno del servidor antes de la implementación y pruebas autorizadas.
- La validación de Mercado Pago puede distinguir notificaciones auténticas de las no auténticas y recuperar los datos de pago autorizados para la reconciliación.
- El alcance incluye retirar Stripe, Payment Brick y Checkout Bricks del runtime de pagos, pero no ejecutar migraciones, despliegues, cambios de infraestructura, commits ni pushes durante esta fase de especificación.
- La aplicación seguirá usando una sola moneda de cobro: MXN.
