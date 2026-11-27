import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useMyInternships } from "../context/InternshipsContext.jsx";

function Header() {
  const { user, logout } = useAuth();
  const { internships } = useMyInternships();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const firstName = user ? user.name.trim().split(" ")[0] : "";

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <Link to={user ? "/dashboard" : "/login"} className="logo-link">
            <span className="logo">
              <span>Offerly</span>
            </span>
            <span className="tagline">from applied to offer</span>
          </Link>
          <span className="college-badge">ABESEC Ghaziabad</span>
        </div>

        {user && (
          <div className="header-user">
            {user.role === "admin" && (
              <Link to="/admin" className="header-pref">
                🛠 Admin
              </Link>
            )}
            <Link to="/preferences" className="header-pref">
              📍 Preferences
            </Link>
            <Link to="/my-internships" className="btn btn-small btn-link">
              My Internships <span className="count-badge">{internships.length}</span>
            </Link>
            <span className="greeting">Hi, {firstName}</span>
            <button className="btn btn-small" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
