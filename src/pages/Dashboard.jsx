import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useListings } from "../context/ListingsContext.jsx";
import { useMyInternships } from "../context/InternshipsContext.jsx";
import { CATEGORIES } from "../utils/categories.js";
import { daysLeft } from "../utils/dates.js";
import { matchesPreferences } from "../utils/locations.js";
import CategoryCard from "../components/CategoryCard.jsx";
import QuickAddModal from "../components/QuickAddModal.jsx";

function Dashboard() {
  const { user } = useAuth();
  const { listings, loading: listingsLoading } = useListings();
  const { internships } = useMyInternships();
  const [quickOpen, setQuickOpen] = useState(false);

  const prefs = user?.preferredLocations ?? null;

  // first time: ask where the student wants to intern
  if (prefs === null) {
    return <Navigate to="/preferences" replace />;
  }

  // Wishlist internships whose deadline is in the next 3 days
  const urgentCount = internships.filter((item) => {
    const days = daysLeft(item.deadline);
    return item.status === "Wishlist" && days !== null && days >= 0 && days <= 3;
  }).length;

  return (
    <main className="page">
      {urgentCount > 0 && (
        <div className="reminder">
          Heads up: {urgentCount} {urgentCount === 1 ? "deadline" : "deadlines"} in the next 3 days →{" "}
          <Link to="/my-internships">View</Link>
        </div>
      )}

      <div className="page-heading">
        <div>
          <h2 className="page-title">Internship categories</h2>
          <p className="page-sub">
            {listingsLoading
              ? "Loading listings..."
              : `${internships.length} saved in total. Pick a category to see them.`}
          </p>
        </div>
        <button className="btn btn-big" onClick={() => setQuickOpen(true)}>
          + Add Internship
        </button>
      </div>

      <div className="category-grid">
        {CATEGORIES.map((category) => {
          const inCategory = listings.filter((l) => l.category === category.slug);
          return (
            <CategoryCard
              key={category.slug}
              category={category}
              count={internships.filter((item) => item.category === category.slug).length}
              nearCount={inCategory.filter((l) => matchesPreferences(l, prefs)).length}
              totalCount={inCategory.length}
            />
          );
        })}
      </div>

      {quickOpen && <QuickAddModal onClose={() => setQuickOpen(false)} />}
    </main>
  );
}

export default Dashboard;
