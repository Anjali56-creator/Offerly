import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

function parseJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    college: row.college,
    role: row.role || "student",
    preferredLocations: parseJson(row.preferred_locations, null),
    createdAt: row.created_at,
  };
}

function mapListing(row) {
  if (!row) return null;
  return {
    id: row.id,
    category: row.category,
    organisation: row.organisation,
    programName: row.program_name,
    role: row.role,
    locations: parseJson(row.locations, []),
    state: parseJson(row.state, []),
    mode: row.mode,
    stipend: row.stipend,
    duration: row.duration,
    eligibility: row.eligibility,
    applicationStatus: row.application_status,
    deadline: row.deadline || null,
    applicationWindow: row.application_window || "",
    applyLink: row.apply_link,
    sourceName: row.source_name,
    lastVerified: row.last_verified,
    description: row.description,
  };
}

function mapSavedInternship(row) {
  if (!row) return null;
  return {
    id: row.id,
    listingId: row.listing_id || undefined,
    source: row.source,
    company: row.company,
    role: row.role,
    category: row.category,
    deadline: row.deadline || null,
    deadlineTime: row.deadline_time || "",
    location: row.location || "",
    mode: row.mode || "On-site",
    stipend: row.stipend === "" || row.stipend === null ? "" : Number(row.stipend),
    unpaid: Boolean(row.unpaid),
    stipendLabel: row.stipend_label || "",
    duration: row.duration || "",
    applicationWindow: row.application_window || "",
    link: row.link || "",
    status: row.status,
    priority: row.priority || "Medium",
    notes: row.notes || "",
    createdAt: row.created_at,
  };
}

