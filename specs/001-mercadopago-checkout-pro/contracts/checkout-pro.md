# Checkout Pro Contract

## Checkout request and response

The existing checkout server function accepts customer details, product/variant identifiers, quantities, and a client request ID. It rejects browser-provided prices, totals, provider IDs, callback URLs, and redirect URLs.

On success it returns:

```json
{ "initPoint": "https://[official Mercado Pago host]/...", "folio": "MK-YYYY-NNNNN" }
```

The browser performs a top-level redirect. `initPoint` is derived only from the current official `init_point` response field for both TEST and production credentials. The server rejects a missing/invalid `init_point`; it does not fall back to or branch on `sandbox_init_point`.

## Preference data

Items and MXN amounts derive from persisted order snapshots. Preference data includes an order-folio `external_reference`, `back_urls` at `https://mikuva.com/pago/{exitoso,pendiente,error}`, `auto_return: "approved"`, and the public webhook `notification_url`. Return query values are informational only.
