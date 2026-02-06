// src/pages/Reports.jsx
import React, { useState, useMemo } from "react";
import "./Reports.css";

// -------- MOCK DATA (temporary) --------
const mockStudents = [
  {
    name: "Juan Dela Cruz",
    gradeSection: "5 - DIAMOND",
    status: "Normal",
    bmi: 17.4,
    presentDays: 18,
    absentDays: 2
  },
  {
    name: "Maria Santos",
    gradeSection: "4 - ROSE",
    status: "Overweight",
    bmi: 22.1,
    presentDays: 16,
    absentDays: 4
  },
  {
    name: "Pedro Ramirez",
    gradeSection: "3 - ST. JOHN",
    status: "Severely Wasted",
    bmi: 12.4,
    presentDays: 12,
    absentDays: 8
  },
  {
    name: "Angela Reyes",
    gradeSection: "1 - LANGKA",
    status: "Wasted",
    bmi: 13.9,
    presentDays: 20,
    absentDays: 3
  },
  {
    name: "Mark Villanueva",
    gradeSection: "6 - A. MABINI",
    status: "Obese",
    bmi: 25.3,
    presentDays: 14,
    absentDays: 6
  },
  {
    name: "Hannah Cruz",
    gradeSection: "2 - ACACIA",
    status: "Normal",
    bmi: 16.2,
    presentDays: 22,
    absentDays: 1
  },
  {
    name: "Kyle Mendoza",
    gradeSection: "5 - RUBY",
    status: "Normal",
    bmi: 18.7,
    presentDays: 19,
    absentDays: 3
  },
  {
    name: "Sofia Bernardino",
    gradeSection: "3 - ST. PAUL",
    status: "Overweight",
    bmi: 20.5,
    presentDays: 17,
    absentDays: 5
  },
  {
    name: "Jasper Flores",
    gradeSection: "4 - CARNATION",
    status: "Normal",
    bmi: 17.9,
    presentDays: 21,
    absentDays: 2
  },
  {
    name: "Cheska Lim",
    gradeSection: "1 - GUYABANO",
    status: "Wasted",
    bmi: 14.1,
    presentDays: 15,
    absentDays: 6
  }
];


// Dropdown options
const gradeOptions = ["All Grades", "K1", "K2", "1", "2", "3", "4", "5", "6"];
const statusOptions = ["All Status", "Normal", "Wasted", "Severely Wasted", "Obese", "Overweight"];

export default function Reports() {
  const [grade, setGrade] = useState("All Grades");
  const [status, setStatus] = useState("All Status");

  // -------- FILTERED DATA --------
  const filtered = useMemo(() => {
    let list = [...mockStudents];

    if (grade !== "All Grades") {
      list = list.filter((x) => x.gradeSection.startsWith(grade));
    }

    if (status !== "All Status") {
      list = list.filter((x) => x.status.toLowerCase() === status.toLowerCase());
    }

    return list;
  }, [grade, status]);

  // -------- SUMMARY CARDS --------
  const summary = useMemo(() => {
    return {
      total: filtered.length,
      normal: filtered.filter((x) => x.status === "Normal").length,
      wasted: filtered.filter((x) => x.status === "Wasted").length,
      severelyWasted: filtered.filter((x) => x.status === "Severely Wasted").length,
      overweight: filtered.filter((x) => x.status === "Overweight").length,
      obese: filtered.filter((x) => x.status === "Obese").length,
    };
  }, [filtered]);

  return (
    <div className="reports-wrapper">
      
      <h2 className="reports-title">Reports & Analytics</h2>

      {/* FILTERS */}
      <div className="reports-filters">
        <select value={grade} onChange={(e) => setGrade(e.target.value)}>
          {gradeOptions.map((g) => <option key={g}>{g}</option>)}
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {statusOptions.map((s) => <option key={s}>{s}</option>)}
        </select>

        <button className="export-btn">
          Export CSV
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="reports-summary">
        <div className="summary-card">Total: {summary.total}</div>
        <div className="summary-card">Normal: {summary.normal}</div>
        <div className="summary-card">Wasted: {summary.wasted}</div>
        <div className="summary-card">Severely Wasted: {summary.severelyWasted}</div>
        <div className="summary-card">Overweight: {summary.overweight}</div>
        <div className="summary-card">Obese: {summary.obese}</div>
      </div>

      {/* TABLE */}
      <div className="reports-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Grade & Section</th>
              <th>Status</th>
              <th>BMI</th>
              <th>Present</th>
              <th>Absent</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="6" className="empty">No results found</td></tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.gradeSection}</td>
                  <td>{s.status}</td>
                  <td>{s.bmi}</td>
                  <td>{s.presentDays}</td>
                  <td>{s.absentDays}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
