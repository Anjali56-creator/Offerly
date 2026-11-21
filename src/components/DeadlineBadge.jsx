import { daysLeft, deadlineText } from "../utils/dates.js";

function DeadlineBadge({ deadline }) {
  const days = daysLeft(deadline);

  let className = "badge";
  if (days !== null && days < 0) className += " badge-closed";
  else if (days !== null && days <= 3) className += " badge-urgent";

  return <span className={className}>{deadlineText(deadline)}</span>;
}

export default DeadlineBadge;
