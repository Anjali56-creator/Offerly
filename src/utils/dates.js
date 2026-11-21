// today as yyyy-mm-dd (local time), same format the date picker uses
export function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

// "23:59" -> "11:59 PM"
export function formatTime(time) {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return hour12 + ":" + String(minutes).padStart(2, "0") + " " + suffix;
}

export function daysLeft(deadline) {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = deadline.split("-").map(Number);
  const due = new Date(year, month - 1, day);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

export function deadlineText(deadline) {
  const days = daysLeft(deadline);
  if (days === null) return "No deadline";
  if (days < 0) return "closed";
  if (days === 0) return "today!";
  if (days === 1) return "tomorrow";
  return days + " days left";
}

export function formatDate(deadline) {
  if (!deadline) return "";
  const [year, month, day] = deadline.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
