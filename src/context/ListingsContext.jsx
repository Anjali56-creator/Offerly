import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { apiRequest } from "../lib/api.js";

const ListingsContext = createContext({
  listings: [],
  loading: false,
  error: "",
  refreshListings: async () => {},
});

export function ListingsProvider({ children }) {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshListings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/listings");
      setListings(data.listings || []);
    } catch (err) {
      setError(err.message || "Could not load listings");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      setListings([]);
      setLoading(false);
      setError("");
      return;
    }

    refreshListings();
  }, [user?.id, refreshListings]);

  return (
    <ListingsContext.Provider value={{ listings, loading, error, refreshListings }}>
      {children}
    </ListingsContext.Provider>
  );
}

export function useListings() {
  return useContext(ListingsContext);
}
