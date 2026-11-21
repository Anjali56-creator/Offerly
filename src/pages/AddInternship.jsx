import { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMyInternships } from "../context/InternshipsContext.jsx";
import { CATEGORIES, STATUSES } from "../utils/categories.js";
import { todayString } from "../utils/dates.js";

const emptyForm = {
  company: "",
  role: "",
  category: "",
  deadline: "",
  deadlineTime: "23:59",
  location: "",
  mode: "On-site",
  stipend: "",
  unpaid: false,
  duration: "",
  link: "",
  status: "Wishlist",
  priority: "Medium",
  notes: "",
};

// used for both adding (/add-internship) and editing (/edit-internship/:id)
function AddInternship() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { internships, addInternship, updateInternship } = useMyInternships();

  const editing = id ? internships.find((item) => item.id === id) : null;
  const categoryFromUrl = searchParams.get("category") || "";
  const startingCategory = CATEGORIES.some((c) => c.slug === categoryFromUrl) ? categoryFromUrl : "";

  const [form, setForm] = useState(
    editing ? { ...emptyForm, ...editing } : { ...emptyForm, category: startingCategory }
  );
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [leaving, setLeaving] = useState(false);

  // show the "added" message for a moment, then go to My Internships
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(
      () => {
        setMessage("");
        if (leaving) navigate("/my-internships");
      },
      leaving ? 900 : 2200
    );
    return () => clearTimeout(timer);
  }, [message, leaving, navigate]);

  if (id && !editing) {
    return (
      <main className="page">
        <h2 className="page-title">Internship not found</h2>
        <p className="page-sub">
          <Link to="/my-internships">Back to My Internships</Link>
        </p>
      </main>
    );
  }

  const today = todayString();
  // when editing an old internship, its own (past) deadline is still allowed
  const minDate = editing && editing.deadline && editing.deadline < today ? editing.deadline : today;

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    const updated = { ...form, [name]: newValue };
    if (name === "unpaid" && checked) updated.stipend = "";
    setForm(updated);
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  }

  function validate() {
    const newErrors = {};

    if (!form.company.trim()) newErrors.company = "Organisation / company name is required";
    if (!form.role.trim()) newErrors.role = "Role / position is required";
    if (!form.category) newErrors.category = "Please choose a category";

    if (!form.deadline) {
      newErrors.deadline = "Application deadline is required";
    } else if (form.deadline < minDate) {
      newErrors.deadline = "Deadline cannot be a past date";
    }

    if (!form.unpaid && form.stipend !== "" && Number(form.stipend) < 0) {
      newErrors.stipend = "Stipend cannot be negative";
    }

    if (form.link.trim() && !/^https?:\/\//i.test(form.link.trim())) {
      newErrors.link = "Link must start with http:// or https://";
    }

    return newErrors;
  }

  function submit(addAnother) {
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const data = {
      company: form.company.trim(),
      role: form.role.trim(),
      category: form.category,
      deadline: form.deadline,
      deadlineTime: form.deadlineTime || "23:59",
      location: form.location.trim(),
      mode: form.mode,
      stipend: form.unpaid || form.stipend === "" ? "" : Number(form.stipend),
      unpaid: form.unpaid,
      duration: form.duration.trim(),
      link: form.link.trim(),
      status: form.status,
      priority: form.priority,
      notes: form.notes.trim(),
    };

    if (editing) {
      updateInternship(editing.id, data);
    } else {
      addInternship({ ...data, createdAt: new Date().toISOString(), source: "manual" });
    }

    if (addAnother) {
      setForm({ ...emptyForm, category: startingCategory });
      setLeaving(false);
      setMessage("Internship added ✓");
      window.scrollTo(0, 0);
    } else {
      setLeaving(true);
      setMessage(editing ? "Internship updated ✓" : "Internship added ✓");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    submit(false);
  }

  function handleCancel() {
    if (window.history.length > 1) navigate(-1);
    else navigate("/dashboard");
  }

  const saving = leaving && message !== "";

  return (
    <main className="form-page">
      <form className="form-card" onSubmit={handleSubmit} noValidate>
        <h2 className="form-title">{editing ? "Edit Internship" : "Add Internship"}</h2>

        {message && <p className="success-box">{message}</p>}

        <div className="form-grid">
          <label className="field">
            <span>Organisation / Company name *</span>
            <input name="company" value={form.company} onChange={handleChange} autoFocus />
            {errors.company && <small className="error">{errors.company}</small>}
          </label>

          <label className="field">
            <span>Role / Position *</span>
            <input name="role" value={form.role} onChange={handleChange} />
            {errors.role && <small className="error">{errors.role}</small>}
          </label>

          <label className="field full">
            <span>Category *</span>
            <select name="category" value={form.category} onChange={handleChange}>
              <option value="">Choose a category</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category && <small className="error">{errors.category}</small>}
          </label>

          <label className="field">
            <span>Application deadline *</span>
            <input name="deadline" type="date" min={minDate} value={form.deadline} onChange={handleChange} />
            {errors.deadline && <small className="error">{errors.deadline}</small>}
          </label>

          <label className="field">
            <span>Deadline time (optional)</span>
            <input name="deadlineTime" type="time" value={form.deadlineTime} onChange={handleChange} />
            <small className="hint">If left empty, 11:59 PM is used.</small>
          </label>

          <label className="field">
            <span>Location</span>
            <input name="location" value={form.location} onChange={handleChange} />
          </label>

          <label className="field">
            <span>Mode</span>
            <select name="mode" value={form.mode} onChange={handleChange}>
              <option value="On-site">On-site</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </label>

          <div className="field">
            <span>Stipend (₹ per month)</span>
            <input
              name="stipend"
              type="number"
              min="0"
              aria-label="Stipend per month"
              value={form.stipend}
              onChange={handleChange}
              disabled={form.unpaid}
            />
            <label className="unpaid-check">
              <input name="unpaid" type="checkbox" checked={form.unpaid} onChange={handleChange} />
              Unpaid
            </label>
            {errors.stipend && <small className="error">{errors.stipend}</small>}
          </div>

          <label className="field">
            <span>Duration</span>
            <input
              name="duration"
              placeholder="e.g. 2 months"
              value={form.duration}
              onChange={handleChange}
            />
          </label>

          <label className="field full">
            <span>Apply link</span>
            <input name="link" placeholder="https://" value={form.link} onChange={handleChange} />
            {errors.link && <small className="error">{errors.link}</small>}
          </label>

          <label className="field">
            <span>Status</span>
            <select name="status" value={form.status} onChange={handleChange}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Priority</span>
            <select name="priority" value={form.priority} onChange={handleChange}>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>

          <label className="field full">
            <span>Notes</span>
            <textarea
              name="notes"
              rows="3"
              placeholder="Documents needed, HR contact, etc."
              value={form.notes}
              onChange={handleChange}
            />
          </label>
        </div>

        <div className="form-buttons">
          <button type="button" className="btn btn-outline" onClick={handleCancel}>
            Cancel
          </button>
          {!editing && (
            <button type="button" className="btn btn-outline" onClick={() => submit(true)} disabled={saving}>
              Save &amp; add another
            </button>
          )}
          <button type="submit" className="btn" disabled={saving}>
            {editing ? "Update" : "Save Internship"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default AddInternship;
