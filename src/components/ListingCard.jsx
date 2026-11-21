import { Link } from "react-router-dom";
import { daysLeft, deadlineText, formatDate } from "../utils/dates.js";
import ListingAddButton from "./ListingAddButton.jsx";

function ListingCard({ listing }) {
  const days = daysLeft(listing.deadline);
  const closed = days !== null && days < 0;
  const urgent = days !== null && days >= 0 && days <= 3;

  let deadlineClass = "deadline";
  if (closed) deadlineClass += " closed";
  else if (urgent) deadlineClass += " urgent";

  const stipendText =
    listing.stipend === "Unpaid" ? "Unpaid" : "₹" + listing.stipend.toLocaleString("en-IN") + "/month";

  return (
    <article className="card listing-card">
      <div className="card-top">
        <div>
          <h3 className="card-company">
            <Link to={"/listing/" + listing.id} className="title-link">
              {listing.organisation}
            </Link>
          </h3>
          <p className="card-role">{listing.role}</p>
        </div>
        <span className="mode-tag">{listing.mode}</span>
      </div>

      <p className="listing-desc">{listing.description}</p>

      <ul className="card-info">
        <li>{listing.location}</li>
        <li>{stipendText}</li>
        <li>{listing.duration}</li>
      </ul>

      <p className={deadlineClass}>
        <span className="deadline-text">{deadlineText(listing.deadline)}</span>
        <span className="deadline-date"> · {formatDate(listing.deadline)}</span>
      </p>

      <div className="skills">
        {listing.skills.map((skill) => (
          <span className="skill" key={skill}>
            {skill}
          </span>
        ))}
      </div>

      <div className="card-bottom">
        <a className="btn btn-small btn-outline btn-link" href={listing.applyLink} target="_blank" rel="noreferrer">
          Apply ↗
        </a>
        <ListingAddButton listing={listing} />
      </div>
    </article>
  );
}

export default ListingCard;
