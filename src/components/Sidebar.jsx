import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Users, Utensils, LineChart, LogOut } from "lucide-react";
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
        <div className="nav-section-label">MAIN</div>
        <Link
          to="/dashboard"
          className={loc.pathname === "/dashboard" ? "active" : ""}
        >
          <LayoutGrid size={20} />
          <span>Dashboard</span>
        </Link>

        <div className="nav-section-label">MANAGEMENT</div>
        <Link
          to="/management"
          className={loc.pathname === "/management" ? "active" : ""}
        >
          <Users size={20} />
          <span>Student & Teacher</span>
        </Link>

        <Link
          to="/feeding"
          className={loc.pathname === "/feeding" ? "active" : ""}
        >
          <Utensils size={20} />
          <span>Feeding & Nutrition</span>
        </Link>

        <Link
          to="/reports"
          className={loc.pathname === "/reports" ? "active" : ""}
        >
          <LineChart size={20} />
          <span>Reports</span>
        </Link>

        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
}
