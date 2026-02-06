// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import StudentTeacher from "./pages/StudentTeacher";
import FeedingNutrition from "./pages/FeedingNutrition";
import Reports from "./pages/Reports";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Login stays outside RequireAuth since it's public */}
        <Route path="/" element={<Login />} />

        {/* Protected routes wrapped in RequireAuth */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Layout>
                <Dashboard />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/management"
          element={
            <RequireAuth>
              <Layout>
                <StudentTeacher />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/feeding"
          element={
            <RequireAuth>
              <Layout>
                <FeedingNutrition />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireAuth>
              <Layout>
                <Reports />
              </Layout>
            </RequireAuth>
          }
        /> 
      </Routes>
    </Router>
  );
}
