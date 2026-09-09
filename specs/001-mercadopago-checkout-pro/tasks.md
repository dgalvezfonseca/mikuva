---

description: "Implementation tasks for Mercado Pago Checkout Pro"
---

# Tasks: Mercado Pago Checkout Pro

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, and `quickstart.md`

**Prerequisites**: Preserve the existing TanStack Start, React 19, TypeScript, Vite, Tailwind v4, shadcn/ui, Bun, Drizzle, MySQL/MariaDB, and Nitro architecture. No migration is required; do not execute `0003`, `db:migrate`, an `ALTER`, or modify `mikuva_runtime`.

**Tests**: Required. Add focused deterministic tests first and record valid RED evidence before changing production code. Use `bun test`; do not use a real Mercado Pago account, credentials, payment, deployment, or E2E during implementation.

**Execution status (2026-09-08)**: T001-T028 completed; T029 remains intentionally pending as the separately authorized post-deploy E2E gate.

## Phase 1: Setup and boundaries

**Purpose**: Confirm the existing payment surface and establish the implementation boundaries without changing database or production state.

- [ ] T001 Inventory the current Checkout Pro, Brick, Stripe, environment, CSP, schema, migration, and test references in `src/`, `package.json`, `bun.lock`, `README.md`, and `drizzle/` without executing migrations or modifying historical migration files
- [ ] T002 Confirm the `mercadopago` SDK and official Preferences contract in `specs/001-mercadopago-checkout-pro/research.md`; keep `init_point` as the only redirect field and do not add an `init_point`/`sandbox_init_point` branch

---

## Phase 2: Foundational RED tests

**Purpose**: Establish regression guarantees before changing checkout, preference, Webhook, or Brick runtime code.

- [ ] T003 [P] Add RED tests for server-derived Preference items, MXN, `external_reference`, `back_urls`, `auto_return`, `notification_url`, persisted local reuse, expiry/uncertainty lookup decisions, and valid/missing/invalid `init_point` in `src/lib/mercadopago-preference-core.test.ts`
- [ ] T004 [P] Extend RED transition and validation tests for approved-only confirmation, amount/currency/reference mismatches, already-paid orders, duplicate events, and out-of-order events in `src/lib/mercadopago-webhook-core.test.ts`
- [ ] T005 [P] Extend RED handler tests for signature authentication, matching payment ID, authoritative payment lookup, bounded body, required-versus-additional validation behavior, and idempotent event persistence in `src/lib/mercadopago-webhook.test.ts`
- [ ] T006 [P] Add RED runtime-boundary tests that assert no Payment Brick, Checkout Bricks, Mercado Pago React SDK, Stripe runtime, browser public key, or embedded-card path remains in `src/lib/checkout-runtime.test.ts`
- [ ] T007 Run the focused RED targets from `src/lib/mercadopago-preference-core.test.ts`, `src/lib/mercadopago-webhook-core.test.ts`, `src/lib/mercadopago-webhook.test.ts`, and `src/lib/checkout-runtime.test.ts`; stop if a failure is unrelated to the specified missing behavior

---

## Phase 3: User Story 1 - Pagar mediante Checkout Pro (Priority: P1) 🎯 MVP

**Goal**: A buyer can create/reuse one server-authoritative pending order and redirect only to official hosted Checkout Pro without an embedded card form.

**Independent Test**: A valid checkout creates/reuses the same locally safe pending preference, returns only a validated `init_point`, and rejects invalid input or invalid URLs without a payment attempt.

- [ ] T008 [US1] Replace Brick request construction with a focused Checkout Pro preference builder and `init_point` validator in `src/lib/mercadopago-preference-core.ts` so tests T003 can turn GREEN
- [ ] T009 [US1] Remove Brick-only schemas/types while preserving checkout intent validation in `src/lib/checkout-input.ts`
- [ ] T010 [US1] Adapt preference creation/reuse in `src/lib/mercadopago.server.ts` to use authoritative snapshots, `external_reference`, `back_urls`, `auto_return`, `notification_url`, local reuse invariants, remote lookup only for expiry/inconsistency/uncertainty, and `init_point` only
- [ ] T011 [US1] Remove Brick server functions and retain the rate-limited hosted-checkout server function in `src/lib/checkout.ts`
- [ ] T012 [US1] Replace embedded Brick state/UI with the single hosted Checkout Pro redirect in `src/routes/checkout.tsx`; before changing user-facing copy, follow `DESIGN.md` and `.agents/skills/frontend-design/SKILL.md`
- [ ] T013 [US1] Run the focused GREEN preference and checkout-boundary tests in `src/lib/mercadopago-preference-core.test.ts` and `src/lib/checkout-runtime.test.ts`

