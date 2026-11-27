import bcrypt from "bcryptjs";

export const DEMO_USERS = [
  {
    name: "Offerly Admin",
    email: (process.env.DEMO_ADMIN_EMAIL || "admin@offerly.in").trim().toLowerCase(),
    college: "ABESEC Ghaziabad",
    password: process.env.DEMO_ADMIN_PASSWORD || "Admin@123",
    role: "admin",
    preferredLocations: ["Anywhere in India"],
  },
  {
    name: "Demo Student",
    email: (process.env.DEMO_STUDENT_EMAIL || "student@offerly.in").trim().toLowerCase(),
    college: "ABESEC Ghaziabad",
    password: process.env.DEMO_STUDENT_PASSWORD || "Student@123",
    role: "student",
    preferredLocations: ["Anywhere in India"],
  },
];

export async function seedDemoUsers(store) {
  for (const demo of DEMO_USERS) {
    const existing = await store.getUserByEmail(demo.email);
    if (!existing) {
      const passwordHash = await bcrypt.hash(demo.password, 10);
      const created = await store.createUser({
        name: demo.name,
        email: demo.email,
        college: demo.college,
        passwordHash,
        role: demo.role,
      });
      await store.updateUserPreferences(created.id, demo.preferredLocations);
    } else if (existing.role !== demo.role) {
      await store.updateUserRole(existing.id, demo.role);
    }
  }
}
