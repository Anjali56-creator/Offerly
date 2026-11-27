import test from "node:test";
import assert from "node:assert/strict";
import { newDb } from "pg-mem";
import { createSqliteStore } from "../db/sqlite.js";
import { createPostgresStore } from "../db/postgres.js";
import { createApp } from "../app.js";
import { seedDemoUsers } from "../seedDemoUsers.js";
import { LISTINGS } from "../../src/data/internships.js";

process.env.NODE_ENV = "test";

function extractCookie(setCookieHeader) {
  if (!setCookieHeader) return "";
  const raw = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
  return raw ? raw.split(";")[0] : "";
}

async function startTestServer(kind) {
  let store;
  if (kind === "postgres") {
    const db = newDb();
    const { Pool } = db.adapters.createPg();
    store = createPostgresStore("postgres://test", new Pool());
  } else {
    store = createSqliteStore(":memory:");
  }

  await store.initSchema();
  await store.seedListings(LISTINGS);
  await seedDemoUsers(store);
  const app = createApp(store);

  const server = await new Promise((resolve) => {
    const srv = app.listen(0, "127.0.0.1", () => resolve(srv));
  });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  async function request(path, { method = "GET", body, cookie } = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    return {
      status: res.status,
      data,
      cookie: extractCookie(res.headers.get("set-cookie")),
    };
  }

  return {
    store,
    baseUrl,
    request,
    async close() {
      await new Promise((resolve) => server.close(resolve));
      await store.close();
    },
  };
}

