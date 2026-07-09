import { join } from "path";
import sql from "./db";

export async function runMigrations() {
  const migrationPath = join(import.meta.dir, "..", "migrations", "001_initial.sql");
  const migration = await Bun.file(migrationPath).text();
  await sql.unsafe(migration);
  console.log("Migrations applied");
}
