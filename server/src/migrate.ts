import { join } from "path";
import { readdirSync } from "fs";
import sql from "./db";

export async function runMigrations() {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT        PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const migrationsDir = join(import.meta.dir, "..", "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = await sql<{ filename: string }[]>`
    SELECT filename FROM schema_migrations
  `;
  const appliedSet = new Set(applied.map((r) => r.filename));

  for (const file of files) {
    if (appliedSet.has(file)) {
      continue;
    }
    const migration = await Bun.file(join(migrationsDir, file)).text();
    await sql.unsafe(migration);
    await sql`INSERT INTO schema_migrations (filename) VALUES (${file})`;
    console.log(`Migration applied: ${file}`);
  }
}
