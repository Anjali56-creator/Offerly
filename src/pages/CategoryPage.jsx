import { useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMyInternships } from "../context/InternshipsContext.jsx";
import { findCategory } from "../utils/categories.js";
import { LISTINGS } from "../data/internships.js";
import InternshipCard from "../components/InternshipCard.jsx";
import ListingCard from "../components/ListingCard.jsx";
import QuickAddModal from "../components/QuickAddModal.jsx";

function CategoryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { internships, deleteInternship } = useMyInternships();
  const [quickOpen, setQuickOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("All");
  const [paidOnly, setPaidOnly] = useState(false);
  const [sortBy, setSortBy] = useState("deadline");

  const category = findCategory(slug);

  const categoryListings = useMemo(() => LISTINGS.filter((l) => l.category === slug), [slug]);

  const visibleListings = useMemo(() => {
    const text = search.trim().toLowerCase();
    return categoryListings
      .filter((l) => {
        const matchesSearch =
          !text ||
          l.organisation.toLowerCase().includes(text) ||
          l.role.toLowerCase().includes(text) ||
          l.skills.some((skill) => skill.toLowerCase().includes(text));
        const matchesMode = mode === "All" || l.mode === mode;
        const matchesPaid = !paidOnly || l.stipend !== "Unpaid";
        return matchesSearch && matchesMode && matchesPaid;
      })
      .sort((a, b) => {
        if (sortBy === "stipend") {
          const stipendA = a.stipend === "Unpaid" ? 0 : a.stipend;
          const stipendB = b.stipend === "Unpaid" ? 0 : b.stipend;
          return stipendB - stipendA;
        }
        return a.deadline.localeCompare(b.deadline);
      });
  }, [categoryListings, search, mode, paidOnly, sortBy]);

  if (!category) {
    return (
      <main className="page">
        <h2 className="page-title">Category not found</h2>
        <p className="page-sub">
          <Link to="/dashboard">Back to dashboard</Link>
        </p>
      </main>
    );
  }

  const myItems = internships.filter((item) => item.category === slug);

  function handleDelete(id) {
    if (window.confirm("Delete this internship?")) {
      deleteInternship(id);
    }
  }

  return (
    <main className="page">
      <Link to="/dashboard" className="back-link">
        ← All categories
      </Link>

      <div className="page-heading">
        <div>
          <h2 className="page-title">
            {category.name} <span className="title-count">({categoryListings.length} listings)</span>
          </h2>
          <p className="page-sub">{category.description}</p>
        </div>
        <button className="btn btn-big" onClick={() => setQuickOpen(true)}>
          + Add Internship
        </button>
      </div>

      <p className="demo-note">
        Sample listings for demo — always check the official website for real openings and deadlines.
      </p>

      {myItems.length > 0 && (
        <section className="my-section">
          <h3 className="section-title">Your saved ({myItems.length})</h3>
          <div className="grid">
            {myItems.map((item) => (
              <InternshipCard
                key={item.id}
                item={item}
                onEdit={() => navigate("/edit-internship/" + item.id)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="section-title">Browse listings</h3>

        <div className="filters-bar">
          <input
            className="search"
            type="search"
            placeholder="Search organisation, role or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <label className="filter-item">
            Mode
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="All">All</option>
              <option value="On-site">On-site</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </label>

          <label className="filter-item">
            Sort by
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="deadline">Nearest deadline</option>
              <option value="stipend">Highest stipend</option>
            </select>
          </label>

          <label className="filter-check">
            <input type="checkbox" checked={paidOnly} onChange={(e) => setPaidOnly(e.target.checked)} />
            Paid only
          </label>
        </div>

        {visibleListings.length === 0 ? (
          <p className="empty-text">No listings match your search.</p>
        ) : (
          <div className="grid">
            {visibleListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {quickOpen && <QuickAddModal defaultCategory={slug} onClose={() => setQuickOpen(false)} />}
    </main>
  );
}

export default CategoryPage;
