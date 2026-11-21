import { useState, useEffect } from "react";
import { loadInternships, saveInternships, makeId } from "../utils/storage.js";

// keeps one user's internships in state and saves them to localStorage
function useInternships(email) {
  const [internships, setInternships] = useState(() => loadInternships(email));

  useEffect(() => {
    if (!email) return;
    saveInternships(email, internships);
  }, [email, internships]);

  // returns the new id, so the caller can undo the add
  function addInternship(data) {
    const id = makeId();
    setInternships((list) => [...list, { ...data, id }]);
    return id;
  }

  function updateInternship(id, data) {
    setInternships((list) => list.map((item) => (item.id === id ? { ...item, ...data } : item)));
  }

  function deleteInternship(id) {
    setInternships((list) => list.filter((item) => item.id !== id));
  }

  return { internships, addInternship, updateInternship, deleteInternship };
}

export default useInternships;
