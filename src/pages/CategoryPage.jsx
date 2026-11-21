import { useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useMyInternships } from "../context/InternshipsContext.jsx";
import { findCategory } from "../utils/categories.js";
import { loadPreferences, matchesPreferences, REMOTE, PAN_INDIA } from "../utils/locations.js";
import { compareListings } from "../utils/listings.js";
import { LISTINGS } from "../data/internships.js";
import InternshipCard from "../components/InternshipCard.jsx";
import ListingCard from "../components/ListingCard.jsx";
import QuickAddModal from "../components/QuickAddModal.jsx";

function CategoryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { internships, deleteInternship } = useMyInternships();
  const [quickOpen, setQuickOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("All");
  const [place, setPlace] = useState("All");
  const [paidOnly, setPaidOnly] = useState(false);
  const [myLocationsOn, setMyLocationsOn] = useState(true);

  const prefs = useMemo(() => loadPreferences(user.email), [user.email]);
  const category = findCategory(slug);

  const categoryListings = useMemo(() => LISTINGS.filter((l) => l.category === slug), [slug]);

  // cities and states that appear in this category, for the dropdown
  const placeOptions = useMemo(() => {
    const places = new Set();
    categoryListings.forEach((l) => {
      l.locations.forEach((p) => places.add(p));
      l.state.forEach((p) => places.add(p));
    });
    places.delete(REMOTE);
    places.delete(PAN_INDIA);
    return [...places].sort();
  }, [categoryListings]);

  const visibleListings = useMemo(() => {
    const text = search.trim().toLowerCase();
    return categoryListings
      .filter((l) => {
        const matchesSearch =
          !text ||
          l.organisation.toLowerCase().includes(text) ||
          l.programName.toLowerCase().includes(text) ||
          l.role.toLowerCase().includes(text) ||
          l.locations.some((p) => p.toLowerCase().includes(text));
        const matchesMode = mode === "All" || l.mode === mode;
        const matchesPlace = place === "All" || l.locations.includes(place) || l.state.includes(place);
        const matchesPaid = !paidOnly || /[₹$]/.test(l.stipend);
        const matchesMine = !myLocationsOn || matchesPreferences(l, prefs);
        return matchesSearch && matchesMode && matchesPlace && matchesPaid && matchesMine;
      })
      .sort(compareListings);
  }, [categoryListings, search, mode, place, paidOnly, myLocationsOn, prefs]);

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
        Links go to official websites. Dates can change, so always confirm on the official page before applying.
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
            placeholder="Search organisation, program, role or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <label className="filter-item">
            City / state
            <select value={place} onChange={(e) => setPlace(e.target.value)}>
              <option value="All">All places</option>
              {placeOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-item">
            Mode
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="All">All</option>
              <option value="On-site">On-site</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </label>

          <label className="filter-check">
            <input type="checkbox" checked={paidOnly} onChange={(e) => setPaidOnly(e.target.checked)} />
            Paid only
          </label>

          <button
            type="button"
            className={myLocationsOn ? "chip active" : "chip"}
            aria-pressed={myLocationsOn}
            onClick={() => setMyLocationsOn(!myLocationsOn)}
          >
            📍 My locations
          </button>
          <Link to="/preferences" className="pref-link">
            change
          </Link>
        </div>

        {categoryListings.length === 0 ? (
          <p className="empty-text">No verified listings in this category yet.</p>
        ) : visibleListings.length === 0 ? (
          <p className="empty-text">No listings match. Try turning off "My locations".</p>
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
