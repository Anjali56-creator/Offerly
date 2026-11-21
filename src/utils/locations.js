import { readJSON, writeJSON } from "./storage.js";

export const ANYWHERE = "Anywhere in India";
export const REMOTE = "Remote";
export const PAN_INDIA = "Pan-India";

export const STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Meghalaya",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export const CITIES = [
  "New Delhi",
  "Mumbai",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
  "Ahmedabad",
  "Kanpur",
  "Lucknow",
  "Patna",
  "Dehradun",
  "Thiruvananthapuram",
  "Noida",
  "Gurugram",
];

export function loadPreferences(email) {
  return readJSON("offerly-prefs-" + email, null);
}

export function savePreferences(email, locations) {
  writeJSON("offerly-prefs-" + email, locations);
}

// does this listing fit the places the user picked?
// Remote and Pan-India listings always fit.
export function matchesPreferences(listing, prefs) {
  if (!prefs || prefs.includes(ANYWHERE)) return true;
  if (listing.mode === "Remote") return true;
  if (listing.locations.includes(REMOTE) || listing.locations.includes(PAN_INDIA)) return true;
  return prefs.some((place) => listing.locations.includes(place) || listing.state.includes(place));
}
