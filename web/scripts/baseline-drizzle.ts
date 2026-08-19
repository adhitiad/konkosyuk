import * as dotenv from "dotenv";
import { readFileSync } from "node:fs";
import { Client } from "pg";

async function main() {
  if (process.env.BASELINE_DRIZZLE_CONFIRM !== "YES") {
    throw new Error(
      "Set BASELINE_DRIZZLE_CONFIRM=YES to confirm the existing database already matches the migrations",
    );
  }

  dotenv.config({ path: ".env.local" });
  const journal = JSON.parse(
    readFileSync("drizzle/meta/_journal.json", "utf8"),
  ) as {
    entries: Array<{ tag: string; when: number }>;
  };
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
  });
  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query("CREATE SCHEMA IF NOT EXISTS drizzle");
    await client.query(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    const { rows } = await client.query(
      "SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations",
    );
    if (rows[0].count > 0)
      throw new Error(
        "Drizzle migration history is not empty; aborting baseline",
      );

    for (const entry of journal.entries) {
      await client.query(
        "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)",
        [entry.tag, entry.when],
      );
    }
    await client.query("COMMIT");
    console.log(
      `Baselined ${journal.entries.length} Drizzle migration(s). No application data was deleted.`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    "Drizzle baseline failed:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
