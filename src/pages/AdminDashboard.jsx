import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useListings } from "../context/ListingsContext.jsx";
import { apiRequest } from "../lib/api.js";
import { CATEGORIES } from "../utils/categories.js";

const APP_STATUSES = ["Open now", "Opens soon", "Rolling", "Check site", "Closed"];

const emptyListing = {
  category: "government",
  organisation: "",
  programName: "",
  role: "",
  locations: "Pan-India",
  state: "",
  mode: "On-site",
  stipend: "",
  duration: "",
  eligibility: "",
  applicationStatus: "Open now",
  deadline: "",
  applicationWindow: "",
  applyLink: "",
  sourceName: "",
  description: "",
};

function AdminDashboard() {
  const { user } = useAuth();
  const { listings, refreshListings } = useListings();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyListing);
  const [saving, setSaving] = useState(false);

  async function loadOverview() {
    setLoading(true);
    try {
      const data = await apiRequest("/api/admin/overview");
      setOverview(data);
    } catch (err) {
      setError(err.message || "Failed to load admin overview");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === "admin") {
      loadOverview();
    }
  }, [user?.role]);

  if (user && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleCreateListing(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await apiRequest("/api/admin/listings", {
        method: "POST",
        body: form,
      });
      setForm(emptyListing);
      setMessage("Listing added ✓");
      await Promise.all([refreshListings(), loadOverview()]);
    } catch (err) {
      setError(err.message || "Could not create listing");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusUpdate(id, applicationStatus) {
    setError("");
    try {
      await apiRequest(`/api/admin/listings/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: { applicationStatus },
      });
      await refreshListings();
    } catch (err) {
      setError(err.message || "Could not update status");
    }
  }

  async function handleDeleteListing(id) {
    if (!window.confirm("Delete this official listing?")) return;
    setError("");
    try {
      await apiRequest(`/api/admin/listings/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await Promise.all([refreshListings(), loadOverview()]);
    } catch (err) {
      setError(err.message || "Could not delete listing");
    }
  }

  return (
    <main className="page">
      <Link to="/dashboard" className="back-link">
        ← Back to dashboard
      </Link>

      <div className="page-heading">
        <div>
          <h2 className="page-title">Admin Panel</h2>
          <p className="page-sub">Manage official internship listings and monitor platform activity.</p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
      {message && <p className="success-box">{message}</p>}

      {loading ? (
        <p className="page-sub">Loading admin data...</p>
      ) : (
        overview && (
          <div className="admin-stats">
            <div className="card">
              <p className="card-role">Registered Users</p>
              <h3 className="page-title">{overview.stats.users}</h3>
            </div>
            <div className="card">
              <p className="card-role">Official Listings</p>
              <h3 className="page-title">{overview.stats.listings}</h3>
            </div>
            <div className="card">
              <p className="card-role">Total Saved by Students</p>
              <h3 className="page-title">{overview.stats.savedInternships}</h3>
            </div>
          </div>
        )
      )}

      <section className="my-section">
        <h3 className="section-title">Add official listing</h3>
        <form className="form-card admin-form" onSubmit={handleCreateListing} noValidate>
          <div className="form-grid">
            <label className="field">
              <span>Category *</span>
              <select name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Organisation *</span>
              <input name="organisation" value={form.organisation} onChange={handleChange} />
            </label>

            <label className="field">
              <span>Program name *</span>
              <input name="programName" value={form.programName} onChange={handleChange} />
            </label>

            <label className="field">
              <span>Role *</span>
              <input name="role" value={form.role} onChange={handleChange} />
            </label>

            <label className="field">
              <span>Locations (comma separated)</span>
              <input name="locations" value={form.locations} onChange={handleChange} />
            </label>

            <label className="field">
              <span>States (comma separated)</span>
              <input name="state" value={form.state} onChange={handleChange} />
            </label>

            <label className="field">
              <span>Mode</span>
              <select name="mode" value={form.mode} onChange={handleChange}>
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </label>

            <label className="field">
              <span>Application status</span>
              <select name="applicationStatus" value={form.applicationStatus} onChange={handleChange}>
                {APP_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Stipend</span>
              <input name="stipend" placeholder="e.g. ₹15,000/month or Unpaid" value={form.stipend} onChange={handleChange} />
            </label>

            <label className="field">
              <span>Duration</span>
              <input name="duration" placeholder="e.g. 8 weeks" value={form.duration} onChange={handleChange} />
            </label>

            <label className="field">
              <span>Deadline</span>
              <input name="deadline" type="date" value={form.deadline} onChange={handleChange} />
            </label>

            <label className="field">
              <span>Official apply link *</span>
              <input name="applyLink" placeholder="https://..." value={form.applyLink} onChange={handleChange} />
            </label>

            <label className="field full">
              <span>Eligibility</span>
              <input name="eligibility" value={form.eligibility} onChange={handleChange} />
            </label>

            <label className="field full">
              <span>Description</span>
              <textarea name="description" rows="2" value={form.description} onChange={handleChange} />
            </label>
          </div>

          <div className="form-buttons">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "Adding..." : "Publish Listing"}
            </button>
          </div>
        </form>
      </section>

      <section className="my-section">
        <h3 className="section-title">Manage listings ({listings.length})</h3>
        <div className="admin-list">
          {listings.map((item) => (
            <div key={item.id} className="card admin-row">
              <div>
                <strong>{item.organisation}</strong> — {item.programName}
                <div className="source-line">
                  {item.category} · {item.mode} · {item.locations.join(", ")}
                </div>
              </div>
              <div className="admin-row-actions">
                <select
                  className="status-select"
                  value={item.applicationStatus}
                  onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                  aria-label={`Status for ${item.organisation}`}
                >
                  {APP_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button className="text-btn danger" onClick={() => handleDeleteListing(item.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {overview?.users && (
        <section className="my-section">
          <h3 className="section-title">Registered users ({overview.users.length})</h3>
          <div className="admin-list">
            {overview.users.map((u) => (
              <div key={u.id} className="card admin-row">
                <div>
                  <strong>{u.name}</strong> ({u.email})
                  <div className="source-line">{u.college}</div>
                </div>
                <span className="app-status status-rolling">{u.role}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default AdminDashboard;
