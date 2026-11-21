// NOTE: This is a frontend-only demo login. Users and passwords are stored in
// plain text in localStorage, which is NOT safe. Real apps must use a backend
// (e.g. Firebase Auth or Node + JWT) and store hashed passwords.

import { createContext, useContext, useState } from "react";
import { readJSON, writeJSON, removeKey } from "../utils/storage.js";

const USERS_KEY = "offerly-users";
const SESSION_KEY = "offerly-session";
const RESET_KEY = "offerly-reset";

const AuthContext = createContext(null);

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readJSON(SESSION_KEY, null));

  function startSession(person) {
    // the password is not kept in the session
    const sessionUser = { name: person.name, email: person.email, college: person.college };
    writeJSON(SESSION_KEY, sessionUser);
    setUser(sessionUser);
  }

  function signup({ name, email, college, password }) {
    const users = readJSON(USERS_KEY, []);
    const cleanEmail = email.trim().toLowerCase();

    if (users.some((u) => u.email === cleanEmail)) {
      return { ok: false, error: "Email already registered" };
    }

    const newUser = {
      name: name.trim(),
      email: cleanEmail,
      college: college.trim(),
      password,
    };
    writeJSON(USERS_KEY, [...users, newUser]);
    startSession(newUser);
    return { ok: true };
  }

  function login(email, password) {
    const users = readJSON(USERS_KEY, []);
    const cleanEmail = email.trim().toLowerCase();
    const found = users.find((u) => u.email === cleanEmail && u.password === password);

    if (!found) {
      return { ok: false, error: "Wrong email or password" };
    }
    startSession(found);
    return { ok: true };
  }

  function logout() {
    removeKey(SESSION_KEY);
    setUser(null);
  }

  // Forgot password (demo only). In a real app this would use Firebase
  // sendPasswordResetEmail, or a backend + an email service that mails a
  // reset link/code. Here the code is saved in localStorage and shown on screen.
  function requestResetCode(email) {
    const cleanEmail = email.trim().toLowerCase();
    const users = readJSON(USERS_KEY, []);

    if (!users.some((u) => u.email === cleanEmail)) {
      return { ok: false, error: "No account found with this email" };
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const tenMinutes = 10 * 60 * 1000;
    writeJSON(RESET_KEY, { email: cleanEmail, code, expires: Date.now() + tenMinutes });
    return { ok: true, code };
  }

  function checkResetCode(email, code) {
    const saved = readJSON(RESET_KEY, null);

    if (!saved || saved.email !== email.trim().toLowerCase()) {
      return { ok: false, error: "Wrong code. Please try again" };
    }
    if (Date.now() > saved.expires) {
      return { ok: false, error: "This code has expired. Please resend a new code" };
    }
    if (saved.code !== code.trim()) {
      return { ok: false, error: "Wrong code. Please try again" };
    }
    return { ok: true };
  }

  function resetPassword(email, code, newPassword) {
    const check = checkResetCode(email, code);
    if (!check.ok) return check;

    const cleanEmail = email.trim().toLowerCase();
    const users = readJSON(USERS_KEY, []);
    const updatedUsers = users.map((u) => (u.email === cleanEmail ? { ...u, password: newPassword } : u));
    writeJSON(USERS_KEY, updatedUsers);
    removeKey(RESET_KEY);
    return { ok: true };
  }

  return (
    <AuthContext.Provider
      value={{ user, signup, login, logout, requestResetCode, checkResetCode, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
