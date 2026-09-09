import "@tanstack/react-start/server-only";

import process from "node:process";

import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import { createPool, type Pool } from "mysql2/promise";

import * as schema from "./schema";
import { withPooledMySqlNamedLock } from "@/lib/mercadopago-preference-lock";

type MikuvaDatabase = MySql2Database<typeof schema>;

let pool: Pool | undefined;
let database: MikuvaDatabase | undefined;

export function getDatabase(): MikuvaDatabase {
  if (database) return database;

  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required on the server to access the database.");
  }

  const parsedUrl = new URL(databaseUrl);
  if (process.env["NODE_ENV"] === "production" && parsedUrl.username.toLowerCase() === "root") {
    throw new Error("The production database connection must not use the root account.");
  }

  pool = createPool({
    uri: databaseUrl,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60_000,
    queueLimit: 50,
    waitForConnections: true,
    connectTimeout: 5_000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  database = drizzle(pool, { schema, mode: "default" });
  return database;
}

export async function withDatabaseNamedLock<T>(key: string, work: () => Promise<T>): Promise<T> {
  getDatabase();
  if (!pool) throw new Error("Database pool is unavailable.");
  const connection = await pool.getConnection();
  return withPooledMySqlNamedLock(connection, key, 10, work);
}

export async function closeDatabase(): Promise<void> {
  await pool?.end();
  pool = undefined;
  database = undefined;
}
