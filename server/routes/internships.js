import express from "express";

const VALID_CATEGORIES = new Set(["government", "private", "startup", "research", "remote", "ngo"]);
const VALID_STATUSES = new Set(["Wishlist", "Applied", "Test", "Interview", "Offer", "Rejected"]);
const VALID_PRIORITIES = new Set(["High", "Medium", "Low"]);
const VALID_MODES = new Set(["On-site", "Remote", "Hybrid"]);

function validatePayload(body, { isPatch = false } = {}) {
  const errors = [];
  const data = {};

  if (!isPatch || body.company !== undefined) {
    const company = String(body.company || "").trim();
    if (!company) errors.push("Organisation / company name is required");
    else data.company = company;
  }

  if (!isPatch || body.role !== undefined) {
    const role = String(body.role || "").trim();
    if (!role) errors.push("Role / position is required");
    else data.role = role;
  }

  if (!isPatch || body.category !== undefined) {
    const category = String(body.category || "").trim();
    if (!VALID_CATEGORIES.has(category)) errors.push("Invalid category");
    else data.category = category;
  }

  if (body.deadline !== undefined) {
    data.deadline = body.deadline ? String(body.deadline).trim() : null;
  }

  if (body.deadlineTime !== undefined) {
    data.deadlineTime = body.deadlineTime ? String(body.deadlineTime).trim() : "";
  }

  if (body.location !== undefined) {
    data.location = String(body.location || "").trim();
  }

  if (body.mode !== undefined) {
    const mode = String(body.mode || "On-site");
    if (!VALID_MODES.has(mode)) errors.push("Invalid mode");
    else data.mode = mode;
  }

  if (body.unpaid !== undefined) {
    data.unpaid = Boolean(body.unpaid);
  }

  if (body.stipend !== undefined) {
    if (body.stipend === "" || body.stipend === null) {
      data.stipend = "";
    } else {
      const amount = Number(body.stipend);
      if (Number.isNaN(amount) || amount < 0) errors.push("Stipend cannot be negative");
      else data.stipend = amount;
    }
  }

  if (body.stipendLabel !== undefined) {
    data.stipendLabel = String(body.stipendLabel || "").trim();
  }

  if (body.duration !== undefined) {
    data.duration = String(body.duration || "").trim();
  }

  if (body.applicationWindow !== undefined) {
    data.applicationWindow = String(body.applicationWindow || "").trim();
  }

  if (body.link !== undefined) {
    const link = String(body.link || "").trim();
    if (link && !/^https?:\/\//i.test(link)) {
      errors.push("Link must start with http:// or https://");
    } else {
      data.link = link;
    }
  }

  if (body.status !== undefined) {
    const status = String(body.status);
    if (!VALID_STATUSES.has(status)) errors.push("Invalid status");
    else data.status = status;
  }

  if (body.priority !== undefined) {
    const priority = String(body.priority);
    if (!VALID_PRIORITIES.has(priority)) errors.push("Invalid priority");
    else data.priority = priority;
  }

  if (body.notes !== undefined) {
    data.notes = String(body.notes || "").trim();
  }

  if (!isPatch) {
    if (body.listingId !== undefined && body.listingId !== null && body.listingId !== "") {
      data.listingId = String(body.listingId);
    }
    data.source = body.source === "saved" ? "saved" : "manual";
  }

  return { errors, data };
}

export function createInternshipsRouter(store, requireAuth) {
  const router = express.Router();

  router.get("/", requireAuth, async (req, res, next) => {
    try {
      const internships = await store.listSavedInternships(req.user.id);
      return res.json({ internships });
    } catch (err) {
      return next(err);
    }
  });

  router.post("/", requireAuth, async (req, res, next) => {
    try {
      const { errors, data } = validatePayload(req.body || {});
      if (errors.length > 0) {
        return res.status(400).json({ error: errors[0] });
      }

      if (data.listingId) {
        const existing = await store.getSavedInternshipByListingId(req.user.id, data.listingId);
        if (existing) {
          return res.status(200).json({ internship: existing });
        }
      }

      const internship = await store.createSavedInternship(req.user.id, data);
      return res.status(201).json({ internship });
    } catch (err) {
      return next(err);
    }
  });

  router.patch("/:id", requireAuth, async (req, res, next) => {
    try {
      const { errors, data } = validatePayload(req.body || {}, { isPatch: true });
      if (errors.length > 0) {
        return res.status(400).json({ error: errors[0] });
      }

      const internship = await store.updateSavedInternship(req.user.id, req.params.id, data);
      if (!internship) {
        return res.status(404).json({ error: "Internship not found" });
      }

      return res.json({ internship });
    } catch (err) {
      return next(err);
    }
  });

  router.delete("/:id", requireAuth, async (req, res, next) => {
    try {
      const deleted = await store.deleteSavedInternship(req.user.id, req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Internship not found" });
      }
      return res.json({ ok: true });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}
