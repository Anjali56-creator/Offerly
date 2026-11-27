import { useState, useEffect } from "react";
import { useMyInternships } from "../context/InternshipsContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { CATEGORIES } from "../utils/categories.js";
import { todayString } from "../utils/dates.js";

const emptyForm = {
  company: "",
  role: "",
  deadline: "",
  category: "",
  location: "",
  mode: "On-site",
  stipend: "",
  link: "",
  notes: "",
};

function QuickAddModal({ defaultCategory, onClose }) {
  const { addInternship, deleteInternship } = useMyInternships();
  const { showToast } = useToast();
  const [form, setForm] = useState({ ...emptyForm, category: defaultCategory || "" });
  const [errors, setErrors] = useState({});
  const [showMore, setShowMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};

    if (!form.company.trim()) newErrors.company = "Company is required";
    if (!form.role.trim()) newErrors.role = "Role is required";
    if (!form.deadline) newErrors.deadline = "Deadline is required";
    else if (form.deadline < todayString()) newErrors.deadline = "Deadline cannot be in the past";
    if (!form.category) newErrors.category = "Choose a category";
    if (form.stipend !== "" && Number(form.stipend) < 0) newErrors.stipend = "Stipend cannot be negative";
    if (form.link.trim() && !/^https?:\/\//i.test(form.link.trim())) {
      newErrors.link = "Link must start with http:// or https://";
      setShowMore(true);
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      const newId = await addInternship({
        source: "manual",
        company: form.company.trim(),
        role: form.role.trim(),
        category: form.category,
        deadline: form.deadline,
        deadlineTime: "23:59",
        location: form.location.trim(),
        mode: form.mode,
        stipend: form.stipend === "" ? "" : Number(form.stipend),
        unpaid: false,
        duration: "",
        link: form.link.trim(),
        status: "Wishlist",
        priority: "Medium",
        notes: form.notes.trim(),
      });

      onClose();
      showToast("Added to My Internships", () => deleteInternship(newId));
    } catch (err) {
      setErrors({ form: err.message || "Could not add internship" });
      setSubmitting(false);
    }
  }

  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="modal" onSubmit={handleSubmit} noValidate>
        <h2 className="modal-title">Quick add</h2>

        {errors.form && <p className="form-error">{errors.form}</p>}

        <div className="quick-row">
          <label className="field">
            <span>Company *</span>
            <input name="company" value={form.company} onChange={handleChange} autoFocus />
            {errors.company && <small className="error">{errors.company}</small>}
          </label>

          <label className="field">
            <span>Role *</span>
            <input name="role" value={form.role} onChange={handleChange} />
            {errors.role && <small className="error">{errors.role}</small>}
          </label>

          <label className="field">
            <span>Deadline *</span>
            <input
              name="deadline"
              type="date"
              min={todayString()}
              value={form.deadline}
              onChange={handleChange}
            />
            {errors.deadline && <small className="error">{errors.deadline}</small>}
          </label>
        </div>

        {!defaultCategory && (
          <label className="field quick-category">
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
        )}

        <button type="button" className="text-btn more-link" onClick={() => setShowMore(!showMore)}>
          {showMore ? "− fewer details" : "+ more details (optional)"}
        </button>

        {showMore && (
          <div className="form-grid more-fields">
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

            <label className="field">
              <span>Stipend (₹/month)</span>
              <input name="stipend" type="number" min="0" value={form.stipend} onChange={handleChange} />
              {errors.stipend && <small className="error">{errors.stipend}</small>}
            </label>

            <label className="field">
              <span>Apply link</span>
              <input name="link" placeholder="https://" value={form.link} onChange={handleChange} />
              {errors.link && <small className="error">{errors.link}</small>}
            </label>

            <label className="field full">
              <span>Notes</span>
              <textarea name="notes" rows="2" value={form.notes} onChange={handleChange} />
            </label>
          </div>
        )}

        <div className="modal-buttons">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? "Adding..." : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default QuickAddModal;
