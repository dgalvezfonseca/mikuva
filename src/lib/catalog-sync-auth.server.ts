import "@tanstack/react-start/server-only";

import { timingSafeEqual } from "node:crypto";
import process from "node:process";

export function isAuthorizedCatalogSync(request: Request): boolean {
  const expected = process.env["DIRECTUS_CATALOG_SYNC_SECRET"]?.trim();
  const actual = request.headers.get("x-mikuva-catalog-sync-secret")?.trim();
  if (!expected || !actual) return false;
  const expectedBytes = Buffer.from(expected);
  const actualBytes = Buffer.from(actual);
  return expectedBytes.length === actualBytes.length && timingSafeEqual(expectedBytes, actualBytes);
}
