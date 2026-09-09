# Implementation Plan: Mercado Pago Checkout Pro

**Branch**: `001-mercadopago-checkout-pro` | **Date**: 2026-09-08 | **Spec**: [spec.md](spec.md)

## Summary

Keep Mercado Pago's hosted Checkout Pro through its Preferences API and remove Payment Brick, Checkout Bricks, and the React SDK. Mikuva will validate the cart and create/reuse an order server-side, create/reuse a stored preference, validate the official returned URL, then redirect externally. Only the signed Webhook plus a server-side payment lookup may reconcile an order.

## Technical Context

**Language/Version**: TypeScript 5.8; React 19  
**Primary Dependencies**: TanStack Start/Router, Mercado Pago Node SDK 3.6, Zod, Drizzle ORM  
**Storage**: MySQL/MariaDB; existing `orders`, `payments`, and `payment_events`  
**Testing**: Bun native runner (`bun test`), focused unit and webhook integration-style tests; authorized test-account E2E after implementation  
**Target Platform**: Nitro node-server and browser redirect  
**Project Type**: Full-stack web application  
**Performance Goals**: 95% of valid acceptance checkouts reach hosted checkout within 10 seconds under normal connectivity  
**Constraints**: MXN only; server-authoritative totals; no embedded card UI; return URLs never mutate payment state; secrets server-only; final public base `https://mikuva.com`  
**Scale/Scope**: Mercado Pago Checkout Pro is the sole active provider. No migration, deployment, credential configuration, real payment, commit, or push in this phase.

## Constitution Check

*Pass. The Spec Kit constitution is an uncustomized template; `AGENTS.md` and the feature spec govern this work.*

- Stack: retain TanStack Start, React, TypeScript, Vite, Tailwind, shadcn/ui, Bun, Drizzle, MySQL/MariaDB, and Nitro. Add no dependency or framework.
- Security: trust only server-derived order snapshots and a signed Webhook followed by an authoritative provider lookup.
- Database: pass. **NO migration required for this feature.** The current source and stated real server already restrict both provider fields to `mercadopago`; do not execute `0003`, run `db:migrate`, request an `ALTER`, or modify `mikuva_runtime`.
- Operations: pass. This phase writes only Spec Kit artefacts.
- TDD: future implementation starts with focused RED tests. Mikuva excludes ECC checkpoint commits.

## Project Structure

### Documentation

```text
specs/001-mercadopago-checkout-pro/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── checkout-pro.md
│   └── mercadopago-webhook.md
└── tasks.md                 # Added by $speckit-tasks
```

### Source Code

```text
src/
├── db/{checkout.server.ts,orders.server.ts,schema.ts}
├── lib/{checkout.ts,checkout-input.ts,mercadopago.server.ts,
│        mercadopago-webhook.server.ts,mercadopago-webhook-core.ts,
│        security-headers.ts}
└── routes/{checkout.tsx,api.webhooks.mercadopago.ts,
            pago.exitoso.tsx,pago.pendiente.tsx,pago.error.tsx}
```

**Structure Decision**: Preserve existing boundaries. Reuse Checkout Pro and Webhook modules; delete Brick-only code instead of introducing another payment abstraction.

## Implementation Outline

1. Write tests first for preference data, reuse/expiry, and the documented `init_point` redirect contract for both TEST and production credentials; reject a missing/invalid `init_point` rather than falling back to another field. Also cover Webhook `notification_url`, signature/query rules, remote amount/currency/reference checks, duplicate/out-of-order events, and non-mutating return pages.
2. Keep only `beginMercadoPagoCheckout` in `src/lib/checkout.ts`; simplify `src/routes/checkout.tsx` to the server function and top-level external redirect. Remove all Brick state, SDK initialization, embedded-card UI, fallback flows, and Brick validation input.
3. Keep the official Node SDK clients (`MercadoPagoConfig`, `Preference`, `Payment`). Derive preference items from persisted order snapshots, record `external_reference`, and reuse a persisted preference when local invariants prove it belongs to the same unpaid order and remains reusable from available information. Query Mercado Pago only to resolve expiry, inconsistency, or uncertainty; on confirmed expiry/invalidation, create a traced replacement. Do not add a remote lookup to every retry without official evidence that it is required.
4. Send `back_urls`, `auto_return: "approved"` for the permitted public HTTPS origin, and `notification_url`. For both TEST and production credentials, use only the current officially documented `init_point` returned by the selected Preferences API/SDK; reject missing/invalid `init_point`, validate HTTPS and the Mercado Pago host, and never accept a browser redirect URL. Do not implement an `init_point`/`sandbox_init_point` fallback or branch.
5. Retain the public webhook route, 64 KiB streaming limit, row locks, transaction, event uniqueness, and monotonic transitions. Before approval, require notification authenticity, matching payment ID, server-side lookup, verified approved status, external reference, exact amount, MXN currency, and local-order relationship. Treat collector/account, preference ID, and environment correlation as additional checks: block only when official Checkout Pro documentation and the authoritative resource guarantee that a required value is present and reliable; otherwise record the result without rejecting a legitimate payment solely for its absence.
6. Keep return pages informational only. No return page invokes reconciliation or updates an order.
7. Remove `@mercadopago/sdk-react`, Brick files/tests, `MERCADOPAGO_PUBLIC_KEY`, and Brick CSP sources. No Stripe runtime dependency, source, route, CSP directive, environment entry, lockfile entry, or test exists in this checkout; retain historical data/migrations and make a final scan a release gate.
8. **NO migration required for this feature.** The repository has `0000`–`0002`, and the source plus stated server both use `enum('mercadopago')` for provider columns. Do not execute `0003`, run `db:migrate`, request an `ALTER`, or modify `mikuva_runtime`.
9. Retain server-only access token, Webhook secret, collector ID, explicit environment, and public origin; update only necessary configuration documentation without values.
10. Validate with `bun run typecheck`, `bun run lint`, `bun test`, `bun run build`, and `git diff --check`. After separately authorized configuration/deployment, run a test-account E2E at `https://mikuva.com` including signed notification reconciliation and return-URL non-mutation.

## Risks and Evidence Gates

| Risk | Mitigation / gate |
|---|---|
| Mixing Checkout Pro Orders with Preferences | Use Preferences plus payment resource only; this feature requires `init_point`. |
| TEST vs production URL behavior | Official current documentation directs integration testing to `init_point` and marks `sandbox_init_point` nonfunctional in the relevant Checkout Pro response. Use only validated `init_point` with both credential sets; test before production configuration. |
| Expired preference reuse | Reuse when local invariants prove it is safe; query remotely only for expiry, inconsistency, or uncertainty; trace replacements. |
| Duplicate/delayed Webhooks | Preserve event uniqueness, row locks, transaction, and monotonic transitions. |
| Forged/oversized Webhook | Preserve signature-first validation and 64 KiB limit. |
| Brick remnants | Remove package/imports/public key/CSP sources and assert their absence in the final scan. |
| MCP tooling | `mercadopago-mcp` initialization returned HTTP 401; [research.md](research.md) uses official Developers documentation only. |

## Complexity Tracking

No additional abstraction or constitution exception is needed.
