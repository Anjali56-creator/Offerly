import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useMyInternships } from "../context/InternshipsContext.jsx";

// round button at the bottom-right, only shown on mobile (see App.css)
function FloatingButton() {
  const { user } = useAuth();
  const { internships } = useMyInternships();

  if (!user) return null;

  return (
    <Link to="/my-internships" className="fab" aria-label="My Internships">
      📋 {internships.length}
    </Link>
  );
}

export default FloatingButton;
