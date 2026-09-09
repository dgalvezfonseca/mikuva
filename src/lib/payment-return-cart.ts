export function clearCartAfterConfirmedPayment(
  state: string,
  clear: () => void,
): void {
  if (state === "confirmed") clear();
}
