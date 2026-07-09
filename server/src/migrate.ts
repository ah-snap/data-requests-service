import { join } from "path";
import { readdirSync } from "fs";
import sql from "./db";

export async function runMigrations() {
  const migrationsDir = join(import.meta.dir, "..", "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const migration = await Bun.file(join(migrationsDir, file)).text();
    await sql.unsafe(migration);
    console.log(`Migration applied: ${file}`);
  }
}
