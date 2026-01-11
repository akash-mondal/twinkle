/**
 * Database Client
 * Connects to the Ponder-managed database for read queries
 */

import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://twinkle:twinkle_dev_password@localhost:5432/twinkle";

export const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

/**
 * Health check for database
 */
export async function checkDatabase(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
