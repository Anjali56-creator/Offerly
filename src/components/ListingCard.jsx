import { Link } from "react-router-dom";
import { daysLeft, deadlineText, formatDate } from "../utils/dates.js";
import { effectiveStatus, statusClass } from "../utils/listings.js";
import ListingAddButton from "./ListingAddButton.jsx";

function ListingCard({ listing }) {
  const status = effectiveStatus(listing);
  const days = listing.deadline ? daysLeft(listing.deadline) : null;
  const urgent = days !== null && days >= 0 && days <= 3;

  return (
    <article className="card listing-card">
      <div className="card-top">
        <div>
          <h3 className="card-company">
            <Link to={"/listing/" + listing.id} className="title-link">
              {listing.organisation}
            </Link>
          </h3>
          <p className="card-role">{listing.programName}</p>
        </div>
        <span className={"app-status " + statusClass(status)}>{status}</span>
      </div>

      <p className="listing-desc">{listing.description}</p>

      <ul className="card-info">
        <li>{listing.locations.join(", ")}</li>
        <li>{listing.mode}</li>
        <li>{listing.stipend}</li>
        <li>{listing.duration}</li>
      </ul>

      <p className="eligibility-line" title={listing.eligibility}>
        Eligibility: {listing.eligibility}
      </p>

      {listing.deadline ? (
        <p className={urgent ? "deadline urgent" : "deadline"}>
          <span className="deadline-text">{deadlineText(listing.deadline)}</span>
          <span className="deadline-date"> · {formatDate(listing.deadline)}</span>
        </p>
      ) : (
        <p className="deadline">
          <span className="deadline-date">{listing.applicationWindow || "Check the official page for dates"}</span>
        </p>
      )}

      <div className="card-bottom">
        <a className="btn btn-small btn-outline btn-link" href={listing.applyLink} target="_blank" rel="noreferrer">
          Apply ↗
        </a>
        <ListingAddButton listing={listing} />
      </div>

      <p className="source-line">
        Official source: {listing.sourceName} · verified {formatDate(listing.lastVerified)}
      </p>
    </article>
  );
}

export default ListingCard;
