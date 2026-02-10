import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { SCHOOL_DATA, GRADES, normalizeGrade } from "../constants/schoolData";
import {
  Users,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  FileText
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import FilterBar from "../components/common/FilterBar";
import GradeTabs from "../components/common/GradeTabs";
import StatCard from "../components/common/StatCard";
import Button from "../components/common/Button";
import "../components/common/TableStyles.css";
import "./Reports.css";

// Constants
const GRADE_OPTIONS = ["All Grades", ...GRADES];
const STATUS_OPTIONS = ["All Status", "Normal", "Wasted", "Severely Wasted", "Overweight", "Obese"];

export default function Reports() {
  // Data State
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
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

        const rawGrade = (s.grade_level || "").toString();
        const normalizedGrade = normalizeGrade(rawGrade);
        const section = s.section || "Unknown";

        return {
          id: s.id,
          name: s.name || s.full_name || "Unknown",
          gradeLevel: normalizedGrade,
          rawGrade: rawGrade,
          section: section,
          sex: s.sex || null,
          birthDate: s.birth_date || s.dob || null,
          gradeSection: `${normalizedGrade} - ${section}`,
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
       return [...new Set(Object.values(SCHOOL_DATA).flat())].sort();
    }
    return SCHOOL_DATA[grade] || [];
  }, [grade]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // 1. Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = s.name.toLowerCase().includes(q);
        const sectionMatch = s.section.toLowerCase().includes(q);
        if (!nameMatch && !sectionMatch) return false;
      }

      // 2. Grade
      if (grade !== "All Grades") {
        if (s.gradeLevel !== grade) return false;
      }

      // 3. Section
      if (section !== "All Sections" && s.section !== section) return false;

      // 4. Status
      if (status !== "All Status" && (s.status || "").toLowerCase() !== status.toLowerCase()) return false;

      return true;
    });
  }, [students, grade, section, status, searchQuery]);

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
  const escapeCsvField = (field) => {
    if (field === null || field === undefined) return "";
    const stringField = String(field);
    if (stringField.includes(",") || stringField.includes('"') || stringField.includes("\n")) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  const exportCSV = () => {
    if (filteredStudents.length === 0) return;

    const headers = [
      "student_id",
      "full_name",
      "grade",
      "section",
      "sex",
      "birth_date",
      "bmi",
      "nutrition_status",
      "present_days",
      "absent_days",
      "report_date"
    ];

    const reportDate = new Date().toISOString().slice(0, 10);

    // Helper to clean placeholders for CSV export
    const cleanValue = (val) => {
      if (val === "-" || val === "Unknown" || val === "?") return "";
      return val;
    };

    const csvContent = [
      headers.join(","),
      ...filteredStudents.map(s => {
        return [
          escapeCsvField(s.id),
          escapeCsvField(cleanValue(s.name)),
          escapeCsvField(cleanValue(s.gradeLevel)),
          escapeCsvField(cleanValue(s.section)),
          escapeCsvField(cleanValue(s.sex)),
          escapeCsvField(cleanValue(s.birthDate)),
          escapeCsvField(cleanValue(s.bmi)),
          escapeCsvField(cleanValue(s.status)),
          escapeCsvField(s.presentDays),
          escapeCsvField(s.absentDays),
          escapeCsvField(reportDate)
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `NutriCare_Report_${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------- DOWNLOAD TEMPLATE --------
  const downloadTemplate = () => {
    const headers = [
      "student_id",
      "full_name",
      "grade",
      "section",
      "sex",
      "birth_date",
      "bmi",
      "nutrition_status",
      "present_days",
      "absent_days",
      "report_date"
    ];

    const csvContent = headers.join(",");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "NutriCare_Report_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="reports-wrapper">
      <PageHeader
        title="Reports & Analytics"
        action={
          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              icon={<FileText size={16} />}
            >
              Download Template
            </Button>
            <Button
                variant="primary"
                onClick={exportCSV}
                disabled={loading || filteredStudents.length === 0}
                icon={<Download size={16} />}
            >
                Export CSV
            </Button>
          </div>
        }
      />

      <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onReset={() => {
            setSearchQuery("");
            setGrade("All Grades");
            setSection("All Sections");
            setStatus("All Status");
          }}
      >
        <select value={section} onChange={(e) => setSection(e.target.value)}>
          <option value="All Sections">All Sections</option>
          {availableSections.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </FilterBar>

      <GradeTabs
          activeGrade={grade}
          onTabClick={(g) => {
              setGrade(g);
              setSection("All Sections");
          }}
          grades={GRADE_OPTIONS}
      />

      {/* SUMMARY CARDS */}
      <div className="reports-summary">
        <StatCard label="Total Students" value={loading ? "..." : summary.total} icon={<Users size={20}/>} color="blue" />
        <StatCard label="Normal" value={loading ? "..." : summary.normal} icon={<CheckCircle size={20}/>} color="green" />
        <StatCard label="Wasted" value={loading ? "..." : summary.wasted} icon={<AlertTriangle size={20}/>} color="yellow" />
        <StatCard label="Severely Wasted" value={loading ? "..." : summary.severelyWasted} icon={<AlertTriangle size={20}/>} color="orange" />
        <StatCard label="Overweight" value={loading ? "..." : summary.overweight} icon={<Activity size={20}/>} color="purple" />
        <StatCard label="Obese" value={loading ? "..." : summary.obese} icon={<XCircle size={20}/>} color="red" />
      </div>

      {/* TABLE */}
      <div className="data-table-container">
        {error && <div className="error-message">{error}</div>}

        <table className="data-table">
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
