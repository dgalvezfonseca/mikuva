import "@tanstack/react-start/server-only";

import { createHash } from "node:crypto";
import process from "node:process";

import { and, eq, isNull } from "drizzle-orm";
import nodemailer, { type Transporter } from "nodemailer";

import { getDatabase, withDatabaseNamedLock } from "@/db/index.server";
import { customers, orderItems, orders, payments } from "@/db/schema";
import { SITE } from "@/constants/site";

const EMAIL_FROM = "Mikuva <no-reply@mikuva.com>";
const SMTP_TIMEOUT_MS = 8_000;

type PurchaseConfirmation = {
  id: number;
  folio: string;
  customerName: string;
  customerEmail: string;
  total: number;
  currency: string;
  items: Array<{
    name: string;
    variantName: string | null;
    unitPrice: number;
    quantity: number;
  }>;
};

type EmailDependencies = {
  withLock: (key: string, work: () => Promise<void>) => Promise<void>;
  load: (paymentId: string) => Promise<PurchaseConfirmation | null>;
  send: (message: ReturnType<typeof buildPurchaseConfirmationEmail>) => Promise<void>;
  markSent: (orderId: number) => Promise<void>;
};

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function smtpPort(): number {
  const value = Number(requiredEnvironment("SMTP_PORT"));
  if (!Number.isInteger(value) || value < 1 || value > 65_535) {
    throw new Error("SMTP_PORT must be a valid port.");
  }
  return value;
}

