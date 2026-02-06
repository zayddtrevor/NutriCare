import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Sidebar.css";
import { supabase } from "../supabaseClient";

export default function Sidebar() {
  const loc = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error.message);
      return;
    }

    console.log("User signed out successfully");
    navigate("/"); // redirect to login
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo-circle">NC</div>
        <div className="brand-text">
          <div className="brand-title">NutriCare</div>
          <small className="brand-sub">Admin</small>
        </div>
      </div>

      <nav className="nav">
        <Link
          to="/dashboard"
          className={loc.pathname === "/dashboard" ? "active" : ""}
        >
          Dashboard
        </Link>

        <Link
          to="/management"
          className={loc.pathname === "/management" ? "active" : ""}
        >
          Student & Teacher
        </Link>

        <Link
          to="/feeding"
          className={loc.pathname === "/feeding" ? "active" : ""}
        >
          Feeding & Nutrition
        </Link>

        <Link
          to="/reports"
          className={loc.pathname === "/reports" ? "active" : ""}
        >
          Reports
        </Link>

        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </nav>
    </aside>
  );
}
