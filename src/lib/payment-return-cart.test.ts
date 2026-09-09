import assert from "node:assert/strict";
import { test } from "node:test";

import { clearCartAfterConfirmedPayment } from "./payment-return-cart";

test("clears the browser cart only after a confirmed payment return", () => {
  let items = ["cart-item"];
  const clear = () => {
    items = [];
  };

  clearCartAfterConfirmedPayment("confirmed", clear);
  assert.deepEqual(items, []);
});

for (const state of ["verifying", "processing", "error", "pending"]) {
  test(`does not clear the cart while payment return is ${state}`, () => {
    let items = ["cart-item"];
    clearCartAfterConfirmedPayment(state, () => {
      items = [];
    });
    assert.deepEqual(items, ["cart-item"]);
  });
}

test("refreshing a confirmed return is safe when the cart is already empty", () => {
  let items: string[] = [];
  const clear = () => {
    items = [];
  };

  clearCartAfterConfirmedPayment("confirmed", clear);
  clearCartAfterConfirmedPayment("confirmed", clear);
  assert.deepEqual(items, []);
});
