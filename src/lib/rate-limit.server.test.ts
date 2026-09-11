import assert from "node:assert/strict";
import { test } from "node:test";

// `bun:test` is available to Bun's test runner but is not part of this project's typecheck inputs.
// @ts-expect-error Bun test-only module
const { mock } = await import("bun:test");

let clientAddress = "127.0.0.1";
mock.module("@tanstack/react-start/server", () => ({
  getRequestHeader: () => clientAddress,
  getRequestIP: () => clientAddress,
  setResponseHeader: () => undefined,
  setResponseStatus: () => undefined,
}));

const { enforceRateLimit, MAX_BUCKETS, RateLimitExceededError } =
  await import("./rate-limit.server");

test("rate limiter never creates more than MAX_BUCKETS active buckets", () => {
  for (let index = 0; index < MAX_BUCKETS; index += 1) {
    clientAddress = `198.51.100.${index}`;
    enforceRateLimit("capacity", { limit: 1, windowMs: 60_000 });
  }

  clientAddress = "198.51.100.overflow";
  assert.throws(
    () => enforceRateLimit("capacity", { limit: 1, windowMs: 60_000 }),
    RateLimitExceededError,
  );
});
