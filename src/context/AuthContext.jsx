import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "../lib/api.js";

const AuthContext = createContext(null);

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiRequest("/api/auth/me")
      .then((data) => {
        if (!cancelled) setUser(data.user || null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function signup({ name, email, college, password }) {
    try {
      const data = await apiRequest("/api/auth/signup", {
        method: "POST",
        body: { name, email, college, password },
      });
      setUser(data.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function login(email, password) {
    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setUser(data.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function logout() {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }

  async function savePreferences(locations) {
    const data = await apiRequest("/api/auth/preferences", {
      method: "PUT",
      body: { locations },
    });
    setUser(data.user);
    return data.user;
  }

  async function requestResetCode(email) {
    try {
      const data = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      return { ok: true, emailSent: data.emailSent, code: data.devCode || "" };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function checkResetCode(email, code) {
    try {
      await apiRequest("/api/auth/verify-reset-code", {
        method: "POST",
        body: { email, code },
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function resetPassword(email, code, newPassword) {
    try {
      await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: { email, code, newPassword },
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        signup,
        login,
        logout,
        savePreferences,
        requestResetCode,
        checkResetCode,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
