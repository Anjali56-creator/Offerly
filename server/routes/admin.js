import crypto from "node:crypto";
import express from "express";

const VALID_CATEGORIES = new Set(["government", "private", "startup", "research", "remote", "ngo"]);
const VALID_MODES = new Set(["On-site", "Remote", "Hybrid"]);
const VALID_APP_STATUSES = new Set(["Open now", "Opens soon", "Rolling", "Closed", "Check site"]);

function parseCsvList(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function validateListing(body, { isPatch = false } = {}) {
  const errors = [];
  const data = {};

  if (!isPatch || body.category !== undefined) {
    const category = String(body.category || "").trim();
    if (!VALID_CATEGORIES.has(category)) errors.push("Invalid category");
    else data.category = category;
  }

  if (!isPatch || body.organisation !== undefined) {
    const organisation = String(body.organisation || "").trim();
    if (!organisation) errors.push("Organisation is required");
    else data.organisation = organisation;
  }

  if (!isPatch || body.programName !== undefined) {
    const programName = String(body.programName || "").trim();
    if (!programName) errors.push("Program name is required");
    else data.programName = programName;
  }

  if (!isPatch || body.role !== undefined) {
    const role = String(body.role || "").trim();
    if (!role) errors.push("Role is required");
    else data.role = role;
  }

  if (body.locations !== undefined) {
    const locs = parseCsvList(body.locations);
    data.locations = locs.length > 0 ? locs : ["Pan-India"];
  } else if (!isPatch) {
    data.locations = ["Pan-India"];
  }

  if (body.state !== undefined) {
    data.state = parseCsvList(body.state);
  } else if (!isPatch) {
    data.state = [];
  }

  if (!isPatch || body.mode !== undefined) {
    const mode = String(body.mode || "On-site");
    if (!VALID_MODES.has(mode)) errors.push("Invalid mode");
    else data.mode = mode;
  }

  if (body.stipend !== undefined) {
    data.stipend = String(body.stipend || "").trim() || "Not stated";
  } else if (!isPatch) {
    data.stipend = "Not stated";
  }

  if (body.duration !== undefined) {
    data.duration = String(body.duration || "").trim() || "Not stated";
  } else if (!isPatch) {
    data.duration = "Not stated";
  }

  if (body.eligibility !== undefined) {
    data.eligibility = String(body.eligibility || "").trim() || "See official page";
  } else if (!isPatch) {
    data.eligibility = "See official page";
  }

  if (!isPatch || body.applicationStatus !== undefined) {
    const status = String(body.applicationStatus || "Open now");
    if (!VALID_APP_STATUSES.has(status)) errors.push("Invalid application status");
    else data.applicationStatus = status;
  }

  if (body.deadline !== undefined) {
    data.deadline = body.deadline ? String(body.deadline).trim() : null;
  }

  if (body.applicationWindow !== undefined) {
    data.applicationWindow = String(body.applicationWindow || "").trim();
  }

  if (!isPatch || body.applyLink !== undefined) {
    const applyLink = String(body.applyLink || "").trim();
    if (!/^https?:\/\//i.test(applyLink)) errors.push("Apply link must start with http:// or https://");
    else data.applyLink = applyLink;
  }

  if (body.sourceName !== undefined) {
    data.sourceName = String(body.sourceName || "").trim() || "Official portal";
  } else if (!isPatch) {
    data.sourceName = "Official portal";
  }

  if (body.lastVerified !== undefined) {
    data.lastVerified = String(body.lastVerified || "").trim() || new Date().toISOString().slice(0, 10);
  } else if (!isPatch) {
    data.lastVerified = new Date().toISOString().slice(0, 10);
  }

  if (body.description !== undefined) {
    data.description = String(body.description || "").trim();
  } else if (!isPatch) {
    data.description = "";
  }

  return { errors, data };
}

export function createAdminRouter(store, requireAuth, requireAdmin) {
  const router = express.Router();

  router.use(requireAuth, requireAdmin);

  router.get("/overview", async (req, res, next) => {
    try {
      const overview = await store.getAdminOverview();
      return res.json(overview);
    } catch (err) {
      return next(err);
    }
  });

  router.post("/listings", async (req, res, next) => {
    try {
      const { errors, data } = validateListing(req.body || {});
      if (errors.length > 0) {
        return res.status(400).json({ error: errors[0] });
      }
      const slugBase = `${data.category}-${data.organisation}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 32);
      const id = `${slugBase}-${crypto.randomBytes(3).toString("hex")}`;
      const listing = await store.createListing({ id, ...data });
      return res.status(201).json({ listing });
    } catch (err) {
      return next(err);
    }
  });

  router.patch("/listings/:id", async (req, res, next) => {
    try {
      const { errors, data } = validateListing(req.body || {}, { isPatch: true });
      if (errors.length > 0) {
        return res.status(400).json({ error: errors[0] });
      }
      const listing = await store.updateListing(req.params.id, data);
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }
      return res.json({ listing });
    } catch (err) {
      return next(err);
    }
  });

  router.delete("/listings/:id", async (req, res, next) => {
    try {
      const deleted = await store.deleteListing(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Listing not found" });
      }
      return res.json({ ok: true });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}
