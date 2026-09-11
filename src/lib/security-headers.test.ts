import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import { PRODUCTION_CSP, withSecurityHeaders } from "./security-headers";

const originalNodeEnv = process.env["NODE_ENV"];

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env["NODE_ENV"];
  else process.env["NODE_ENV"] = originalNodeEnv;
});

describe("security headers", () => {
  test("adds baseline headers and prevents API caching", () => {
    process.env["NODE_ENV"] = "development";
    const response = withSecurityHeaders(
      new Request("http://localhost/api/health"),
      Response.json({ ok: true }),
    );

    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("x-frame-options"), "DENY");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("content-security-policy"), null);
  });

  test("prevents shared caches from storing transactional payment pages", () => {
    process.env["NODE_ENV"] = "development";

    for (const pathname of ["/checkout", "/pago/exitoso", "/pago/pendiente", "/pago/error"]) {
      const response = withSecurityHeaders(new Request(`http://localhost${pathname}`), new Response("ok"));
      assert.equal(response.headers.get("cache-control"), "no-store");
    }
  });

  test("adds the production CSP and HSTS", () => {
    process.env["NODE_ENV"] = "production";
    const response = withSecurityHeaders(
      new Request("https://mikuva.example/"),
      new Response("ok"),
    );

    assert.equal(response.headers.get("content-security-policy"), PRODUCTION_CSP);
    assert.match(response.headers.get("strict-transport-security") ?? "", /max-age=31536000/);
    assert.doesNotMatch(PRODUCTION_CSP, /script-src \*/);
    assert.match(PRODUCTION_CSP, /frame-ancestors 'none'/);
  });
});
