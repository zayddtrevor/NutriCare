import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Users, Utensils, LineChart, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import "./Sidebar.css";
import { supabase } from "../supabaseClient";

export default function Sidebar({ isCollapsed, toggleSidebar }) {
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
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="brand">
        <div className="logo-circle">NC</div>
        <div className={`brand-text ${isCollapsed ? "hidden" : ""}`}>
          <div className="brand-title">NutriCare</div>
          <small className="brand-sub">Admin</small>
        </div>
      </div>

      <button className="collapse-btn" onClick={toggleSidebar} title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <nav className="nav">
        <div className={`nav-section-label ${isCollapsed ? "hidden" : ""}`}>MAIN</div>
        <Link
          to="/dashboard"
          className={loc.pathname === "/dashboard" ? "active" : ""}
          title={isCollapsed ? "Dashboard" : ""}
        >
          <LayoutGrid size={20} />
          <span className={isCollapsed ? "hidden" : ""}>Dashboard</span>
        </Link>

        <div className={`nav-section-label ${isCollapsed ? "hidden" : ""}`}>MANAGEMENT</div>
        <Link
          to="/management"
          className={loc.pathname === "/management" ? "active" : ""}
          title={isCollapsed ? "Student & Teacher" : ""}
        >
          <Users size={20} />
          <span className={isCollapsed ? "hidden" : ""}>Student & Teacher</span>
        </Link>

        <Link
          to="/feeding"
          className={loc.pathname === "/feeding" ? "active" : ""}
          title={isCollapsed ? "Feeding & Nutrition" : ""}
        >
          <Utensils size={20} />
          <span className={isCollapsed ? "hidden" : ""}>Feeding & Nutrition</span>
        </Link>

        <Link
          to="/reports"
          className={loc.pathname === "/reports" ? "active" : ""}
          title={isCollapsed ? "Reports" : ""}
        >
          <LineChart size={20} />
          <span className={isCollapsed ? "hidden" : ""}>Reports</span>
        </Link>

        <button onClick={handleLogout} className="logout-btn" title={isCollapsed ? "Logout" : ""}>
          <LogOut size={20} />
          <span className={isCollapsed ? "hidden" : ""}>Logout</span>
        </button>
      </nav>
    </aside>
  );
}
