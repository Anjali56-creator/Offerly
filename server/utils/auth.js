import crypto from "node:crypto";
import jwt from "jsonwebtoken";

export const TOKEN_COOKIE = "offerly_token";
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable must be set in production");
  }
  return "offerly-local-dev-secret-change-me";
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function signAuthToken(userId) {
  return jwt.sign({ sub: userId }, getJwtSecret(), { expiresIn: TOKEN_TTL_SECONDS });
}

export function verifyAuthToken(token) {
  return jwt.verify(token, getJwtSecret());
}

export function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: TOKEN_TTL_SECONDS * 1000,
  });
}

export function clearAuthCookie(res) {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie(TOKEN_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
  });
}

export function hashResetCode(code) {
  return crypto.createHash("sha256").update(String(code).trim()).digest("hex");
}

export function generateResetCode() {
  return String(crypto.randomInt(100000, 1000000));
}

export function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 40 } = {}) {
  const hits = new Map();

  return function rateLimit(req, res, next) {
    if (process.env.NODE_ENV === "test") return next();

    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    const record = hits.get(key);

    if (!record || now > record.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= max) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    record.count += 1;
    return next();
  };
}
