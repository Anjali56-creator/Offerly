import { useMyInternships } from "../context/InternshipsContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { listingToInternship } from "../utils/listings.js";

// "+ Add" adds the listing in one click, "✓ Added" removes it again
function ListingAddButton({ listing }) {
  const { internships, addInternship, deleteInternship } = useMyInternships();
  const { showToast } = useToast();

  const added = internships.find((item) => item.listingId === listing.id);

  function handleClick() {
    if (added) {
      if (window.confirm("Remove from My Internships?")) {
        deleteInternship(added.id);
      }
      return;
    }

    const newId = addInternship(listingToInternship(listing));
    showToast("Added to My Internships", () => deleteInternship(newId));
  }

  return (
    <button className={added ? "btn btn-small btn-added" : "btn btn-small"} onClick={handleClick}>
      {added ? "✓ Added" : "+ Add"}
    </button>
  );
}

export default ListingAddButton;
