import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createRequireAuth } from "./middleware/requireAuth.js";
import { requireAdmin } from "./middleware/requireAdmin.js";
import { createAuthRouter } from "./routes/auth.js";
import { createListingsRouter } from "./routes/listings.js";
import { createInternshipsRouter } from "./routes/internships.js";
import { createAdminRouter } from "./routes/admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");

export function createApp(store) {
  const app = express();
  const requireAuth = createRequireAuth(store);

  // Render runs behind a reverse proxy terminating TLS
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  if (process.env.CLIENT_ORIGIN) {
    app.use(
      cors({
        origin: process.env.CLIENT_ORIGIN,
        credentials: true,
      })
    );
  }

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/api/health", async (req, res) => {
    try {
      await store.ping();
      return res.json({ ok: true, db: store.kind });
    } catch (err) {
      return res.status(503).json({ ok: false, error: "Database unavailable" });
    }
  });

  app.use("/api/auth", createAuthRouter(store, requireAuth));
  app.use("/api/listings", createListingsRouter(store, requireAuth));
  app.use("/api/internships", createInternshipsRouter(store, requireAuth));
  app.use("/api/admin", createAdminRouter(store, requireAuth, requireAdmin));

  // Unknown API endpoints return JSON 404 rather than SPA HTML
  app.use("/api", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  if (process.env.SERVE_STATIC !== "false" && fs.existsSync(path.join(distDir, "index.html"))) {
    app.use(express.static(distDir));
    app.use((req, res, next) => {
      if (req.method === "GET" || req.method === "HEAD") {
        return res.sendFile(path.join(distDir, "index.html"));
      }
      return next();
    });
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error("[Offerly API error]", err);
    res.status(500).json({ error: "Something went wrong on the server" });
  });

  return app;
}
