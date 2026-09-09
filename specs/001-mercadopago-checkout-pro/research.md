# Research: Mercado Pago Checkout Pro

## Decisions

### SDK and Checkout Pro API

**Decision**: Retain the installed server-only `mercadopago` Node SDK and use `MercadoPagoConfig`, `Preference`, and `Payment`. Use the Checkout Pro Preferences API, not the newer Orders API, because this feature requires `init_point`.

**Rationale**: A preference is the Checkout Pro object that creates the hosted checkout URL. It matches the existing server code and removes any need for the React SDK or embedded card UI.

**Alternatives considered**: Payment Brick, Checkout Bricks, SDK React, and Orders API; all are outside the requested hosted Preferences flow.

**Sources**: [Preferences overview](https://www.mercadopago.com.mx/developers/en/reference/online-payments/checkout-pro-preferences/overview), [create preference](https://www.mercadopago.com.mx/developers/es/reference/online-payments/checkout-pro-preferences/create-preference/post), [Node setup](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro-preferences/configure-development-enviroment).

### Preference and redirect

**Decision**: Create preference data only from stored MXN snapshots, with a stable `external_reference`, `back_urls`, `auto_return: "approved"`, and `notification_url`. Redirect only to the provider-returned, HTTPS official Checkout Pro URL.

**Rationale**: `back_urls` return the buyer by GET and are not payment proof. A preference-level `notification_url` is supported and takes precedence over dashboard configuration.

**Sources**: [return URLs](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro-preferences/configure-back-urls), [payment notifications](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro-preferences/payment-notifications).

### Current redirect field for TEST and production

**Decision**: Use only `init_point` for the redirect with both TEST and production credentials. Reject a missing or invalid `init_point`; do not branch or fall back to `sandbox_init_point`.

**Rationale**: The current Preferences overview identifies `init_point` as the Checkout Pro redirect field. The current response reference still displays `sandbox_init_point`, but current Checkout Pro documentation explicitly states that field is nonfunctional for integration testing and directs testing to `init_point`. The plan therefore follows the selected API's documented contract, not historical compatibility behavior.

**Sources**: [Preferences overview](https://www.mercadopago.com.mx/developers/es/reference/online-payments/checkout-pro-preferences/overview), [current Checkout Pro testing note](https://www.mercadopago.com.mx/developers/en/docs/checkout-pro-preferences/additional-settings/shipping/payment-with-shipment), [create preference response](https://www.mercadopago.com.mx/developers/es/reference/online-payments/checkout-pro-preferences/create-preference/post).

### Preference reuse and expiry

**Decision**: Reuse a persisted preference when local invariants prove it belongs to the same unpaid order and remains reusable from available information. Query Mercado Pago only to resolve expiry, inconsistency, or uncertainty; on confirmed expiry/invalidation, create a traced replacement. Do not claim a remote idempotency header for Preferences without evidence.

**Rationale**: Official documentation supports preference expiry fields but does not require a remote preference lookup on every retry; the reviewed idempotency requirement is for payment/refund APIs, not specifically preference creation. Local transaction/uniqueness remains the duplicate-control boundary.

**Sources**: [preference term](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro-preferences/additional-settings/term-of-preference), [idempotency notice](https://www.mercadopago.com.mx/developers/es/news/2023/01/04/Idempotency-key-usage-will-be-mandatory).

### Webhook and reconciliation

**Decision**: Subscribe to `payment` Webhooks. Before approval, require `x-signature`/`x-request-id`/`data.id` authenticity, matching payment ID, server-side lookup, verified `approved` status, external reference, exact amount, MXN currency, and local-order relationship. Treat collector/account, preference ID, and environment correlation as additional checks that block only when the official Checkout Pro contract and authoritative resource guarantee a present, reliable value.

**Rationale**: The official Webhook contract provides signed authentication; the notification body and return URL alone are not sufficient. Additional fields can improve reconciliation evidence, but must not reject legitimate payments solely because an optional or undocumented Checkout Pro field is absent. Existing event uniqueness, locks, transactions, and monotonic transitions cover retries and reordering.

**Sources**: [Webhooks](https://www.mercadopago.com.mx/developers/es/docs/links-and-debts/additional-content/your-integrations/notifications/webhooks), [Checkout Pro payment notifications](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro-preferences/payment-notifications).

### Credentials and public URL

**Decision**: Keep access token and Webhook secret server-only; model test/production explicitly rather than from token prefixes. Use test accounts in test and `https://mikuva.com` for final public callbacks.

**Sources**: [test accounts](https://www.mercadopago.com.mx/developers/en/docs/checkout-pro-preferences/test-accounts), [return URLs](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro-preferences/configure-back-urls).

## Tooling Limitation

The configured `mercadopago-mcp` returned HTTP 401 during initialization because no user session was available. No provider behavior was inferred from it; the decisions above use only official Mercado Pago Developers sources.
