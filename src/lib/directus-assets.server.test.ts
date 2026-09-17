import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import { getDirectusAsset } from "./directus-assets.server";

const ASSET_ID = "123e4567-e89b-42d3-a456-426614174000";
const originalFetch = globalThis.fetch;
const originalUrl = process.env["DIRECTUS_URL"];
const originalToken = process.env["DIRECTUS_TOKEN"];

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalUrl === undefined) delete process.env["DIRECTUS_URL"];
  else process.env["DIRECTUS_URL"] = originalUrl;
  if (originalToken === undefined) delete process.env["DIRECTUS_TOKEN"];
  else process.env["DIRECTUS_TOKEN"] = originalToken;
});

function configureDirectus() {
  process.env["DIRECTUS_URL"] = "http://directus.test";
  process.env["DIRECTUS_TOKEN"] = "test-token";
}

describe("Directus asset proxy", () => {
  test("returns asset bytes and only safe headers", async () => {
    configureDirectus();
    let authorization = "";
    globalThis.fetch = async (_input, init) => {
      authorization = new Headers(init?.headers).get("authorization") ?? "";
      return new Response(new Uint8Array([1, 2, 3]), {
        headers: {
          "Content-Type": "image/png",
          "Content-Length": "3",
          ETag: "asset-tag",
          "Set-Cookie": "upstream-secret",
        },
      });
    };

    const response = await getDirectusAsset(ASSET_ID, "GET");

    assert.equal(authorization, "Bearer test-token");
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [1, 2, 3]);
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.equal(response.headers.get("content-length"), "3");
    assert.equal(response.headers.get("etag"), "asset-tag");
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal(response.headers.get("authorization"), null);
    assert.equal(
      response.headers.get("cache-control"),
      "public, max-age=3600, stale-while-revalidate=86400",
    );
  });

  test("rejects invalid IDs and path traversal without an upstream request", async () => {
    configureDirectus();
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return new Response();
    };

    assert.equal((await getDirectusAsset("not-a-uuid", "GET")).status, 404);
    assert.equal((await getDirectusAsset("../" + ASSET_ID, "GET")).status, 404);
    assert.equal(calls, 0);
  });

  test("maps upstream not found and forbidden responses without exposing their bodies", async () => {
    configureDirectus();
    globalThis.fetch = async () => new Response("private Directus details", { status: 404 });
    assert.equal((await getDirectusAsset(ASSET_ID, "GET")).status, 404);

    globalThis.fetch = async () => new Response("token permission details", { status: 403 });
    const response = await getDirectusAsset(ASSET_ID, "GET");
    assert.equal(response.status, 404);
    assert.equal(await response.text(), "");
  });

  test("maps upstream failures to a safe gateway response", async () => {
    configureDirectus();
    globalThis.fetch = async () => new Response("internal error", { status: 500 });
    assert.equal((await getDirectusAsset(ASSET_ID, "GET")).status, 502);

    globalThis.fetch = async () => {
      throw new Error("network failure");
    };
    assert.equal((await getDirectusAsset(ASSET_ID, "GET")).status, 502);
  });

  test("forwards HEAD upstream without a response body", async () => {
    configureDirectus();
    let upstreamMethod = "";
    globalThis.fetch = async (_input, init) => {
      upstreamMethod = init?.method ?? "";
      return new Response(null, { headers: { "Content-Type": "image/png" } });
    };

    const response = await getDirectusAsset(ASSET_ID, "HEAD");

    assert.equal(upstreamMethod, "HEAD");
    assert.equal(response.status, 200);
    assert.equal(response.body, null);
    assert.equal(response.headers.get("content-type"), "image/png");
  });
});
