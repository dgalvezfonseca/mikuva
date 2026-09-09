import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { withMySqlNamedLock, withPooledMySqlNamedLock } from "./mercadopago-preference-lock";

class FakeNamedLockServer {
  private locked = false;
  private waiters: Array<() => void> = [];

  connection() {
    return {
      execute: async (sql: string) => {
        if (sql.includes("GET_LOCK")) {
          if (this.locked) await new Promise<void>((resolve) => this.waiters.push(resolve));
          this.locked = true;
          return [[{ acquired: 1 }]];
        }
        this.locked = false;
        this.waiters.shift()?.();
        return [[{ released: 1 }]];
      },
      destroy: () => undefined,
    };
  }
}

type ReleaseOutcome = "confirmed" | "zero" | "null" | "malformed" | "throws";

class FakePoolConnection {
  releaseCalls = 0;
  destroyCalls = 0;

  constructor(private readonly releaseOutcome: ReleaseOutcome) {}

  async execute(sql: string): Promise<unknown> {
    if (sql.includes("GET_LOCK")) return [[{ acquired: 1 }]];
    switch (this.releaseOutcome) {
      case "confirmed":
        return [[{ released: 1 }]];
      case "zero":
        return [[{ released: 0 }]];
      case "null":
        return [[{ released: null }]];
      case "malformed":
        return [[{}]];
      case "throws":
        throw new Error("release transport failure");
    }
  }

  release() {
    this.releaseCalls += 1;
  }

  destroy() {
    this.destroyCalls += 1;
  }
}

describe("Mercado Pago preference named lock", () => {
  test("serializes concurrent creation and releases after success", async () => {
    const server = new FakeNamedLockServer();
    let active = 0;
    let peak = 0;
    let releaseFirst: (() => void) | undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const create = (
      connection: ReturnType<FakeNamedLockServer["connection"]>,
      wait?: Promise<void>,
    ) =>
      withMySqlNamedLock(connection, "mikuva:preference:42", 1, async () => {
        active += 1;
        peak = Math.max(peak, active);
        await wait;
        active -= 1;
      });

    const first = create(server.connection(), firstGate);
    await Promise.resolve();
    const second = create(server.connection());
    await Promise.resolve();
    assert.equal(peak, 1);
    releaseFirst?.();
    await Promise.all([first, second]);
    assert.equal(peak, 1);
  });

  test("releases after a provider error", async () => {
    const server = new FakeNamedLockServer();
    await assert.rejects(() =>
      withMySqlNamedLock(server.connection(), "mikuva:preference:43", 1, async () => {
        throw new Error("provider timeout");
      }),
    );
    await withMySqlNamedLock(server.connection(), "mikuva:preference:43", 1, async () => undefined);
  });

  test("returns a successful work result and releases a confirmed pool connection", async () => {
    const connection = new FakePoolConnection("confirmed");

    const result = await withPooledMySqlNamedLock(
      connection,
      "mikuva:preference:44",
      1,
      async () => "created",
    );

    assert.equal(result, "created");
    assert.equal(connection.releaseCalls, 1);
    assert.equal(connection.destroyCalls, 0);
  });

  test("preserves the work error and releases when cleanup is confirmed", async () => {
    const connection = new FakePoolConnection("confirmed");
    const workError = new Error("provider timeout");

    await assert.rejects(
      () =>
        withPooledMySqlNamedLock(connection, "mikuva:preference:45", 1, async () => {
          throw workError;
        }),
      (error) => error === workError,
    );
    assert.equal(connection.releaseCalls, 1);
    assert.equal(connection.destroyCalls, 0);
  });

  for (const outcome of ["zero", "null", "malformed", "throws"] as const) {
    test(`quarantines instead of pooling an unconfirmed RELEASE_LOCK (${outcome})`, async () => {
      const connection = new FakePoolConnection(outcome);

      await assert.rejects(() =>
        withPooledMySqlNamedLock(connection, "mikuva:preference:46", 1, async () => "created"),
      );
      assert.equal(connection.destroyCalls, 1);
      assert.equal(connection.releaseCalls, 0);
    });
  }

  test("keeps the work error primary when RELEASE_LOCK is unconfirmed", async () => {
    const connection = new FakePoolConnection("throws");
    const workError = new Error("provider timeout");

    await assert.rejects(
      () =>
        withPooledMySqlNamedLock(connection, "mikuva:preference:47", 1, async () => {
          throw workError;
        }),
      (error) => error === workError,
    );
    assert.equal(connection.destroyCalls, 1);
    assert.equal(connection.releaseCalls, 0);
  });
});
