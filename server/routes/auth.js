import express from "express";
import bcrypt from "bcryptjs";
import {
  clearAuthCookie,
  createRateLimiter,
  generateResetCode,
  hashResetCode,
  isValidEmail,
  normalizeEmail,
  setAuthCookie,
  signAuthToken,
} from "../utils/auth.js";
import { sendResetCodeEmail } from "../utils/mailer.js";

const BCRYPT_ROUNDS = 10;
const RESET_TTL_MS = 10 * 60 * 1000;

export function createAuthRouter(store, requireAuth) {
  const router = express.Router();
  const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 50 });

  router.post("/signup", authLimiter, async (req, res, next) => {
    try {
      const name = String(req.body?.name || "").trim();
      const email = normalizeEmail(req.body?.email);
      const college = String(req.body?.college || "").trim();
      const password = String(req.body?.password || "");

      if (!name) return res.status(400).json({ error: "Full name is required" });
      if (!email || !isValidEmail(email)) {
        return res.status(400).json({ error: "Enter a valid email address" });
      }
      if (!college) return res.status(400).json({ error: "College name is required" });
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const existing = await store.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const user = await store.createUser({ name, email, college, passwordHash });
      const token = signAuthToken(user.id);
      setAuthCookie(res, token);

      return res.status(201).json({ user });
    } catch (err) {
      return next(err);
    }
  });

  router.post("/login", authLimiter, async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body?.email);
      const password = String(req.body?.password || "");

      if (!email || !isValidEmail(email) || !password) {
        return res.status(400).json({ error: "Valid email and password are required" });
      }

      const row = await store.getUserByEmail(email);
      if (!row) {
        return res.status(401).json({ error: "Wrong email or password" });
      }

      const matches = await bcrypt.compare(password, row.password_hash);
      if (!matches) {
        return res.status(401).json({ error: "Wrong email or password" });
      }

      const user = await store.getUserById(row.id);
      const token = signAuthToken(user.id);
      setAuthCookie(res, token);

      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  });

  router.post("/logout", (req, res) => {
    clearAuthCookie(res);
    return res.json({ ok: true });
  });

  router.get("/me", requireAuth, (req, res) => {
    return res.json({ user: req.user });
  });

  router.put("/preferences", requireAuth, async (req, res, next) => {
    try {
      const { locations } = req.body || {};
      if (!Array.isArray(locations) || locations.length === 0) {
        return res.status(400).json({ error: "Please pick at least one place" });
      }
      const cleaned = locations.map((loc) => String(loc).trim()).filter(Boolean);
      if (cleaned.length === 0) {
        return res.status(400).json({ error: "Please pick at least one place" });
      }

      const user = await store.updateUserPreferences(req.user.id, cleaned);
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  });

  router.post("/forgot-password", authLimiter, async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body?.email);
      if (!email) return res.status(400).json({ error: "Email is required" });
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Enter a valid email address" });
      }

      const user = await store.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "No account found with this email" });
      }

      const code = generateResetCode();
      const codeHash = hashResetCode(code);
      const expiresAt = new Date(Date.now() + RESET_TTL_MS).toISOString();

      await store.createPasswordReset(email, codeHash, expiresAt);
      const delivery = await sendResetCodeEmail({ to: email, code });

      return res.json({
        ok: true,
        emailSent: delivery.emailSent,
        ...(delivery.devCode ? { devCode: delivery.devCode } : {}),
      });
    } catch (err) {
      return next(err);
    }
  });

  async function validateResetCode(email, code) {
    const saved = await store.getLatestPasswordReset(email);
    if (!saved) {
      return { ok: false, status: 400, error: "Wrong code. Please try again" };
    }
    if (Date.now() > new Date(saved.expires_at).getTime()) {
      return { ok: false, status: 400, error: "This code has expired. Please resend a new code" };
    }
    if (saved.code_hash !== hashResetCode(code)) {
      return { ok: false, status: 400, error: "Wrong code. Please try again" };
    }
    return { ok: true };
  }

  router.post("/verify-reset-code", authLimiter, async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body?.email);
      const code = String(req.body?.code || "").trim();
      if (!code) return res.status(400).json({ error: "Please enter the 6-digit code" });

      const check = await validateResetCode(email, code);
      if (!check.ok) {
        return res.status(check.status).json({ error: check.error });
      }

      return res.json({ ok: true });
    } catch (err) {
      return next(err);
    }
  });

  router.post("/reset-password", authLimiter, async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body?.email);
      const code = String(req.body?.code || "").trim();
      const newPassword = String(req.body?.newPassword || "");

      if (!newPassword) return res.status(400).json({ error: "New password is required" });
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const check = await validateResetCode(email, code);
      if (!check.ok) {
        return res.status(check.status).json({ error: check.error });
      }

      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      await store.updateUserPassword(email, passwordHash);
      await store.deletePasswordResets(email);

      return res.json({ ok: true });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}
