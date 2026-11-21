import { Link, useParams } from "react-router-dom";
import { LISTINGS } from "../data/internships.js";
import { findCategory } from "../utils/categories.js";
import { formatDate } from "../utils/dates.js";
import DeadlineBadge from "../components/DeadlineBadge.jsx";
import ListingAddButton from "../components/ListingAddButton.jsx";

function ListingDetail() {
  const { id } = useParams();
  const listing = LISTINGS.find((l) => l.id === id);

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
  const stipendText =
    listing.stipend === "Unpaid" ? "Unpaid" : "₹" + listing.stipend.toLocaleString("en-IN") + "/month";

  return (
    <main className="page">
      <Link to={"/category/" + listing.category} className="back-link">
        ← {category.name}
      </Link>

      <article className="detail-card" style={{ borderTopColor: category.color }}>
        <h2 className="page-title">{listing.organisation}</h2>
        <p className="detail-role">{listing.role}</p>

        <p className="listing-desc">{listing.description}</p>

        <dl className="detail-list">
          <dt>Location</dt>
          <dd>
            {listing.location} ({listing.mode})
          </dd>
          <dt>Stipend</dt>
          <dd>{stipendText}</dd>
          <dt>Duration</dt>
          <dd>{listing.duration}</dd>
          <dt>Deadline</dt>
          <dd>
            {formatDate(listing.deadline)} <DeadlineBadge deadline={listing.deadline} />
          </dd>
          <dt>Skills</dt>
          <dd>
            <span className="skills">
              {listing.skills.map((skill) => (
                <span className="skill" key={skill}>
                  {skill}
                </span>
              ))}
            </span>
          </dd>
        </dl>

        <div className="detail-buttons">
          <ListingAddButton listing={listing} />
          <a className="btn btn-small btn-outline btn-link" href={listing.applyLink} target="_blank" rel="noreferrer">
            Apply ↗
          </a>
        </div>

        <p className="demo-note">
          Sample listing for demo — always check the official website for real openings and deadlines.
        </p>
      </article>
    </main>
  );
}

export default ListingDetail;
