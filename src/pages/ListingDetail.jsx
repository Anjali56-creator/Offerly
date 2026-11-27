import { Link, useParams } from "react-router-dom";
import { useListings } from "../context/ListingsContext.jsx";
import { findCategory } from "../utils/categories.js";
import { formatDate } from "../utils/dates.js";
import { effectiveStatus, statusClass } from "../utils/listings.js";
import DeadlineBadge from "../components/DeadlineBadge.jsx";
import ListingAddButton from "../components/ListingAddButton.jsx";

function ListingDetail() {
  const { id } = useParams();
  const { listings, loading } = useListings();
  const listing = listings.find((l) => l.id === id);

  if (loading && !listing) {
    return (
      <main className="page">
        <p className="page-sub">Loading listing...</p>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="page">
        <h2 className="page-title">Internship not found</h2>
        <p className="page-sub">
          <Link to="/dashboard">Back to dashboard</Link>
        </p>
      </main>
    );
  }

  const category = findCategory(listing.category);
  const status = effectiveStatus(listing);

  return (
    <main className="page">
      <Link to={"/category/" + listing.category} className="back-link">
        ← {category.name}
      </Link>

      <article className="detail-card" style={{ borderTopColor: category.color }}>
        <div className="card-top">
          <div>
            <h2 className="page-title">{listing.organisation}</h2>
            <p className="detail-role">{listing.programName}</p>
          </div>
          <span className={"app-status " + statusClass(status)}>{status}</span>
        </div>

        <p className="listing-desc">{listing.description}</p>

        <dl className="detail-list">
          <dt>Role</dt>
          <dd>{listing.role}</dd>
          <dt>Location</dt>
          <dd>
            {listing.locations.join(", ")}
            {listing.state.length > 0 ? " (" + listing.state.join(", ") + ")" : ""} · {listing.mode}
          </dd>
          <dt>Stipend</dt>
          <dd>{listing.stipend}</dd>
          <dt>Duration</dt>
          <dd>{listing.duration}</dd>
          <dt>Eligibility</dt>
          <dd>{listing.eligibility}</dd>
          <dt>Deadline</dt>
          <dd>
            {listing.deadline ? (
              <>
                {formatDate(listing.deadline)} <DeadlineBadge deadline={listing.deadline} />
              </>
            ) : (
              listing.applicationWindow || "No fixed date. Check the official page."
            )}
          </dd>
          <dt>Source</dt>
          <dd>
            {listing.sourceName} · verified {formatDate(listing.lastVerified)}
          </dd>
        </dl>

        <div className="detail-buttons">
          <ListingAddButton listing={listing} />
          <a className="btn btn-small btn-outline btn-link" href={listing.applyLink} target="_blank" rel="noreferrer">
            Apply ↗
          </a>
        </div>

        <p className="demo-note">
          Links go to official websites. Dates can change, so always confirm on the official page before applying.
        </p>
      </article>
    </main>
  );
}

export default ListingDetail;
