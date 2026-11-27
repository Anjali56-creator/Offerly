import { createContext, useContext } from "react";
import { useAuth } from "./AuthContext.jsx";
import useInternships from "../hooks/useInternships.js";

// one shared list, so the header count and every page always match
const InternshipsContext = createContext(null);

function InternshipsInner({ userId, children }) {
  const value = useInternships(userId);
  return <InternshipsContext.Provider value={value}>{children}</InternshipsContext.Provider>;
}

export function InternshipsProvider({ children }) {
  const { user } = useAuth();
  const userId = user ? user.id : "";

  // the key reloads the list when a different user logs in
  return (
    <InternshipsInner key={userId} userId={userId}>
      {children}
    </InternshipsInner>
  );
}

export function useMyInternships() {
  return useContext(InternshipsContext);
}
