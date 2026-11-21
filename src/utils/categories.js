export const STATUSES = ["Wishlist", "Applied", "Test", "Interview", "Offer", "Rejected"];

export const CATEGORIES = [
  {
    name: "Government Internships",
    slug: "government",
    description: "ISRO, DRDO, NITI Aayog, MyGov and other govt bodies.",
    color: "#d9e6f3",
  },
  {
    name: "Private Company Internships",
    slug: "private",
    description: "Internships at established companies and MNCs.",
    color: "#f8e2c6",
  },
  {
    name: "Startup Internships",
    slug: "startup",
    description: "Fast-moving teams where you get real work early.",
    color: "#f6d8d2",
  },
  {
    name: "Research Internships",
    slug: "research",
    description: "IIT / NIT summer programs and research labs.",
    color: "#dbebd8",
  },
  {
    name: "Remote / Virtual Internships",
    slug: "remote",
    description: "Work from home, from any city.",
    color: "#f3ecc3",
  },
  {
    name: "NGO / Social Internships",
    slug: "ngo",
    description: "Work that helps communities and causes.",
    color: "#f1dbe5",
  },
];

export function findCategory(slug) {
  return CATEGORIES.find((c) => c.slug === slug);
}
