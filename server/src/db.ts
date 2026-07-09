import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
});

export default sql;
