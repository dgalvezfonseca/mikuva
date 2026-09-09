# Mercado Pago Webhook Contract

## Public endpoint

`POST /api/webhooks/mercadopago` receives bounded JSON without browser-session authorization.

## Required verification

- Validate `x-signature`, `x-request-id`, and query `data.id` using the official SDK secret.
- Require the parsed `payment` notification to identify the same payment ID.
- Fetch that payment server-side, then require verified `approved` status, external reference, exact MXN amount/currency, and local-order relationship before approval.
- Treat collector/account, preference ID, and environment correlation as additional validation only: they block approval solely when the official Checkout Pro contract and authoritative resource guarantee the field is present and reliable.
- In one transaction, lock records, deduplicate the event, apply a monotonic transition, and record `payment_events`.

## Responses

| Condition | Status |
|---|---|
| Processed, duplicate, or safely rejected mismatch | `200` |
| Missing/invalid signature | `401` |
| Oversized body | `413` |
| Malformed/mismatched notification | `400` |
| Temporary provider/database failure | `503` |

No return-page request invokes this endpoint or changes payment state.