---

## Phase 4: User Story 2 - Confirmar pagos verificados (Priority: P1)

**Goal**: Only an authenticated, authoritative approved payment updates the matching local order once.

**Independent Test**: Valid, duplicate, delayed, mismatched, and already-paid payment notifications produce the expected monotonic local state and `payment_events` record without real provider calls.

- [ ] T014 [US2] Refine pure status and local-match rules in `src/lib/mercadopago-webhook-core.ts`: require approved status, payment ID, reference, exact amount, MXN, and order relationship; preserve safe handling of already-paid and out-of-order events
- [ ] T015 [US2] Adapt signed Webhook handling and transactional reconciliation in `src/lib/mercadopago-webhook.server.ts`; retain signature-first validation, 64 KiB body limit, server-side lookup, locks, transactions, event deduplication, monotonic transitions, safe logs, and server-only secrets
- [ ] T016 [US2] Make collector/account, preference ID, and environment correlation non-blocking unless the official Checkout Pro resource guarantees a present reliable value in `src/lib/mercadopago-webhook.server.ts`
- [ ] T017 [US2] Run the focused GREEN Webhook suites in `src/lib/mercadopago-webhook-core.test.ts` and `src/lib/mercadopago-webhook.test.ts`

---

## Phase 5: User Story 3 - Entender el resultado sin confirmar indebidamente (Priority: P2)

**Goal**: Return pages explain success, pending, or failure without changing any payment state.

**Independent Test**: Direct visits with arbitrary query parameters leave every order/payment unchanged and show only informational content.

- [ ] T018 [US3] Add/extend non-mutation coverage for success, pending, and failure return routes in `src/routes/pago.exitoso.tsx`, `src/routes/pago.pendiente.tsx`, `src/routes/pago.error.tsx`, and `src/components/payments/PaymentReturnPage.tsx`
- [ ] T019 [US3] Preserve display-only return pages and remove any accidental payment mutation path in `src/routes/pago.exitoso.tsx`, `src/routes/pago.pendiente.tsx`, and `src/routes/pago.error.tsx`

---

## Phase 6: User Story 4 - Operar con un único proveedor activo (Priority: P2)

**Goal**: Mercado Pago Checkout Pro is the only active payment experience; no Stripe or Brick runtime path remains.

**Independent Test**: The checkout surface, dependencies, CSP, configuration, and user-facing legal copy contain no active Stripe/Brick/embedded-card flow.

- [ ] T020 [US4] Remove `@mercadopago/sdk-react` and its lockfile entry from `package.json` and `bun.lock` without adding dependencies
- [ ] T021 [US4] Delete Brick-only implementation and tests in `src/lib/mercadopago-payment-core.ts` and `src/lib/mercadopago-payment-core.test.ts`
- [ ] T022 [US4] Remove `MERCADOPAGO_PUBLIC_KEY` and Brick-only configuration guidance while retaining server-only configuration in `README.md`
- [ ] T023 [US4] Remove Brick-only Mercado Pago SDK, secure-fields, and frame sources while preserving only demonstrably needed hosted-checkout policy in `src/lib/security-headers.ts`
- [ ] T024 [US4] Update Checkout Bricks wording to hosted Checkout Pro without altering payment behavior in `src/routes/aviso-de-privacidad.tsx` and `src/routes/terminos-y-condiciones.tsx`; before copy edits, follow `DESIGN.md` and `.agents/skills/frontend-design/SKILL.md`
- [ ] T025 [US4] Run the GREEN runtime-absence tests in `src/lib/checkout-runtime.test.ts` and remove obsolete Brick imports/references from `src/routes/checkout.tsx`, `src/lib/checkout.ts`, and `src/lib/mercadopago.server.ts`

---

