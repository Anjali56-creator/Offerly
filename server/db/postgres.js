import crypto from "node:crypto";
import pg from "pg";

const { Pool } = pg;

function shouldUseSsl(connectionString) {
  if (process.env.PGSSLMODE === "disable") return false;
  if (process.env.PGSSLMODE === "require") return true;
  if (connectionString.includes("sslmode=require")) return true;
  if (connectionString.includes(".render.com")) return true;
  try {
    const parsed = new URL(connectionString);
    const host = parsed.hostname;
    // Render internal hostnames have no dots (e.g. dpg-xxxx-a) and do not use SSL;
    // external managed Postgres hosts contain dots and require SSL.
    return host.includes(".") && host !== "localhost" && host !== "127.0.0.1";
  } catch {
    return process.env.NODE_ENV === "production";
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
    preferredLocations: row.preferred_locations ?? null,
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
    locations: row.locations || [],
    state: row.state || [],
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

export function createPostgresStore(connectionString, customPool = null) {
  const pool =
    customPool ||
    new Pool({
      connectionString,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : false,
    });

  return {
    kind: "postgres",

    async ping() {
      await pool.query("SELECT 1");
    },

    async close() {
      if (typeof pool.end === "function") {
        await pool.end();
      }
    },

    async initSchema() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          college TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'student',
          preferred_locations JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';

        CREATE TABLE IF NOT EXISTS password_resets (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          code_hash TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS password_resets_email_idx
          ON password_resets (email, created_at DESC);

        CREATE TABLE IF NOT EXISTS listings (
          id TEXT PRIMARY KEY,
          category TEXT NOT NULL,
          organisation TEXT NOT NULL,
          program_name TEXT NOT NULL,
          role TEXT NOT NULL,
          locations JSONB NOT NULL DEFAULT '[]'::jsonb,
          state JSONB NOT NULL DEFAULT '[]'::jsonb,
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
          unpaid BOOLEAN NOT NULL DEFAULT FALSE,
          stipend_label TEXT NOT NULL DEFAULT '',
          duration TEXT NOT NULL DEFAULT '',
          application_window TEXT NOT NULL DEFAULT '',
          link TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'Wishlist',
          priority TEXT NOT NULL DEFAULT 'Medium',
          notes TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE UNIQUE INDEX IF NOT EXISTS saved_user_listing_idx
          ON saved_internships (user_id, listing_id)
          WHERE listing_id IS NOT NULL;

        CREATE INDEX IF NOT EXISTS saved_internships_user_idx
          ON saved_internships (user_id, created_at ASC);
      `);
    },

    async seedListings(listings) {
      for (const item of listings) {
        await pool.query(
          `INSERT INTO listings (
            id, category, organisation, program_name, role, locations, state, mode,
            stipend, duration, eligibility, application_status, deadline,
            application_window, apply_link, source_name, last_verified, description
          ) VALUES (
            $1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8,
            $9, $10, $11, $12, $13,
            $14, $15, $16, $17, $18
          ) ON CONFLICT (id) DO NOTHING`,
          [
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
            item.description,
          ]
        );
      }
    },

    async getUserByEmail(email) {
      const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      return rows[0] || null;
    },

    async getUserById(id) {
      const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
      return mapUser(rows[0]);
    },

    async createUser({ name, email, college, passwordHash, role = "student" }) {
      const id = crypto.randomUUID();
      const { rows } = await pool.query(
        `INSERT INTO users (id, name, email, college, password_hash, role)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, name, email, college, passwordHash, role]
      );
      return mapUser(rows[0]);
    },

    async updateUserRole(userId, role) {
      const { rows } = await pool.query(
        "UPDATE users SET role = $2 WHERE id = $1 RETURNING *",
        [userId, role]
      );
      return mapUser(rows[0]);
    },

    async updateUserPreferences(userId, locations) {
      const { rows } = await pool.query(
        `UPDATE users SET preferred_locations = $2::jsonb WHERE id = $1 RETURNING *`,
        [userId, JSON.stringify(locations)]
      );
      return mapUser(rows[0]);
    },

    async updateUserPassword(email, passwordHash) {
      await pool.query("UPDATE users SET password_hash = $2 WHERE email = $1", [email, passwordHash]);
    },

    async createPasswordReset(email, codeHash, expiresAt) {
      const id = crypto.randomUUID();
      await pool.query("DELETE FROM password_resets WHERE email = $1", [email]);
      await pool.query(
        `INSERT INTO password_resets (id, email, code_hash, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [id, email, codeHash, expiresAt]
      );
    },

    async getLatestPasswordReset(email) {
      const { rows } = await pool.query(
        `SELECT * FROM password_resets WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
        [email]
      );
      return rows[0] || null;
    },

    async deletePasswordResets(email) {
      await pool.query("DELETE FROM password_resets WHERE email = $1", [email]);
    },

    async listListings() {
      const { rows } = await pool.query("SELECT * FROM listings");
      return rows.map(mapListing);
    },

    async getListingById(id) {
      const { rows } = await pool.query("SELECT * FROM listings WHERE id = $1", [id]);
      return mapListing(rows[0]);
    },

    async createListing(item) {
      const { rows } = await pool.query(
        `INSERT INTO listings (
          id, category, organisation, program_name, role, locations, state, mode,
          stipend, duration, eligibility, application_status, deadline,
          application_window, apply_link, source_name, last_verified, description
        ) VALUES (
          $1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8,
          $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18
        ) RETURNING *`,
        [
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
          item.description || "",
        ]
      );
      return mapListing(rows[0]);
    },

    async updateListing(id, patch) {
      const existing = await this.getListingById(id);
      if (!existing) return null;
      const merged = { ...existing, ...patch };
      const { rows } = await pool.query(
        `UPDATE listings SET
          category = $2,
          organisation = $3,
          program_name = $4,
          role = $5,
          locations = $6::jsonb,
          state = $7::jsonb,
          mode = $8,
          stipend = $9,
          duration = $10,
          eligibility = $11,
          application_status = $12,
          deadline = $13,
          application_window = $14,
          apply_link = $15,
          source_name = $16,
          last_verified = $17,
          description = $18
         WHERE id = $1
         RETURNING *`,
        [
          id,
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
        ]
      );
      return mapListing(rows[0]);
    },

    async deleteListing(id) {
      const { rowCount } = await pool.query("DELETE FROM listings WHERE id = $1", [id]);
      return rowCount > 0;
    },

    async getAdminOverview() {
      const usersRes = await pool.query(
        "SELECT id, name, email, college, role, preferred_locations, created_at FROM users ORDER BY created_at DESC"
      );
      const listingsCountRes = await pool.query("SELECT COUNT(*)::int AS total FROM listings");
      const savedCountRes = await pool.query("SELECT COUNT(*)::int AS total FROM saved_internships");
      return {
        stats: {
          users: usersRes.rows.length,
          listings: listingsCountRes.rows[0]?.total ?? 0,
          savedInternships: savedCountRes.rows[0]?.total ?? 0,
        },
        users: usersRes.rows.map(mapUser),
      };
    },

    async listSavedInternships(userId) {
      const { rows } = await pool.query(
        "SELECT * FROM saved_internships WHERE user_id = $1 ORDER BY created_at ASC",
        [userId]
      );
      return rows.map(mapSavedInternship);
    },

    async getSavedInternshipById(userId, id) {
      const { rows } = await pool.query(
        "SELECT * FROM saved_internships WHERE id = $1 AND user_id = $2",
        [id, userId]
      );
      return mapSavedInternship(rows[0]);
    },

    async getSavedInternshipByListingId(userId, listingId) {
      const { rows } = await pool.query(
        "SELECT * FROM saved_internships WHERE user_id = $1 AND listing_id = $2",
        [userId, listingId]
      );
      return mapSavedInternship(rows[0]);
    },

    async createSavedInternship(userId, data) {
      const id = crypto.randomUUID();
      const { rows } = await pool.query(
        `INSERT INTO saved_internships (
          id, user_id, listing_id, source, company, role, category,
          deadline, deadline_time, location, mode, stipend, unpaid,
          stipend_label, duration, application_window, link, status, priority, notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20
        ) RETURNING *`,
        [
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
          Boolean(data.unpaid),
          data.stipendLabel || "",
          data.duration || "",
          data.applicationWindow || "",
          data.link || "",
          data.status || "Wishlist",
          data.priority || "Medium",
          data.notes || "",
        ]
      );
      return mapSavedInternship(rows[0]);
    },

    async updateSavedInternship(userId, id, patch) {
      const existing = await this.getSavedInternshipById(userId, id);
      if (!existing) return null;

      const merged = { ...existing, ...patch };
      const { rows } = await pool.query(
        `UPDATE saved_internships SET
          company = $3,
          role = $4,
          category = $5,
          deadline = $6,
          deadline_time = $7,
          location = $8,
          mode = $9,
          stipend = $10,
          unpaid = $11,
          stipend_label = $12,
          duration = $13,
          application_window = $14,
          link = $15,
          status = $16,
          priority = $17,
          notes = $18
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [
          id,
          userId,
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
          Boolean(merged.unpaid),
          merged.stipendLabel || "",
          merged.duration || "",
          merged.applicationWindow || "",
          merged.link || "",
          merged.status || "Wishlist",
          merged.priority || "Medium",
          merged.notes || "",
        ]
      );
      return mapSavedInternship(rows[0]);
    },

    async deleteSavedInternship(userId, id) {
      const { rowCount } = await pool.query(
        "DELETE FROM saved_internships WHERE id = $1 AND user_id = $2",
        [id, userId]
      );
      return rowCount > 0;
    },
  };
}
