import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  buildCheckoutProPreference,
  getCheckoutProInitPoint,
  getValidatedAppOrigin,
} from "./mercadopago-preference-core";

describe("Checkout Pro preference", () => {
  const input = {
    items: [{ id: "1", title: "DigitalizaciÃ³n", quantity: 2, unitPrice: 125000 }],
    folio: "MK-2026-00001",
    origin: "https://mikuva.com",
  };

  test("uses only server snapshots and official callback values", () => {
    assert.deepEqual(buildCheckoutProPreference(input), {
      items: [
        { id: "1", title: "DigitalizaciÃ³n", quantity: 2, unit_price: 1250, currency_id: "MXN" },
      ],
      external_reference: "MK-2026-00001",
      back_urls: {
        success: "https://mikuva.com/pago/exitoso",
        pending: "https://mikuva.com/pago/pendiente",
        failure: "https://mikuva.com/pago/error",
      },
      auto_return: "approved",
    });
  });

  test("accepts only a valid official init_point", () => {
    assert.equal(
      getCheckoutProInitPoint({
        init_point: "https://www.mercadopago.com/mlm/checkout/start?pref_id=1",
      }),
      "https://www.mercadopago.com/mlm/checkout/start?pref_id=1",
    );
    assert.throws(() => getCheckoutProInitPoint({}));
    assert.throws(() => getCheckoutProInitPoint({ init_point: "https://example.test/checkout" }));
  });

  test("validates configured callback origins by Mercado Pago environment", () => {
    assert.equal(
      getValidatedAppOrigin("production", "https://mikuva.com/checkout"),
      "https://mikuva.com",
    );
    assert.equal(
      getValidatedAppOrigin("test", "https://checkout-test.example"),
      "https://checkout-test.example",
    );
    for (const value of [
      "http://mikuva.com",
      "https://localhost",
      "https://[::1]",
      "https://user:pass@mikuva.com",
    ]) {
      assert.throws(() => getValidatedAppOrigin("test", value));
    }
    assert.throws(() => getValidatedAppOrigin("production", "https://staging.example"));
  });
});
