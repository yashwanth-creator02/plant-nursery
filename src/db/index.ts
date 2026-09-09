import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to your .env.local (see .env.example)."
  );
}

// Supabase's pooled connection (pgbouncer) doesn't support prepared
// statements, so we disable them here.
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
