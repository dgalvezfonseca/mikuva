# Data Model: Mercado Pago Checkout Pro

## Existing entities retained

- **Order (`orders`)**: authoritative customer, item snapshots, integer-centavo total, MXN, unique folio, checkout-request idempotency key, and local payment status.
- **Payment (`payments`)**: links order to `provider = mercadopago`; stores preference ID, verified provider payment ID, amount, currency, and external reference. Existing provider-preference/payment uniqueness remains.
- **Payment event (`payment_events`)**: stores provider event key, payment ID, topic/action, and reconciliation result. Existing `(provider, provider_event_key)` uniqueness makes duplicate events idempotent.

## Invariants

```text
payment.external_reference = order.folio = verified remote external_reference
payment.amount = order.total = verified remote amount in centavos
payment.currency = order.currency = verified remote currency = MXN
```

The transaction locks the order and candidate payments, writes the event and state together, and never downgrades approved/refunded state through a late notification.

## Database strategy

**NO migration required for this feature.** Current migrations `0000`–`0002`, the source schema, and the stated real server all use `enum('mercadopago')` for `payments.provider` and `payment_events.provider`. Do not execute `0003`, run `db:migrate`, request an `ALTER`, modify `mikuva_runtime`, or edit historical migrations or data.