export function createSqliteStore(dbPath) {
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");

  return {
    kind: "sqlite",

    async ping() {
      db.prepare("SELECT 1").get();
    },

    async close() {
      db.close();
    },

    async initSchema() {
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          college TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'student',
          preferred_locations TEXT,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS password_resets (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          code_hash TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS password_resets_email_idx
          ON password_resets (email, created_at DESC);

        CREATE TABLE IF NOT EXISTS listings (
          id TEXT PRIMARY KEY,
          category TEXT NOT NULL,
          organisation TEXT NOT NULL,
          program_name TEXT NOT NULL,
          role TEXT NOT NULL,
          locations TEXT NOT NULL DEFAULT '[]',
          state TEXT NOT NULL DEFAULT '[]',
          mode TEXT NOT NULL,
          stipend TEXT NOT NULL,
          duration TEXT NOT NULL,
          eligibility TEXT NOT NULL,
          application_status TEXT NOT NULL,
          deadline TEXT,
          application_window TEXT NOT NULL DEFAULT '',
          apply_link TEXT NOT NULL,
          source_name TEXT NOT NULL,
          last_verified TEXT NOT NULL,
          description TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS saved_internships (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          listing_id TEXT,
          source TEXT NOT NULL DEFAULT 'manual',
          company TEXT NOT NULL,
          role TEXT NOT NULL,
          category TEXT NOT NULL,
          deadline TEXT,
          deadline_time TEXT NOT NULL DEFAULT '',
          location TEXT NOT NULL DEFAULT '',
          mode TEXT NOT NULL DEFAULT 'On-site',
          stipend TEXT NOT NULL DEFAULT '',
          unpaid INTEGER NOT NULL DEFAULT 0,
          stipend_label TEXT NOT NULL DEFAULT '',
          duration TEXT NOT NULL DEFAULT '',
          application_window TEXT NOT NULL DEFAULT '',
          link TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'Wishlist',
          priority TEXT NOT NULL DEFAULT 'Medium',
          notes TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL
        );

        CREATE UNIQUE INDEX IF NOT EXISTS saved_user_listing_idx
          ON saved_internships (user_id, listing_id)
          WHERE listing_id IS NOT NULL;

        CREATE INDEX IF NOT EXISTS saved_internships_user_idx
          ON saved_internships (user_id, created_at ASC);
      `);

      const cols = db.prepare("PRAGMA table_info(users)").all();
      if (!cols.some((col) => col.name === "role")) {
        db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student';");
      }
    },

    async seedListings(listings) {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO listings (
          id, category, organisation, program_name, role, locations, state, mode,
          stipend, duration, eligibility, application_status, deadline,
          application_window, apply_link, source_name, last_verified, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of listings) {
        stmt.run(
          item.id,
          item.category,
          item.organisation,
          item.programName,
          item.role,
          JSON.stringify(item.locations || []),
          JSON.stringify(item.state || []),
          item.mode,
          item.stipend,
          item.duration,
          item.eligibility,
          item.applicationStatus,
          item.deadline || null,
          item.applicationWindow || "",
          item.applyLink,
          item.sourceName,
          item.lastVerified,
          item.description
        );
      }
    },

    async getUserByEmail(email) {
      return db.prepare("SELECT * FROM users WHERE email = ?").get(email) || null;
    },

    async getUserById(id) {
      const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      return mapUser(row);
    },

    async createUser({ name, email, college, passwordHash, role = "student" }) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO users (id, name, email, college, password_hash, role, preferred_locations, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NULL, ?)`
      ).run(id, name, email, college, passwordHash, role, now);
      return this.getUserById(id);
    },

    async updateUserRole(userId, role) {
      db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, userId);
      return this.getUserById(userId);
    },

    async updateUserPreferences(userId, locations) {
      db.prepare("UPDATE users SET preferred_locations = ? WHERE id = ?").run(
        JSON.stringify(locations),
        userId
      );
      return this.getUserById(userId);
    },

    async updateUserPassword(email, passwordHash) {
      db.prepare("UPDATE users SET password_hash = ? WHERE email = ?").run(passwordHash, email);
    },

    async createPasswordReset(email, codeHash, expiresAt) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      db.prepare("DELETE FROM password_resets WHERE email = ?").run(email);
      db.prepare(
        `INSERT INTO password_resets (id, email, code_hash, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run(id, email, codeHash, new Date(expiresAt).toISOString(), now);
    },

    async getLatestPasswordReset(email) {
      return (
        db
          .prepare("SELECT * FROM password_resets WHERE email = ? ORDER BY created_at DESC LIMIT 1")
          .get(email) || null
      );
    },

    async deletePasswordResets(email) {
      db.prepare("DELETE FROM password_resets WHERE email = ?").run(email);
    },

    async listListings() {
      const rows = db.prepare("SELECT * FROM listings").all();
      return rows.map(mapListing);
    },

    async getListingById(id) {
      const row = db.prepare("SELECT * FROM listings WHERE id = ?").get(id);
      return mapListing(row);
    },

    async createListing(item) {
      db.prepare(
        `INSERT INTO listings (
          id, category, organisation, program_name, role, locations, state, mode,
          stipend, duration, eligibility, application_status, deadline,
          application_window, apply_link, source_name, last_verified, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        item.id,
        item.category,
        item.organisation,
        item.programName,
        item.role,
        JSON.stringify(item.locations || []),
        JSON.stringify(item.state || []),
        item.mode,
        item.stipend,
        item.duration,
        item.eligibility,
        item.applicationStatus,
        item.deadline || null,
        item.applicationWindow || "",
        item.applyLink,
        item.sourceName,
        item.lastVerified,
        item.description || ""
      );
      return this.getListingById(item.id);
    },

    async updateListing(id, patch) {
      const existing = await this.getListingById(id);
      if (!existing) return null;
      const merged = { ...existing, ...patch };
      db.prepare(
        `UPDATE listings SET
          category = ?,
          organisation = ?,
          program_name = ?,
          role = ?,
          locations = ?,
          state = ?,
          mode = ?,
          stipend = ?,
          duration = ?,
          eligibility = ?,
          application_status = ?,
          deadline = ?,
          application_window = ?,
          apply_link = ?,
          source_name = ?,
          last_verified = ?,
          description = ?
         WHERE id = ?`
      ).run(
        merged.category,
        merged.organisation,
        merged.programName,
        merged.role,
        JSON.stringify(merged.locations || []),
        JSON.stringify(merged.state || []),
        merged.mode,
        merged.stipend,
        merged.duration,
        merged.eligibility,
        merged.applicationStatus,
        merged.deadline || null,
        merged.applicationWindow || "",
        merged.applyLink,
        merged.sourceName,
        merged.lastVerified,
        merged.description || "",
        id
      );
      return this.getListingById(id);
    },

    async deleteListing(id) {
      const info = db.prepare("DELETE FROM listings WHERE id = ?").run(id);
      return info.changes > 0;
    },

    async getAdminOverview() {
      const userRows = db
        .prepare(
          "SELECT id, name, email, college, role, preferred_locations, created_at FROM users ORDER BY created_at DESC"
        )
        .all();
      const listingsCount = db.prepare("SELECT COUNT(*) AS total FROM listings").get();
      const savedCount = db.prepare("SELECT COUNT(*) AS total FROM saved_internships").get();
      return {
        stats: {
          users: userRows.length,
          listings: listingsCount?.total ?? 0,
          savedInternships: savedCount?.total ?? 0,
        },
        users: userRows.map(mapUser),
      };
    },

    async listSavedInternships(userId) {
      const rows = db
        .prepare("SELECT * FROM saved_internships WHERE user_id = ? ORDER BY created_at ASC")
        .all(userId);
      return rows.map(mapSavedInternship);
    },

    async getSavedInternshipById(userId, id) {
      const row = db
        .prepare("SELECT * FROM saved_internships WHERE id = ? AND user_id = ?")
        .get(id, userId);
      return mapSavedInternship(row);
    },

    async getSavedInternshipByListingId(userId, listingId) {
      const row = db
        .prepare("SELECT * FROM saved_internships WHERE user_id = ? AND listing_id = ?")
        .get(userId, listingId);
      return mapSavedInternship(row);
    },

    async createSavedInternship(userId, data) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO saved_internships (
          id, user_id, listing_id, source, company, role, category,
          deadline, deadline_time, location, mode, stipend, unpaid,
          stipend_label, duration, application_window, link, status, priority, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        userId,
        data.listingId || null,
        data.source || "manual",
        data.company,
        data.role,
        data.category,
        data.deadline || null,
        data.deadlineTime || "",
        data.location || "",
        data.mode || "On-site",
        data.stipend === "" || data.stipend === null || data.stipend === undefined
          ? ""
          : String(data.stipend),
        data.unpaid ? 1 : 0,
        data.stipendLabel || "",
        data.duration || "",
        data.applicationWindow || "",
        data.link || "",
        data.status || "Wishlist",
        data.priority || "Medium",
        data.notes || "",
        now
      );
      return this.getSavedInternshipById(userId, id);
    },

    async updateSavedInternship(userId, id, patch) {
      const existing = await this.getSavedInternshipById(userId, id);
      if (!existing) return null;

      const merged = { ...existing, ...patch };
      db.prepare(
        `UPDATE saved_internships SET
          company = ?,
          role = ?,
          category = ?,
          deadline = ?,
          deadline_time = ?,
          location = ?,
          mode = ?,
          stipend = ?,
          unpaid = ?,
          stipend_label = ?,
          duration = ?,
          application_window = ?,
          link = ?,
          status = ?,
          priority = ?,
          notes = ?
         WHERE id = ? AND user_id = ?`
      ).run(
        merged.company,
        merged.role,
        merged.category,
        merged.deadline || null,
        merged.deadlineTime || "",
        merged.location || "",
        merged.mode || "On-site",
        merged.stipend === "" || merged.stipend === null || merged.stipend === undefined
          ? ""
          : String(merged.stipend),
        merged.unpaid ? 1 : 0,
        merged.stipendLabel || "",
        merged.duration || "",
        merged.applicationWindow || "",
        merged.link || "",
        merged.status || "Wishlist",
        merged.priority || "Medium",
        merged.notes || "",
        id,
        userId
      );
      return this.getSavedInternshipById(userId, id);
    },

    async deleteSavedInternship(userId, id) {
      const info = db
        .prepare("DELETE FROM saved_internships WHERE id = ? AND user_id = ?")
        .run(id, userId);
      return info.changes > 0;
    },
  };
}
