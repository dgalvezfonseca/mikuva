import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildPurchaseConfirmationEmail,
  getSmtpTransportOptions,
  sendPurchaseConfirmationEmailForMercadoPagoPayment,
} from "./purchase-confirmation-email.server";

const paymentId = "178164925862";
const order = {
  id: 29,
  folio: "MK-2026-00029",
  customerName: "Ana Pérez",
  customerEmail: "ana@example.com",
  total: 30000,
  currency: "MXN",
  items: [
    { name: "Digitalización de fotografías", variantName: null, unitPrice: 30000, quantity: 1 },
  ],
};

function confirmationDependencies(input: { status?: "approved" | "pending" | "rejected"; fail?: boolean } = {}) {
  let sent = false;
  let sends = 0;
  let fail = input.fail ?? false;
  const status = input.status ?? "approved";

  return {
    get sends() {
      return sends;
    },
    get sent() {
      return sent;
    },
    dependencies: {
      withLock: async (_key: string, work: () => Promise<void>) => work(),
      load: async () => (status === "approved" && !sent ? order : null),
      send: async () => {
        sends += 1;
        if (fail) throw new Error("SMTP unavailable");
      },
      markSent: async () => {
        sent = true;
      },
    },
    retrySucceeds: () => {
      fail = false;
    },
  };
}

function withSmtpEnvironment(
  values: Record<string, string | undefined>,
  work: () => void,
): void {
  const previous = Object.fromEntries(
    Object.keys(values).map((name) => [name, process.env[name]]),
  );
  try {
    for (const [name, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    work();
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

const localSmtpEnvironment = {
  SMTP_PORT: "25",
  SMTP_USER: "",
  SMTP_PASSWORD: "",
  SMTP_SECURE: "false",
  SMTP_IGNORE_TLS: "true",
  EMAIL_FROM: "Mikuva <no-reply@mikuva.com>",
};

test("allows STARTTLS to be skipped for localhost without SMTP credentials", () => {
  withSmtpEnvironment({ ...localSmtpEnvironment, SMTP_HOST: "localhost" }, () => {
    const options = getSmtpTransportOptions();
    assert.equal(options.ignoreTLS, true);
    assert.equal("auth" in options, false);
  });
});

test("allows STARTTLS to be skipped for 127.0.0.1", () => {
  withSmtpEnvironment({ ...localSmtpEnvironment, SMTP_HOST: "127.0.0.1" }, () => {
    assert.equal(getSmtpTransportOptions().ignoreTLS, true);
  });
});

test("rejects skipping STARTTLS for an external SMTP host", () => {
  withSmtpEnvironment({ ...localSmtpEnvironment, SMTP_HOST: "smtp.example.com" }, () => {
    assert.throws(() => getSmtpTransportOptions(), /only allowed for local SMTP hosts/);
  });
});

test("uses local order data and the required Mikuva sender", () => {
  const message = buildPurchaseConfirmationEmail(order, new Date("2026-09-09T12:00:00Z"));

  assert.equal(message.from, "Mikuva <no-reply@mikuva.com>");
  assert.equal(message.to, "ana@example.com");
  assert.match(message.subject, /MK-2026-00029/);
  assert.match(message.text, /Digitalización de fotografías/);
  assert.match(message.text, /Pago confirmado/);
  assert.match(message.html, /Ana Pérez/);
});

test("sends once when webhook and return reconcile the same approved payment", async () => {
  const state = confirmationDependencies();

  await sendPurchaseConfirmationEmailForMercadoPagoPayment(paymentId, state.dependencies);
  await sendPurchaseConfirmationEmailForMercadoPagoPayment(paymentId, state.dependencies);

  assert.equal(state.sends, 1);
  assert.equal(state.sent, true);
});

test("does not send pending or rejected payments", async () => {
  for (const status of ["pending", "rejected"] as const) {
    const state = confirmationDependencies({ status });
    await sendPurchaseConfirmationEmailForMercadoPagoPayment(paymentId, state.dependencies);
    assert.equal(state.sends, 0);
  }
});

test("keeps a paid order eligible for retry after an SMTP failure", async () => {
  const state = confirmationDependencies({ fail: true });

  await sendPurchaseConfirmationEmailForMercadoPagoPayment(paymentId, state.dependencies);
  assert.equal(state.sent, false);
  state.retrySucceeds();
  await sendPurchaseConfirmationEmailForMercadoPagoPayment(paymentId, state.dependencies);

  assert.equal(state.sends, 2);
  assert.equal(state.sent, true);
});
