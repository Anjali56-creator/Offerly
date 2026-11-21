import { useState, useMemo } from "react";
import { useMyInternships } from "../context/InternshipsContext.jsx";
import { CATEGORIES, STATUSES } from "../utils/categories.js";
import { daysLeft } from "../utils/dates.js";
import MyInternshipCard from "../components/MyInternshipCard.jsx";
import QuickAddModal from "../components/QuickAddModal.jsx";

// used for sorting: earliest deadline first, no deadline last
function sortKey(item) {
  return (item.deadline || "9999-12-31") + " " + (item.deadlineTime || "23:59");
}

function isDueThisWeek(item) {
  const days = daysLeft(item.deadline);
  return days !== null && days >= 0 && days <= 7;
}

function isPassed(item) {
  const days = daysLeft(item.deadline);
  return days !== null && days < 0;
}

function MyInternships() {
  const { internships, updateInternship, deleteInternship } = useMyInternships();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [hidePassed, setHidePassed] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    return internships
      .filter((item) => {
        const matchesSearch =
          !text ||
          item.company.toLowerCase().includes(text) ||
          item.role.toLowerCase().includes(text) ||
          (item.location || "").toLowerCase().includes(text);
        const matchesCategory = category === "All" || item.category === category;
        const matchesStatus = status === "All" || item.status === status;
        const matchesPriority = priority === "All" || (item.priority || "Medium") === priority;
        return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
      })
      .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  }, [internships, search, category, status, priority]);

  const dueThisWeek = filtered.filter(isDueThisWeek);
  const noDeadline = filtered.filter((item) => !item.deadline);
  const upcoming = filtered.filter((item) => item.deadline && !isDueThisWeek(item) && !isPassed(item));
  // most recently passed first
  const passed = filtered.filter(isPassed).reverse();

  function handleDelete(id) {
    if (window.confirm("Delete this internship?")) {
      deleteInternship(id);
    }
  }

  function handleStatusChange(id, newStatus) {
    updateInternship(id, { status: newStatus });
  }

  if (internships.length === 0) {
    return (
      <main className="page">
        <h2 className="page-title">My Internships</h2>
        <div className="empty">
          <h2>No internships added yet.</h2>
          <p>Add one with a deadline, or save a listing from a category.</p>
          <button className="btn" onClick={() => setQuickOpen(true)}>
            + Add Internship
          </button>
        </div>
        {quickOpen && <QuickAddModal onClose={() => setQuickOpen(false)} />}
      </main>
    );
  }

  const total = internships.length;
  const dueCount = internships.filter(isDueThisWeek).length;
  const appliedCount = internships.filter((item) => item.status === "Applied").length;
  const offerCount = internships.filter((item) => item.status === "Offer").length;

  const summary =
    total + (total === 1 ? " internship" : " internships") +
    " · " + dueCount + " due this week · " +
    appliedCount + " applied · " +
    offerCount + (offerCount === 1 ? " offer" : " offers");

  function renderCards(list) {
    return (
      <div className="grid">
        {list.map((item) => (
          <MyInternshipCard
            key={item.id}
            item={item}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  }

  const nothingToShow =
    dueThisWeek.length === 0 &&
    upcoming.length === 0 &&
    noDeadline.length === 0 &&
    (hidePassed || passed.length === 0);

  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <h2 className="page-title">My Internships</h2>
          <p className="summary-line">{summary}</p>
        </div>
        <button className="btn btn-big" onClick={() => setQuickOpen(true)}>
          + Add Internship
        </button>
      </div>

      <div className="filters-bar">
        <input
          className="search"
          type="search"
          placeholder="Search organisation, role or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <label className="filter-item">
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="All">All</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-item">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="All">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-item">
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="All">All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </label>

        <label className="filter-check">
          <input type="checkbox" checked={hidePassed} onChange={(e) => setHidePassed(e.target.checked)} />
          Hide passed deadlines
        </label>
      </div>

      {nothingToShow && <p className="empty-text">No internships match your filters.</p>}

      {dueThisWeek.length > 0 && (
        <section className="my-section">
          <h3 className="section-title">Due this week ({dueThisWeek.length})</h3>
          <p className="section-note">Deadline within the next 7 days. Don't wait!</p>
          {renderCards(dueThisWeek)}
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="my-section">
          <h3 className="section-title">Upcoming ({upcoming.length})</h3>
          {renderCards(upcoming)}
        </section>
      )}

      {noDeadline.length > 0 && (
        <section className="my-section">
          <h3 className="section-title">No fixed deadline ({noDeadline.length})</h3>
          <p className="section-note">Check the official page for dates.</p>
          {renderCards(noDeadline)}
        </section>
      )}

      {!hidePassed && passed.length > 0 && (
        <section className="my-section">
          <h3 className="section-title">Deadline passed ({passed.length})</h3>
          {renderCards(passed)}
        </section>
      )}

      {quickOpen && <QuickAddModal onClose={() => setQuickOpen(false)} />}
    </main>
  );
}

export default MyInternships;
