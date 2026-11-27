import { TOKEN_COOKIE, clearAuthCookie, verifyAuthToken } from "../utils/auth.js";

export function createRequireAuth(store) {
  return async function requireAuth(req, res, next) {
    try {
      const token = req.cookies?.[TOKEN_COOKIE];
      if (!token) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const payload = verifyAuthToken(token);
      const user = await store.getUserById(payload.sub);
      if (!user) {
        clearAuthCookie(res);
        return res.status(401).json({ error: "Session expired" });
      }

      req.user = user;
      return next();
    } catch {
      clearAuthCookie(res);
      return res.status(401).json({ error: "Invalid or expired session" });
    }
  };
}
