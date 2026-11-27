import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultSqlitePath = path.resolve(__dirname, "../../data/offerly-dev.db");

export async function createStore() {
  if (process.env.DATABASE_URL) {
    const { createPostgresStore } = await import("./postgres.js");
    return createPostgresStore(process.env.DATABASE_URL);
  }
  const { createSqliteStore } = await import("./sqlite.js");
  const dbPath = process.env.SQLITE_PATH || defaultSqlitePath;
  return createSqliteStore(dbPath);
}