for (const storeKind of ["sqlite", "postgres"]) {
  test(`[${storeKind}] full auth, preferences, listings, password reset, and saved internships lifecycle`, async () => {
    const ctx = await startTestServer(storeKind);
    try {
      // 1. Health check
      const health = await ctx.request("/api/health");
      assert.equal(health.status, 200);
      assert.equal(health.data.ok, true);
      assert.equal(health.data.db, storeKind);

      // 2. Unauthenticated requests are blocked
      const meUnauth = await ctx.request("/api/auth/me");
      assert.equal(meUnauth.status, 401);

      const listingsUnauth = await ctx.request("/api/listings");
      assert.equal(listingsUnauth.status, 401);

      // 3. Signup creates user with hashed password & cookie
      const signup = await ctx.request("/api/auth/signup", {
        method: "POST",
        body: {
          name: "Ankur Tiwari",
          email: "Ankur@Example.com",
          college: "NIT Delhi",
          password: "secret123",
        },
      });
      assert.equal(signup.status, 201);
      assert.equal(signup.data.user.email, "ankur@example.com");
      assert.equal(signup.data.user.preferredLocations, null);
      assert.ok(signup.cookie.startsWith("offerly_token="));
      const userACookie = signup.cookie;

      // Duplicate email rejected
      const dup = await ctx.request("/api/auth/signup", {
        method: "POST",
        body: {
          name: "Other",
          email: "ankur@example.com",
          college: "IIT",
          password: "secret123",
        },
      });
      assert.equal(dup.status, 409);

      // Password is stored hashed, never plaintext
      const rawUser = await ctx.store.getUserByEmail("ankur@example.com");
      assert.notEqual(rawUser.password_hash, "secret123");
      assert.ok(rawUser.password_hash.startsWith("$2"));

      // 4. Preferences update
      const prefRes = await ctx.request("/api/auth/preferences", {
        method: "PUT",
        cookie: userACookie,
        body: { locations: ["Bengaluru", "Remote"] },
      });
      assert.equal(prefRes.status, 200);
      assert.deepEqual(prefRes.data.user.preferredLocations, ["Bengaluru", "Remote"]);

      // 5. Listings seeded from src/data/internships.js
      const listingsRes = await ctx.request("/api/listings", { cookie: userACookie });
      assert.equal(listingsRes.status, 200);
      assert.equal(listingsRes.data.listings.length, LISTINGS.length);

      const detailRes = await ctx.request("/api/listings/gov-isro", { cookie: userACookie });
      assert.equal(detailRes.status, 200);
      assert.equal(detailRes.data.listing.organisation, "ISRO (Dept. of Space)");

      // 6. Saved internships CRUD
      const createManual = await ctx.request("/api/internships", {
        method: "POST",
        cookie: userACookie,
        body: {
          company: "Acme Labs",
          role: "Backend Intern",
          category: "startup",
          deadline: "2026-12-15",
          deadlineTime: "23:59",
          mode: "Remote",
          stipend: 15000,
        },
      });
      assert.equal(createManual.status, 201);
      const savedId = createManual.data.internship.id;
      assert.equal(createManual.data.internship.stipend, 15000);

      const createFromListing = await ctx.request("/api/internships", {
        method: "POST",
        cookie: userACookie,
        body: {
          listingId: "gov-isro",
          source: "saved",
          company: "ISRO (Dept. of Space)",
          role: "Intern / Project trainee",
          category: "government",
          unpaid: true,
          status: "Wishlist",
        },
      });
      assert.equal(createFromListing.status, 201);

      const patchRes = await ctx.request(`/api/internships/${savedId}`, {
        method: "PATCH",
        cookie: userACookie,
        body: { status: "Applied", priority: "High" },
      });
      assert.equal(patchRes.status, 200);
      assert.equal(patchRes.data.internship.status, "Applied");
      assert.equal(patchRes.data.internship.priority, "High");

      // 7. User isolation: User B cannot read or modify User A's saved internships
      const signupB = await ctx.request("/api/auth/signup", {
        method: "POST",
        body: {
          name: "Priya",
          email: "priya@example.com",
          college: "IIIT",
          password: "password1",
        },
      });
      const userBCookie = signupB.cookie;

      const listB = await ctx.request("/api/internships", { cookie: userBCookie });
      assert.equal(listB.status, 200);
      assert.equal(listB.data.internships.length, 0);

      const patchByB = await ctx.request(`/api/internships/${savedId}`, {
        method: "PATCH",
        cookie: userBCookie,
        body: { status: "Offer" },
      });
      assert.equal(patchByB.status, 404);

      // Delete by owner works
      const delRes = await ctx.request(`/api/internships/${savedId}`, {
        method: "DELETE",
        cookie: userACookie,
      });
      assert.equal(delRes.status, 200);

      // 8. Forgot password & login flow
      const forgotRes = await ctx.request("/api/auth/forgot-password", {
        method: "POST",
        body: { email: "ankur@example.com" },
      });
      assert.equal(forgotRes.status, 200);
      assert.ok(forgotRes.data.devCode);

      const badVerify = await ctx.request("/api/auth/verify-reset-code", {
        method: "POST",
        body: { email: "ankur@example.com", code: "000000" },
      });
      assert.equal(badVerify.status, 400);

      const goodVerify = await ctx.request("/api/auth/verify-reset-code", {
        method: "POST",
        body: { email: "ankur@example.com", code: forgotRes.data.devCode },
      });
      assert.equal(goodVerify.status, 200);

      const resetRes = await ctx.request("/api/auth/reset-password", {
        method: "POST",
        body: {
          email: "ankur@example.com",
          code: forgotRes.data.devCode,
          newPassword: "newpassword99",
        },
      });
      assert.equal(resetRes.status, 200);

      const oldLogin = await ctx.request("/api/auth/login", {
        method: "POST",
        body: { email: "ankur@example.com", password: "secret123" },
      });
      assert.equal(oldLogin.status, 401);

      const newLogin = await ctx.request("/api/auth/login", {
        method: "POST",
        body: { email: "ankur@example.com", password: "newpassword99" },
      });
      assert.equal(newLogin.status, 200);
      assert.ok(newLogin.cookie.startsWith("offerly_token="));

      // 9. Static SPA fallback serves index.html on client routes (Express 5 check)
      const spaRes = await fetch(`${ctx.baseUrl}/dashboard`);
      assert.equal(spaRes.status, 200);
      const html = await spaRes.text();
      assert.ok(html.includes("<title>Offerly"));

      // Unknown API routes still return 404 JSON
      const api404 = await ctx.request("/api/does-not-exist");
      assert.equal(api404.status, 404);

      // 10. Role-based access & Admin endpoints using seeded credentials
      const studentDemoLogin = await ctx.request("/api/auth/login", {
        method: "POST",
        body: { email: "student@offerly.in", password: "Student@123" },
      });
      assert.equal(studentDemoLogin.status, 200);
      assert.equal(studentDemoLogin.data.user.role, "student");

      const studentAdminAttempt = await ctx.request("/api/admin/overview", {
        cookie: studentDemoLogin.cookie,
      });
      assert.equal(studentAdminAttempt.status, 403);

      const adminLogin = await ctx.request("/api/auth/login", {
        method: "POST",
        body: { email: "admin@offerly.in", password: "Admin@123" },
      });
      assert.equal(adminLogin.status, 200);
      assert.equal(adminLogin.data.user.role, "admin");

      const overviewRes = await ctx.request("/api/admin/overview", {
        cookie: adminLogin.cookie,
      });
      assert.equal(overviewRes.status, 200);
      assert.equal(overviewRes.data.stats.listings, LISTINGS.length);
      assert.ok(overviewRes.data.stats.users >= 4);

      const createdListingRes = await ctx.request("/api/admin/listings", {
        method: "POST",
        cookie: adminLogin.cookie,
        body: {
          category: "startup",
          organisation: "ABESEC Innovation Hub",
          programName: "Summer Tech Fellowship",
          role: "Full Stack Intern",
          locations: "Ghaziabad, Remote",
          state: "Uttar Pradesh",
          mode: "Hybrid",
          stipend: "₹12,000/month",
          duration: "8 weeks",
          eligibility: "B.Tech CSE",
          applicationStatus: "Open now",
          applyLink: "https://example.com/apply",
        },
      });
      assert.equal(createdListingRes.status, 201);
      const newListingId = createdListingRes.data.listing.id;

      const updatedListingRes = await ctx.request(`/api/admin/listings/${newListingId}`, {
        method: "PATCH",
        cookie: adminLogin.cookie,
        body: { applicationStatus: "Closed" },
      });
      assert.equal(updatedListingRes.status, 200);
      assert.equal(updatedListingRes.data.listing.applicationStatus, "Closed");

      const deletedListingRes = await ctx.request(`/api/admin/listings/${newListingId}`, {
        method: "DELETE",
        cookie: adminLogin.cookie,
      });
      assert.equal(deletedListingRes.status, 200);
    } finally {
      await ctx.close();
    }
  });
}
