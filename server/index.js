import { createStore } from "./db/index.js";
import { createApp } from "./app.js";
import { getJwtSecret } from "./utils/auth.js";
import { seedDemoUsers } from "./seedDemoUsers.js";
import { LISTINGS } from "../src/data/internships.js";

async function main() {
  // Validate required production configuration upfront
  getJwtSecret();

  const store = await createStore();
  await store.initSchema();
  await store.seedListings(LISTINGS);
  await seedDemoUsers(store);

  const app = createApp(store);
  const port = Number(process.env.PORT || 3001);

  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`Offerly server running on http://localhost:${port} (db: ${store.kind})`);
  });

  async function shutdown() {
    server.close(async () => {
      await store.close();
      process.exit(0);
    });
  }

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("Failed to start Offerly server:", err);
  process.exit(1);
});
