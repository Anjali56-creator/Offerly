import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ANYWHERE, REMOTE, STATES, CITIES } from "../utils/locations.js";

function Preferences() {
  const { user, savePreferences } = useAuth();
  const navigate = useNavigate();

  const saved = user?.preferredLocations ?? null;
  const isFirstTime = saved === null;

  const [selected, setSelected] = useState(saved || []);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function toggle(place) {
    setError("");
    if (place === ANYWHERE) {
      setSelected(selected.includes(ANYWHERE) ? [] : [ANYWHERE]);
      return;
    }
    // picking a place switches "Anywhere in India" off
    const withoutAnywhere = selected.filter((p) => p !== ANYWHERE);
    if (withoutAnywhere.includes(place)) {
      setSelected(withoutAnywhere.filter((p) => p !== place));
    } else {
      setSelected([...withoutAnywhere, place]);
    }
  }

  async function handleSave() {
    if (selected.length === 0) {
      setError("Please pick at least one place");
      return;
    }
    setSaving(true);
    try {
      await savePreferences(selected);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Could not save preferences");
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    setSaving(true);
    try {
      await savePreferences([ANYWHERE]);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Could not save preferences");
    } finally {
      setSaving(false);
    }
  }

  function renderChip(place) {
    const on = selected.includes(place);
    return (
      <button
        type="button"
        key={place}
        className={on ? "chip active" : "chip"}
        aria-pressed={on}
        onClick={() => toggle(place)}
      >
        {place}
      </button>
    );
  }

  return (
    <main className="form-page">
      <div className="form-card">
        <h2 className="form-title">Where do you want to intern?</h2>
        <p className="page-sub">
          Pick as many as you like. Remote and Pan-India internships are always shown.
        </p>

        {error && <p className="form-error pref-error">{error}</p>}

        <h3 className="pref-heading">Quick picks</h3>
        <div className="chips">
          {renderChip(ANYWHERE)}
          {renderChip(REMOTE)}
        </div>

        <h3 className="pref-heading">Cities</h3>
        <div className="chips">{CITIES.map(renderChip)}</div>

        <h3 className="pref-heading">States</h3>
        <div className="chips">{STATES.map(renderChip)}</div>

        <div className="form-buttons">
          {isFirstTime ? (
            <button type="button" className="btn btn-outline" onClick={handleSkip} disabled={saving}>
              Skip (anywhere in India)
            </button>
          ) : (
            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)} disabled={saving}>
              Cancel
            </button>
          )}
          <button type="button" className="btn" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default Preferences;
