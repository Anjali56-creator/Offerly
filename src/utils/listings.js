// turns a sample listing into an internship for the user's list (status Wishlist)
export function listingToInternship(listing) {
  return {
    listingId: listing.id,
    source: "saved",
    createdAt: new Date().toISOString(),
    company: listing.organisation,
    role: listing.role,
    category: listing.category,
    location: listing.location,
    mode: listing.mode,
    stipend: listing.stipend === "Unpaid" ? "" : listing.stipend,
    unpaid: listing.stipend === "Unpaid",
    duration: listing.duration,
    deadline: listing.deadline,
    deadlineTime: "23:59",
    status: "Wishlist",
    priority: "Medium",
    link: listing.applyLink,
    notes: "",
  };
}
