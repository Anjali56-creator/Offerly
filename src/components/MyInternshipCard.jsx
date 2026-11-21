import { Link } from "react-router-dom";
import { STATUSES, findCategory } from "../utils/categories.js";
import { daysLeft, formatDate, formatTime } from "../utils/dates.js";
import DeadlineBadge from "./DeadlineBadge.jsx";

function stipendText(item) {
  if (item.unpaid) return "Unpaid";
  if (item.stipend) return "₹" + Number(item.stipend).toLocaleString("en-IN") + "/month";
  return "";
}

function MyInternshipCard({ item, onStatusChange, onDelete }) {
  const days = daysLeft(item.deadline);
  const passed = days !== null && days < 0;
  const dueSoon = days !== null && days >= 0 && days <= 7;

  const category = findCategory(item.category);
  const priority = item.priority || "Medium";
  const stipend = stipendText(item);

  let cardClass = "card my-card";
  if (passed) cardClass += " passed";
  else if (dueSoon) cardClass += " due-soon";

  return (
    <article className={cardClass}>
      <div className="card-top">
        <div>
          <h3 className="card-company">{item.company}</h3>
          <p className="card-role">{item.role}</p>
        </div>
        {category && (
          <span className="category-tag" style={{ background: category.color }}>
            {category.name.split(" ")[0]}
          </span>
        )}
      </div>

      <p className="my-deadline">
        {item.deadline ? (
          <>
            <span className="deadline-date-text">
              {formatDate(item.deadline)}
              {item.deadlineTime ? ", " + formatTime(item.deadlineTime) : ""}
            </span>
            <DeadlineBadge deadline={item.deadline} />
          </>
        ) : (
          <span className="deadline-date">No deadline</span>
        )}
      </p>

      <ul className="card-info">
        <li>
          <span className={"priority-dot priority-" + priority.toLowerCase()}></span>
          {priority} priority
        </li>
        {stipend && <li>{stipend}</li>}
        {item.location && (
          <li>
            {item.location}
            {item.mode ? " (" + item.mode + ")" : ""}
          </li>
        )}
        {item.duration && <li>{item.duration}</li>}
      </ul>

      {item.notes && <p className="notes">{item.notes}</p>}

      <div className="card-bottom">
        <select
          className="status-select"
          value={item.status}
          onChange={(e) => onStatusChange(item.id, e.target.value)}
          aria-label="Change status"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="card-buttons">
          {item.link && (
            <a href={item.link} target="_blank" rel="noreferrer" className="text-btn">
              Apply ↗
            </a>
          )}
          <Link to={"/edit-internship/" + item.id} className="text-btn">
            Edit
          </Link>
          <button className="text-btn danger" onClick={() => onDelete(item.id)}>
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default MyInternshipCard;