## Phase 7: Polish and cross-cutting validation

**Purpose**: Confirm the completed implementation preserves security boundaries and leaves no forbidden runtime remnants.

- [ ] T026 Verify no migration-related file changes exist in `drizzle/`, and confirm `mikuva_runtime` is untouched
- [ ] T027 Run `bun run typecheck`, `bun run lint`, `bun test`, `bun run build`, and `git diff --check` from the repository root for the changes under `src/`
- [ ] T028 Run redacted source scans for Stripe/Brick runtime remnants and secrets across `src/`, `package.json`, `bun.lock`, and `README.md`; fix confirmed findings without printing secret values
- [ ] T029 Retain the separate, unexecuted production E2E gate at `https://mikuva.com` in `specs/001-mercadopago-checkout-pro/quickstart.md`; do not deploy, configure credentials, make a payment, commit, or push

## Dependencies and execution order

- Phase 1 precedes all implementation.
- Phase 2 tests must reach valid RED before T008–T012, T014–T016, or T020–T024 change production code.
- US1 (Phase 3) and US2 (Phase 4) are P1; complete US1's redirect contract before relying on preference/order linkage in Webhook integration.
- US3 can proceed after Phase 2, but validate it after the P1 payment flow is stable.
- US4 may proceed after Phase 2; T020–T025 must complete before final validation.
- Phase 7 follows all selected stories. T029 is a post-authorization gate only, never an implementation action.

## Parallel opportunities

- T003–T006 can be authored in parallel because they target distinct test files.
- After RED evidence, T009 and T014 can proceed in parallel; both complete before their corresponding server handlers.
- T020, T022, T023, and T024 can proceed in parallel after T012 because they own distinct files.
- Do not run T010, T015, or T016 in parallel: they share server-side payment modules and transaction semantics.

## Implementation strategy

1. Establish all RED tests and preserve the no-migration boundary.
2. Deliver the hosted redirect (US1), then verified reconciliation (US2).
3. Confirm non-mutating returns (US3) and remove the obsolete runtime (US4).
4. Run only automated/local checks. The real E2E at `https://mikuva.com` remains separately authorized and out of scope.

## Phase 8: Convergence

- [X] T030 CRITICAL Evaluate and implement local serialization of Checkout Pro create/reuse by order ID or folio, preferring a safely supported MySQL advisory/named lock; recheck local state inside the critical section, permit at most one active remote preference creation per order, release the lock on success, error, and timeout, and add deterministic concurrency tests without a migration. Do not rely on `Preference.create` `requestOptions.idempotencyKey` for idempotency: the current official Preferences create reference documents `Authorization` but no Preferences-specific idempotency header. Decide whether to remove it or retain it only as a non-authoritative header and document that decision. If proposing `SELECT ... FOR UPDATE` across remote I/O instead, justify the transaction/lock duration before implementation per FR-003 and SC-002 (contradicts)
- [X] T031 Validate and test the server-side `APP_URL` before deriving Checkout Pro `back_urls` and `notification_url`: with `MERCADOPAGO_ENV=production`, require exactly origin `https://mikuva.com`; with `MERCADOPAGO_ENV=test`, permit only an explicitly configured valid HTTPS origin and reject HTTP, localhost, embedded credentials, and invalid origins per FR-012 and `contracts/checkout-pro.md` (partial)
- [X] T032 Correct Mercado Pago configuration documentation and tests to distinguish mandatory approval checks from non-blocking optional collector, environment, and preference correlation per plan webhook decision (partial)

## Phase 9: Convergence

- [X] T033 Harden Checkout Pro named-lock release failure handling: when `RELEASE_LOCK` throws or does not positively return `1`, destroy/quarantine the same mysql2 connection instead of returning it to the pool; preserve the primary work error, add deterministic success/error/non-successful-release tests, and keep the no-transaction-during-provider-HTTP design per T030, FR-003, and SC-002 (partial)

## Phase 10: Convergence

- [X] T034 Reject Checkout Pro preference create/reuse for a local order whose payment status is not `pending`; retain the named-lock re-check and add deterministic regression coverage proving a reused checkout request cannot redirect an approved, rejected, cancelled, or refunded order to a preference per FR-003 and plan preference-reuse invariant (partial)
