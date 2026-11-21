import { useState } from "react";
import { Link } from "react-router-dom";
import { useMyInternships } from "../context/InternshipsContext.jsx";
import { CATEGORIES } from "../utils/categories.js";
import { daysLeft } from "../utils/dates.js";
import CategoryCard from "../components/CategoryCard.jsx";
import QuickAddModal from "../components/QuickAddModal.jsx";

function Dashboard() {
  const { internships } = useMyInternships();
  const [quickOpen, setQuickOpen] = useState(false);

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
          <p className="page-sub">{internships.length} saved in total. Pick a category to see them.</p>
        </div>
        <button className="btn btn-big" onClick={() => setQuickOpen(true)}>
          + Add Internship
        </button>
      </div>

      <div className="category-grid">
        {CATEGORIES.map((category) => (
          <CategoryCard
            key={category.slug}
            category={category}
            count={internships.filter((item) => item.category === category.slug).length}
          />
        ))}
      </div>

      {quickOpen && <QuickAddModal onClose={() => setQuickOpen(false)} />}
    </main>
  );
}

export default Dashboard;
