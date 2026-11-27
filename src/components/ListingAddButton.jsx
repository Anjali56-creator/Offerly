import { useState } from "react";
import { useMyInternships } from "../context/InternshipsContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { listingToInternship } from "../utils/listings.js";

// "+ Add" adds the listing in one click, "✓ Added" removes it again
function ListingAddButton({ listing }) {
  const { internships, addInternship, deleteInternship } = useMyInternships();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  const added = internships.find((item) => item.listingId === listing.id);

  async function handleClick() {
    if (busy) return;
    if (added) {
      if (window.confirm("Remove from My Internships?")) {
        setBusy(true);
        try {
          await deleteInternship(added.id);
        } finally {
          setBusy(false);
        }
      }
      return;
    }

    setBusy(true);
    try {
      const newId = await addInternship(listingToInternship(listing));
      showToast("Added to My Internships", () => deleteInternship(newId));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      className={added ? "btn btn-small btn-added" : "btn btn-small"}
      onClick={handleClick}
      disabled={busy}
    >
      {added ? "✓ Added" : "+ Add"}
    </button>
  );
}

export default ListingAddButton;
