import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabaseClient";
import {
  Users,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  FileText
} from "lucide-react";
import "./Reports.css";

// Constants
const GRADE_OPTIONS = ["All Grades", "K1", "K2", "1", "2", "3", "4", "5", "6"];
const STATUS_OPTIONS = ["All Status", "Normal", "Wasted", "Severely Wasted", "Overweight", "Obese"];

export default function Reports() {
  // Data State
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter State
  const [grade, setGrade] = useState("All Grades");
  const [section, setSection] = useState("All Sections");
  const [status, setStatus] = useState("All Status");

  // Fetch Data Logic
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*");

      if (studentsError) throw studentsError;

      // 2. Fetch Optional Data in Parallel
      const [bmiRes, attRes, sbfpRes] = await Promise.allSettled([
        supabase.from("bmi_records").select("*").order("date_recorded", { ascending: false }),
        supabase.from("attendance").select("*"),
        supabase.from("sbfp_beneficiaries").select("student_id")
      ]);

      const bmiList = bmiRes.status === "fulfilled" && bmiRes.value.data ? bmiRes.value.data : [];
      const attList = attRes.status === "fulfilled" && attRes.value.data ? attRes.value.data : [];
      const sbfpList = sbfpRes.status === "fulfilled" && sbfpRes.value.data ? sbfpRes.value.data : [];

      // 3. Process Data

      // Map for fast lookup: studentId -> Latest BMI Record
      const bmiMap = {};
      bmiList.forEach((r) => {
        if (r.student_id && !bmiMap[r.student_id]) {
          bmiMap[r.student_id] = r;
        }
      });

      // Map for attendance counts: studentId -> { present: 0, absent: 0 }
      const attMap = {};
      attList.forEach((r) => {
        if (!r.student_id) return;
        if (!attMap[r.student_id]) {
          attMap[r.student_id] = { present: 0, absent: 0 };
        }
        const statusVal = (r.status || "").toLowerCase();
        if (statusVal === "present") {
          attMap[r.student_id].present++;
        } else if (statusVal === "absent") {
          attMap[r.student_id].absent++;
        }
      });

      const sbfpSet = new Set(sbfpList.map(r => r.student_id));

      const processed = studentsData.map((s) => {
        const bmiRecord = bmiMap[s.id];
        const attRecord = attMap[s.id] || { present: 0, absent: 0 };

        const nutritionStatus = bmiRecord?.nutrition_status || s.nutrition_status || s.nutritionStatus || "Unknown";
        const bmiValue = bmiRecord?.bmi || s.bmi || null;

        return {
          id: s.id,
          name: s.name || s.full_name || "Unknown",
          gradeLevel: (s.grade_level || "").toString(),
          section: s.section || "Unknown",
          gradeSection: `${s.grade_level || "?"} - ${s.section || "?"}`,
          status: nutritionStatus,
          bmi: bmiValue ? parseFloat(bmiValue).toFixed(1) : "-",
          presentDays: attRecord.present,
          absentDays: attRecord.absent,
          isSbfp: sbfpSet.has(s.id)
        };
      });

      setStudents(processed);

    } catch (err) {
      console.error("Error fetching reports data:", err);
      setError("Failed to load report data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -------- FILTERS --------
  const availableSections = useMemo(() => {
    if (grade === "All Grades") {
       return [...new Set(students.map(s => s.section))].filter(Boolean).sort();
    }
    const filteredByGrade = students.filter(s => {
      const g = s.gradeLevel;
      if (grade === "K1") return g === "K1" || g === "K";
      if (grade === "K2") return g === "K2";
      return g === grade;
    });
    return [...new Set(filteredByGrade.map(s => s.section))].filter(Boolean).sort();
  }, [students, grade]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // 1. Grade
      if (grade !== "All Grades") {
        const g = s.gradeLevel;
        if (grade === "K1" && g !== "K1" && g !== "K") return false;
        else if (grade === "K2" && g !== "K2") return false;
        else if (grade !== "K1" && grade !== "K2" && g !== grade) return false;
      }

      // 2. Section
      if (section !== "All Sections" && s.section !== section) return false;

      // 3. Status
      if (status !== "All Status" && (s.status || "").toLowerCase() !== status.toLowerCase()) return false;

      return true;
    });
  }, [students, grade, section, status]);

  // -------- SUMMARY STATS --------
  const summary = useMemo(() => {
    const total = filteredStudents.length;
    const normal = filteredStudents.filter(s => (s.status || "").toLowerCase() === "normal").length;
    const wasted = filteredStudents.filter(s => (s.status || "").toLowerCase() === "wasted").length;
    const severelyWasted = filteredStudents.filter(s => (s.status || "").toLowerCase() === "severely wasted").length;
    const overweight = filteredStudents.filter(s => (s.status || "").toLowerCase() === "overweight").length;
    const obese = filteredStudents.filter(s => (s.status || "").toLowerCase() === "obese").length;

    return {
      total,
      normal,
      wasted,
      severelyWasted,
      overweight,
      obese
    };
  }, [filteredStudents]);

  // -------- EXPORT CSV --------
  const exportCSV = () => {
    if (filteredStudents.length === 0) return;

    const headers = ["Name", "Grade", "Section", "Nutrition Status", "BMI", "Present Days", "Absent Days"];
    const csvContent = [
      headers.join(","),
      ...filteredStudents.map(s => [
        `"${s.name}"`,
        `"${s.gradeLevel}"`,
        `"${s.section}"`,
        `"${s.status}"`,
        s.bmi,
        s.presentDays,
        s.absentDays
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `reports_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="reports-wrapper">
      <h2 className="reports-title">Reports & Analytics</h2>

      {/* FILTERS */}
      <div className="reports-filters">
        <select value={grade} onChange={(e) => { setGrade(e.target.value); setSection("All Sections"); }}>
          {GRADE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>

        <select value={section} onChange={(e) => setSection(e.target.value)}>
          <option value="All Sections">All Sections</option>
          {availableSections.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <button className="export-btn" onClick={exportCSV} disabled={loading || filteredStudents.length === 0}>
          <Download size={16} style={{ marginRight: 8 }} />
          Export CSV
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="reports-summary">
        <div className="summary-card">
          <div className="card-header">
            <Users size={20} className="icon-blue" />
            <h3>Total Students</h3>
          </div>
          <p className="card-value">{loading ? "..." : summary.total}</p>
        </div>
        <div className="summary-card">
          <div className="card-header">
            <CheckCircle size={20} className="icon-green" />
            <h3>Normal</h3>
          </div>
          <p className="card-value">{loading ? "..." : summary.normal}</p>
        </div>
        <div className="summary-card">
          <div className="card-header">
            <AlertTriangle size={20} className="icon-yellow" />
            <h3>Wasted</h3>
          </div>
          <p className="card-value">{loading ? "..." : summary.wasted}</p>
        </div>
        <div className="summary-card">
           <div className="card-header">
            <AlertTriangle size={20} className="icon-orange" />
            <h3>Severely Wasted</h3>
          </div>
          <p className="card-value">{loading ? "..." : summary.severelyWasted}</p>
        </div>
        <div className="summary-card">
          <div className="card-header">
            <Activity size={20} className="icon-purple" />
            <h3>Overweight</h3>
          </div>
          <p className="card-value">{loading ? "..." : summary.overweight}</p>
        </div>
         <div className="summary-card">
          <div className="card-header">
            <XCircle size={20} className="icon-red" />
            <h3>Obese</h3>
          </div>
          <p className="card-value">{loading ? "..." : summary.obese}</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="reports-table-container">
        {error && <div className="error-message">{error}</div>}

        <table className="reports-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Grade & Section</th>
              <th>Status</th>
              <th>BMI</th>
              <th>Present Days</th>
              <th>Absent Days</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td><div className="skeleton-bar" style={{ width: '120px' }}></div></td>
                  <td><div className="skeleton-bar" style={{ width: '100px' }}></div></td>
                  <td><div className="skeleton-bar" style={{ width: '80px' }}></div></td>
                  <td><div className="skeleton-bar" style={{ width: '40px' }}></div></td>
                  <td><div className="skeleton-bar" style={{ width: '30px' }}></div></td>
                  <td><div className="skeleton-bar" style={{ width: '30px' }}></div></td>
                </tr>
              ))
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  <div className="empty-state-content">
                    <FileText size={48} className="empty-icon" />
                    <p>No records found matching your filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr key={s.id}>
                  <td>{s.name} {s.isSbfp && <span className="sbfp-badge">SBFP</span>}</td>
                  <td>{s.gradeSection}</td>
                  <td>
                    <span className={`status-badge ${s.status.toLowerCase().replace(/\s/g, '-')}`}>
                      {s.status}
                    </span>
                  </td>
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
