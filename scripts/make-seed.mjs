// Turns src/data/internships.js into supabase/seed.sql.
// Run with: node scripts/make-seed.mjs
import { writeFileSync } from "node:fs";
import { LISTINGS } from "../src/data/internships.js";

const statusMap = {
  "Open now": "open",
  "Opens soon": "opens_soon",
  Rolling: "rolling",
  Closed: "closed",
  "Check site": "check_site",
};

// text -> 'text' (single quotes doubled), empty/null -> null
function text(value) {
  if (value === null || value === undefined || value === "") return "null";
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function textArray(list) {
  if (!list || list.length === 0) return "'{}'::text[]";
  return "array[" + list.map(text).join(", ") + "]::text[]";
}

const rows = LISTINGS.map((l) => {
  const status = statusMap[l.applicationStatus];
  if (!status) throw new Error("Unknown status on " + l.id);
  return (
    "  (" +
    [
      text(l.id),
      text(l.category),
      text(l.organisation),
      text(l.programName),
      text(l.role),
      textArray(l.locations),
      textArray(l.state),
      text(l.mode),
      text(l.stipend),
      text(l.duration),
      text(l.eligibility),
      text(l.description),
      text(status),
      text(l.deadline),
      text(l.applicationWindow),
      text(l.applyLink),
      text(l.sourceName),
      text(l.lastVerified),
    ].join(", ") +
    ")"
  );
});

const sql =
  "-- Seed data: the " + LISTINGS.length + " verified listings from src/data/internships.js.\n" +
  "-- Run this AFTER schema.sql. Running it twice is safe (existing rows are left alone).\n\n" +
  "insert into public.listings (\n" +
  "  id, category, organisation, program_name, role, locations, states, mode, stipend,\n" +
  "  duration, eligibility, description, application_status, deadline, application_window,\n" +
  "  apply_link, source_name, last_verified\n" +
  ") values\n" +
  rows.join(",\n") +
  "\non conflict (id) do nothing;\n";

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log("Wrote supabase/seed.sql with " + LISTINGS.length + " listings");
