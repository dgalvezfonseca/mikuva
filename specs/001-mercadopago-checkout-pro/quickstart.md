# Validation Guide: Mercado Pago Checkout Pro

## Preconditions

- Use an isolated local/test database and Mercado Pago test accounts; do not use production credentials or real payments.
- Provide redacted server-only test configuration outside source control and a reachable HTTPS callback base.
- Confirm the test Webhook URL is registered before notification testing.

## Automated sequence

1. Add and run focused tests before production edits; record valid RED evidence.
2. Implement the smallest change set; rerun the same tests to GREEN.
3. Run `bun run typecheck`, `bun run lint`, `bun test`, `bun run build`, and `git diff --check`.

Expected: all pass. Coverage includes authoritative pricing, preference reuse/expiry, redirect URL validation, signature and body-size protection, remote payment validation, idempotency, ordered events, and return-page non-mutation.

## Test-account journey

1. Initiate a valid checkout and confirm redirect only to official Checkout Pro.
2. Complete it with a permitted test buyer.
3. Confirm a signed payment notification reconciles the matching MXN order once.
4. Repeat/late-send the notification and verify no duplicate or downgrade.
5. Visit every return page directly with arbitrary query values and verify no payment-state change.

## Final E2E gate

Only after separate deployment/configuration authorization, repeat the hosted journey at `https://mikuva.com`. Confirm HTTPS callbacks, signed reconciliation, no embedded card fields, and no Stripe/Brick runtime artifacts. This validation gate does not authorize deployment.
