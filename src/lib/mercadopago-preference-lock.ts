export type NamedLockConnection = {
  execute(sql: string, values?: Array<string | number>): Promise<unknown>;
  destroy: () => void;
};

export type PooledNamedLockConnection = NamedLockConnection & {
  release: () => void;
};

function lockValue(result: unknown, field: "acquired" | "released"): number {
  if (!Array.isArray(result) || !Array.isArray(result[0]) || result[0].length !== 1) return 0;
  const row = result[0][0];
  return typeof row === "object" && row !== null && field in row
    ? Number((row as Record<string, unknown>)[field])
    : 0;
}

function quarantineConnection(connection: NamedLockConnection): void {
  try {
    connection.destroy();
  } catch {
    // The pool lease is already marked unusable before this call; never reuse it.
  }
}

export async function withMySqlNamedLock<T>(
  connection: NamedLockConnection,
  key: string,
  timeoutSeconds: number,
  work: () => Promise<T>,
): Promise<T> {
  const acquired = await connection.execute("SELECT GET_LOCK(?, ?) AS acquired", [
    key,
    timeoutSeconds,
  ]);
  if (lockValue(acquired, "acquired") !== 1) throw new Error("Checkout Pro preference is busy.");

  let result: T | undefined;
  let workError: unknown;
  try {
    result = await work();
  } catch (error) {
    workError = error;
  }

  let releaseError: unknown;
  try {
    const released = await connection.execute("SELECT RELEASE_LOCK(?) AS released", [key]);
    if (lockValue(released, "released") !== 1) {
      quarantineConnection(connection);
      releaseError = new Error("Checkout Pro preference lock was lost.");
    }
  } catch (error) {
    quarantineConnection(connection);
    releaseError = error;
  }

  if (workError) throw workError;
  if (releaseError) throw releaseError;
  return result as T;
}

export async function withPooledMySqlNamedLock<T>(
  connection: PooledNamedLockConnection,
  key: string,
  timeoutSeconds: number,
  work: () => Promise<T>,
): Promise<T> {
  let reusable = true;
  const lockConnection: NamedLockConnection = {
    execute: connection.execute.bind(connection),
    destroy: () => {
      reusable = false;
      connection.destroy();
    },
  };

  try {
    return await withMySqlNamedLock(lockConnection, key, timeoutSeconds, work);
  } finally {
    if (reusable) connection.release();
  }
}
