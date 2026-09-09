type CheckoutProItem = {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number;
};

type CheckoutProPreferenceInput = {
  items: CheckoutProItem[];
  folio: string;
  origin: string;
  webhookUrl: string;
};

export type MercadoPagoEnvironment = "test" | "production";

function trustedHttpsUrl(value: string, label: string): URL {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error(`${label} must be an HTTPS URL without credentials.`);
  }
  return url;
}

export function getValidatedAppOrigin(environment: MercadoPagoEnvironment, value: string): string {
  const url = trustedHttpsUrl(value, "APP_URL");
  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  ) {
    throw new Error("APP_URL cannot use localhost.");
  }
  if (environment === "production" && url.origin !== "https://mikuva.com") {
    throw new Error("Production APP_URL must resolve to https://mikuva.com.");
  }
  return url.origin;
}

export function buildCheckoutProPreference(input: CheckoutProPreferenceInput) {
  if (!/^MK-\d{4}-\d{5}$/.test(input.folio) || input.items.length === 0) {
    throw new Error("Checkout Pro preference data is invalid.");
  }
  const origin = trustedHttpsUrl(input.origin, "APP_URL").origin;
  const webhookUrl = trustedHttpsUrl(input.webhookUrl, "Webhook URL");
  if (webhookUrl.origin !== origin) throw new Error("Webhook URL must use APP_URL.");

  return {
    items: input.items.map((item) => {
      if (
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isInteger(item.unitPrice) ||
        item.unitPrice <= 0
      ) {
        throw new Error("Checkout Pro item data is invalid.");
      }
      return {
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unitPrice / 100,
        currency_id: "MXN" as const,
      };
    }),
    external_reference: input.folio,
    back_urls: {
      success: `${origin}/pago/exitoso`,
      pending: `${origin}/pago/pendiente`,
      failure: `${origin}/pago/error`,
    },
    auto_return: "approved" as const,
    notification_url: webhookUrl.toString(),
  };
}

export function getCheckoutProInitPoint(response: { init_point?: string }): string {
  if (!response.init_point) throw new Error("Mercado Pago did not return a Checkout Pro URL.");
  const url = trustedHttpsUrl(response.init_point, "Mercado Pago Checkout Pro URL");
  const hostname = url.hostname.toLowerCase();
  if (!(
    hostname === "mercadopago.com" ||
    hostname.endsWith(".mercadopago.com") ||
    hostname === "mercadopago.com.mx" ||
    hostname.endsWith(".mercadopago.com.mx")
  )) {
    throw new Error("Mercado Pago returned an unexpected Checkout Pro URL.");
  }
  return url.toString();
}
