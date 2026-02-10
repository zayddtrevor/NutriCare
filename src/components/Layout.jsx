import { useState } from "react";
import Sidebar from "./Sidebar";
import "./Layout.css";

export default function Layout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`layout ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={() => setIsCollapsed(!isCollapsed)} />
      <main className="main-content">{children}</main>
    </div>
  );
}
