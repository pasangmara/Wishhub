import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { argusSql?: ReturnType<typeof postgres> };

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return postgres(url, {
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idle_timeout: 20,
    // Supabase/PgBouncer transaction pooling does not support prepared statements.
    prepare: process.env.DATABASE_PREPARE !== "false",
  });
}

const client = globalForDb.argusSql ?? createClient();
if (process.env.NODE_ENV !== "production") globalForDb.argusSql = client;

export const db = drizzle(client, { schema, casing: "snake_case" });
export { schema };
