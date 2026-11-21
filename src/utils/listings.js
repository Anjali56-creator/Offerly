import { daysLeft } from "./dates.js";

// the saved status can go out of date, so a passed deadline always means "Closed"
export function effectiveStatus(listing) {
  if (listing.deadline && daysLeft(listing.deadline) < 0) return "Closed";
  return listing.applicationStatus;
}

export function statusClass(status) {
  return "status-" + status.toLowerCase().replace(" ", "-");
}

const STATUS_ORDER = ["Open now", "Rolling", "Opens soon", "Check site", "Closed"];

// Open now (nearest deadline first) -> Rolling -> Opens soon -> Check site -> Closed
export function compareListings(a, b) {
  const rankA = STATUS_ORDER.indexOf(effectiveStatus(a));
  const rankB = STATUS_ORDER.indexOf(effectiveStatus(b));
  if (rankA !== rankB) return rankA - rankB;

  const deadlineA = a.deadline || "9999-12-31";
  const deadlineB = b.deadline || "9999-12-31";
  if (deadlineA !== deadlineB) return deadlineA.localeCompare(deadlineB);

  return a.organisation.localeCompare(b.organisation);
}

// turns a listing into an internship for the user's list (status Wishlist)
export function listingToInternship(listing) {
  // "₹16,000/month" becomes the number 16000, other texts are kept as a label
  const exactAmount = /^₹\s?([\d,]+)\s*\/\s*month$/i.exec(listing.stipend);
  const unpaid = listing.stipend === "Unpaid";

  return {
    listingId: listing.id,
    source: "saved",
    createdAt: new Date().toISOString(),
    company: listing.organisation,
    role: listing.role,
    category: listing.category,
    location: listing.locations.join(", "),
    mode: listing.mode,
    stipend: exactAmount ? Number(exactAmount[1].replace(/,/g, "")) : "",
    unpaid: unpaid,
    stipendLabel: exactAmount || unpaid ? "" : listing.stipend,
    duration: listing.duration,
    deadline: listing.deadline || null,
    deadlineTime: listing.deadline ? "23:59" : "",
    applicationWindow: listing.applicationWindow || "",
    status: "Wishlist",
    priority: "Medium",
    link: listing.applyLink,
    notes: "",
  };
}
