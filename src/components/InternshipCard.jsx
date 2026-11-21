function formatDate(deadline) {
  const [year, month, day] = deadline.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function InternshipCard({ item, onEdit, onDelete }) {
  return (
    <article className="card">
      <div className="card-top">
        <div>
          <h3 className="card-company">{item.company}</h3>
          <p className="card-role">{item.role}</p>
        </div>
        <span className={"tag tag-" + item.status.toLowerCase()}>{item.status}</span>
      </div>

      <ul className="card-info">
        {item.location && <li>{item.location}</li>}
        {item.stipend ? <li>₹{Number(item.stipend).toLocaleString("en-IN")}/month</li> : null}
        {item.deadline && <li>Deadline: {formatDate(item.deadline)}</li>}
      </ul>

      {item.notes && <p className="notes">{item.notes}</p>}

      <div className="card-bottom">
        {item.link ? (
          <a href={item.link} target="_blank" rel="noreferrer">
            Apply link
          </a>
        ) : (
          <span></span>
        )}
        <div className="card-buttons">
          <button className="text-btn" onClick={() => onEdit(item)}>
            Edit
          </button>
          <button className="text-btn danger" onClick={() => onDelete(item.id)}>
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default InternshipCard;
