import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { isAuthorizedCatalogSync } from "./catalog-sync-auth.server";

describe("Directus catalog synchronization authentication", () => {
  test("requires the server-only shared secret", () => {
    const previous = process.env["DIRECTUS_CATALOG_SYNC_SECRET"];
    process.env["DIRECTUS_CATALOG_SYNC_SECRET"] = "test-secret";
    try {
      assert.equal(isAuthorizedCatalogSync(new Request("https://mikuva.test")), false);
      assert.equal(
        isAuthorizedCatalogSync(
          new Request("https://mikuva.test", {
            headers: { "x-mikuva-catalog-sync-secret": "wrong" },
          }),
        ),
        false,
      );
      assert.equal(
        isAuthorizedCatalogSync(
          new Request("https://mikuva.test", {
            headers: { "x-mikuva-catalog-sync-secret": "test-secret" },
          }),
        ),
        true,
      );
    } finally {
      if (previous === undefined) delete process.env["DIRECTUS_CATALOG_SYNC_SECRET"];
      else process.env["DIRECTUS_CATALOG_SYNC_SECRET"] = previous;
    }
  });
});
