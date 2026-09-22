import { Pool } from "pg";

const globalForPg = globalThis as unknown as { pgPool?: Pool };

export function db() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set.");
  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new Pool({
      connectionString,
      max: 10,
      connectionTimeoutMillis: 3000,
      query_timeout: 5000,
    });
  }
  return globalForPg.pgPool;
}
