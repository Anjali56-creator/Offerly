import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "../lib/api.js";

function useInternships(userId) {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) {
      setInternships([]);
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    apiRequest("/api/internships")
      .then((data) => {
        if (!cancelled) {
          setInternships(data.internships || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Could not load saved internships");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const addInternship = useCallback(async (data) => {
    const res = await apiRequest("/api/internships", {
      method: "POST",
      body: data,
    });
    const created = res.internship;
    setInternships((list) => {
      if (list.some((item) => item.id === created.id)) return list;
      return [...list, created];
    });
    return created.id;
  }, []);

  const updateInternship = useCallback(async (id, patch) => {
    const res = await apiRequest(`/api/internships/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: patch,
    });
    const updated = res.internship;
    setInternships((list) => list.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, []);

  const deleteInternship = useCallback(async (id) => {
    await apiRequest(`/api/internships/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    setInternships((list) => list.filter((item) => item.id !== id));
  }, []);

  return { internships, loading, error, addInternship, updateInternship, deleteInternship };
}

export default useInternships;