function smtpBoolean(name: "SMTP_SECURE" | "SMTP_IGNORE_TLS"): boolean {
  const value = requiredEnvironment(name).toLowerCase();
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${name} must be true or false.`);
}

export function getSmtpTransportOptions() {
  const host = requiredEnvironment("SMTP_HOST");
  const user = process.env["SMTP_USER"]?.trim();
  const password = process.env["SMTP_PASSWORD"]?.trim();
  if (Boolean(user) !== Boolean(password)) {
    throw new Error("SMTP_USER and SMTP_PASSWORD must be configured together.");
  }

  const from = requiredEnvironment("EMAIL_FROM");
  if (from !== EMAIL_FROM) throw new Error("EMAIL_FROM must be Mikuva <no-reply@mikuva.com>.");

  const ignoreTLS = smtpBoolean("SMTP_IGNORE_TLS");
  if (ignoreTLS && !["127.0.0.1", "localhost", "::1"].includes(host.toLowerCase())) {
    throw new Error("SMTP_IGNORE_TLS=true is only allowed for local SMTP hosts.");
  }

  return {
    host,
    port: smtpPort(),
    secure: smtpBoolean("SMTP_SECURE"),
    ignoreTLS,
    ...(user && password ? { auth: { user, pass: password } } : {}),
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  };
}

function getTransport(): Transporter {
  return nodemailer.createTransport(getSmtpTransportOptions());
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

function formatMxn(centavos: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centavos / 100);
}

function formatConfirmationDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(date);
}

export function buildPurchaseConfirmationEmail(order: PurchaseConfirmation, now = new Date()) {
  const date = formatConfirmationDate(now);
  const items = order.items.map((item) => ({
    ...item,
    label: [item.name, item.variantName].filter(Boolean).join(" — "),
    unitPrice: formatMxn(item.unitPrice),
  }));
  const itemText = items
    .map((item) => `- ${item.label} × ${item.quantity}: ${item.unitPrice}`)
    .join("\n");

  return {
    from: EMAIL_FROM,
    to: order.customerEmail,
    subject: `Confirmación de compra Mikuva — ${order.folio}`,
    text: [
      `Hola ${order.customerName},`,
      "",
      "Tu pago fue confirmado correctamente.",
      `Folio: ${order.folio}`,
      `Fecha: ${date}`,
      "Estado: Pago confirmado",
      "",
      "Productos comprados:",
      itemText,
      "",
      `Total: ${formatMxn(order.total)} MXN`,
      "Conserva este correo como comprobante de tu compra.",
      "",
      `Mikuva\n${SITE.phone}\n${SITE.address}`,
    ].join("\n"),
    html: `<main style="font-family:Arial,sans-serif;color:#1B1A18;line-height:1.5;max-width:640px;margin:0 auto;padding:24px"><h1 style="font-size:24px;margin:0 0 24px">Pago confirmado</h1><p>Hola ${escapeHtml(order.customerName)},</p><p>Tu pago fue confirmado correctamente.</p><table style="border-collapse:collapse;width:100%;margin:24px 0"><tbody><tr><td>Folio</td><td style="text-align:right"><strong>${escapeHtml(order.folio)}</strong></td></tr><tr><td>Fecha</td><td style="text-align:right">${escapeHtml(date)}</td></tr><tr><td>Estado</td><td style="text-align:right">Pago confirmado</td></tr></tbody></table><h2 style="font-size:18px">Productos comprados</h2><table style="border-collapse:collapse;width:100%"><thead><tr><th align="left">Producto</th><th align="right">Cantidad</th><th align="right">Precio unitario</th></tr></thead><tbody>${items.map((item) => `<tr><td>${escapeHtml(item.label)}</td><td align="right">${item.quantity}</td><td align="right">${escapeHtml(item.unitPrice)}</td></tr>`).join("")}</tbody></table><p style="font-size:18px"><strong>Total: ${escapeHtml(formatMxn(order.total))} MXN</strong></p><p>Conserva este correo como comprobante de tu compra.</p><hr style="border:0;border-top:1px solid #ddd;margin:24px 0"><p>Mikuva<br>${escapeHtml(SITE.phone)}<br>${escapeHtml(SITE.address)}</p></main>`,
  };
}

function emailLockKey(paymentId: string): string {
  return `mikuva:email:${createHash("sha256").update(paymentId).digest("hex").slice(0, 48)}`;
}

async function loadPurchaseConfirmation(paymentId: string): Promise<PurchaseConfirmation | null> {
  const db = getDatabase();
  const [order] = await db
    .select({
      id: orders.id,
      folio: orders.folio,
      total: orders.total,
      currency: orders.currency,
      confirmationEmailSentAt: orders.confirmationEmailSentAt,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
    })
    .from(payments)
    .innerJoin(orders, eq(orders.id, payments.orderId))
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(
      and(
        eq(payments.provider, "mercadopago"),
        eq(payments.providerPaymentId, paymentId),
        eq(payments.status, "approved"),
        eq(orders.paymentStatus, "approved"),
      ),
    )
    .limit(1);

  if (!order || order.confirmationEmailSentAt) return null;
  const items = await db
    .select({
      name: orderItems.productNameSnapshot,
      variantName: orderItems.variantNameSnapshot,
      unitPrice: orderItems.unitPrice,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return {
    id: order.id,
    folio: order.folio,
    customerName: [order.firstName, order.lastName].filter(Boolean).join(" "),
    customerEmail: order.email,
    total: order.total,
    currency: order.currency,
    items,
  };
}

async function markPurchaseConfirmationSent(orderId: number): Promise<void> {
  await getDatabase()
    .update(orders)
    .set({ confirmationEmailSentAt: new Date() })
    .where(and(eq(orders.id, orderId), isNull(orders.confirmationEmailSentAt)));
}

const productionDependencies: EmailDependencies = {
  withLock: (key, work) => withDatabaseNamedLock(key, work),
  load: loadPurchaseConfirmation,
  send: async (message) => {
    await getTransport().sendMail(message);
  },
  markSent: markPurchaseConfirmationSent,
};

export async function sendPurchaseConfirmationEmailForMercadoPagoPayment(
  paymentId: string,
  dependencies: EmailDependencies = productionDependencies,
): Promise<void> {
  if (!/^\d{1,160}$/.test(paymentId)) return;

  try {
    await dependencies.withLock(emailLockKey(paymentId), async () => {
      const order = await dependencies.load(paymentId);
      if (!order || order.currency !== "MXN") return;
      await dependencies.send(buildPurchaseConfirmationEmail(order));
      await dependencies.markSent(order.id);
    });
  } catch (error) {
    console.error("[purchase-confirmation-email] delivery failed", {
      paymentId,
      error: error instanceof Error ? error.name : "UnknownError",
    });
  }
}
