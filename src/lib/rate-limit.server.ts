import "@tanstack/react-start/server-only";

import { createHash, randomBytes } from "node:crypto";
import process from "node:process";

import {
  getRequestHeader,
  getRequestIP,
  setResponseHeader,
  setResponseStatus,
} from "@tanstack/react-start/server";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

export const MAX_BUCKETS = 10_000;
const buckets = new Map<string, Bucket>();
const processSalt = randomBytes(32);

export class RateLimitExceededError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("Rate limit exceeded.");
    this.name = "RateLimitExceededError";
  }
}

function getClientAddress(): string {
  if (process.env["TRUST_PROXY"] === "true") {
    // Apache appends its direct peer to X-Forwarded-For. The right-most value
    // avoids trusting an arbitrary left-most value supplied by the client.
    const forwarded = getRequestHeader("x-forwarded-for")
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .at(-1);
    if (forwarded) return forwarded;
  }

  return getRequestIP() ?? "unknown";
}

function hashedKey(scope: string): string {
  return createHash("sha256")
    .update(processSalt)
    .update("\0")
    .update(scope)
    .update("\0")
    .update(getClientAddress())
    .digest("hex");
}

function removeExpiredBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function rejectAtCapacity(now: number): never {
  const nextResetAt = Math.min(...[...buckets.values()].map((bucket) => bucket.resetAt));
  const retryAfterSeconds = Math.max(1, Math.ceil((nextResetAt - now) / 1_000));
  setResponseStatus(429);
  setResponseHeader("Retry-After", String(retryAfterSeconds));
  throw new RateLimitExceededError(retryAfterSeconds);
}

export function enforceRateLimit(scope: string, options: RateLimitOptions): void {
  const now = Date.now();
  const key = hashedKey(scope);
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) removeExpiredBuckets(now);
    if (buckets.size >= MAX_BUCKETS) rejectAtCapacity(now);
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return;
  }

  current.count += 1;
  if (current.count <= options.limit) return;

  const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1_000));
  setResponseStatus(429);
  setResponseHeader("Retry-After", String(retryAfterSeconds));
  throw new RateLimitExceededError(retryAfterSeconds);
}
