// src/components/Layout.jsx
import Sidebar from "./Sidebar";
import "./Layout.css";

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="slide-in" style={{ width: '100%' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
