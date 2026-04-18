import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { SCHOOL_DATA, GRADES, normalizeGrade, SCHOOL_METADATA } from "../constants/schoolData";
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
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [grade, setGrade] = useState("All Grades");
  const [section, setSection] = useState("All Sections");
  const [status, setStatus] = useState("All Status");

  // Fetch Data Logic
  const fetchData = useCallback(async () => {
    // Only set loading on first load to avoid flickering on auto-refresh
    if (students.length === 0) setLoading(true);
    setError(null);
    try {
      // 1. Fetch Students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .range(0, 9999);

      if (studentsError) throw studentsError;

      // 2. Fetch Optional Data in Parallel
      const [bmiRes, attRes, sbfpRes] = await Promise.allSettled([
        supabase.from("bmi_records").select("*").order("created_at", { ascending: false }).range(0, 9999),
        supabase.from("attendance").select("*").range(0, 9999),
        supabase.from("sbfp_beneficiaries").select("student_id").range(0, 9999)
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
          weighingDate: bmiRecord?.created_at || null,
          weight: bmiRecord?.weight_kg || s.weight || null,
          height: bmiRecord?.height_m || s.height || null,
          gradeSection: `${normalizedGrade} - ${section}`,
          status: nutritionStatus,
          bmi: bmiValue ? parseFloat(bmiValue).toFixed(1) : "-",
          presentDays: attRecord.present,
          absentDays: attRecord.absent,
          isSbfp: sbfpSet.has(s.id)
        };
      });

      setStudents(processed);
      setLastUpdated(new Date());

    } catch (err) {
      console.error("Error fetching reports data:", err);
      setError("Failed to load report data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []); // Remove students.length dependency to avoid infinite loops if logic changes, but students.length check inside is fine

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // -------- FILTERS --------
  const availableSections = useMemo(() => {
    if (grade === "All Grades") {
       return [...new Set(Object.values(SCHOOL_DATA).flat())].sort();
    }
    return SCHOOL_DATA[grade] || [];
  }, [grade]);

  // Level 1: Filter by Grade, Section, and Search Query (Base Dataset for Stats)
  const filteredStudentsBase = useMemo(() => {
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

      return true;
    });
  }, [students, grade, section, searchQuery]);

  // Level 2: Filter by Status (applied to Table only)
  const finalFilteredStudents = useMemo(() => {
    if (status === "All Status") return filteredStudentsBase;

    const targetStatus = status.toLowerCase().trim();
    return filteredStudentsBase.filter(s =>
      (s.status || "").toLowerCase().trim() === targetStatus
    );
  }, [filteredStudentsBase, status]);

  // -------- SUMMARY STATS (Derived from Base, so they don't zero out when status filter is active) --------
  const summary = useMemo(() => {
    const total = filteredStudentsBase.length;

    // Helper for safe comparison
    const countStatus = (statusLabel) =>
      filteredStudentsBase.filter(s => (s.status || "").toLowerCase().trim() === statusLabel.toLowerCase().trim()).length;

    // Count unknowns (null, undefined, "-", "Unknown")
    const unknown = filteredStudentsBase.filter(s => {
      const st = (s.status || "").toLowerCase().trim();
      return !st || st === "unknown" || st === "-";
    }).length;

    return {
      total,
      normal: countStatus("Normal"),
      wasted: countStatus("Wasted"),
      severelyWasted: countStatus("Severely Wasted"),
      overweight: countStatus("Overweight"),
      obese: countStatus("Obese"),
      unknown
    };
  }, [filteredStudentsBase]);

  // -------- HANDLERS --------
  const handleStatusCardClick = (statusLabel) => {
    if (status === statusLabel) {
      setStatus("All Status"); // Toggle off
    } else {
      setStatus(statusLabel);
    }
  };

  // -------- HELPERS --------
  const calculateAge = (birthDate, weighingDate) => {
    if (!birthDate || !weighingDate) return "";
    const birth = new Date(birthDate);
    const weigh = new Date(weighingDate);

    let years = weigh.getFullYear() - birth.getFullYear();
    let months = weigh.getMonth() - birth.getMonth();

    if (weigh.getDate() < birth.getDate()) {
      months--;
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return `${years}.${months.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const escapeCsvField = (field) => {
    if (field === null || field === undefined) return "";
    const stringField = String(field);
    if (stringField.includes(",") || stringField.includes('"') || stringField.includes("\n")) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  const generateSbfpCsv = (dataRows = []) => {
    const headerRows = [
      ["SBFP Form 1 (2024)"],
      ["", "", "", "", "", "Department of Education"],
      ["", "", "", "", "", "Master List Beneficiaries for School-Based Feeding Program (SBFP) ( SY 2025-2026)"],
      [""],
      [`Division: ${SCHOOL_METADATA.division}`, "", "", "", "", "", `Name of Principal : ${SCHOOL_METADATA.principalName}`],
      [`City/ Municipality/Barangay : ${SCHOOL_METADATA.division}/${SCHOOL_METADATA.district}`, "", "", "", "", "", `Name of Feeding Focal Person : ${SCHOOL_METADATA.focalPerson}`],
      [`Name of School / School District : ${SCHOOL_METADATA.schoolName}`],
      [`School ID Number: ${SCHOOL_METADATA.schoolId}`],
      [""],
      [
        "No.",
        "Name",
        "Sex",
        "Grade/ Section",
        "Date of Birth (MM/DD/YYYY)",
        "Date of Weighing / Measuring (MM/DD/YYYY)",
        "Age in Years / Months",
        "Weight (Kg)",
        "Height (cm)",
        "BMI for 6 y.o. and above",
        "Nutritional Status (NS)",
        "",
        "Parent's consent for milk? (yes or no)",
        "Participation in 4Ps (yes or no)",
        "Beneficiary of SBFP in Previous Years (yes or no)"
      ],
      [
        "", "", "", "", "", "", "", "", "", "", "BMI-A", "HFA"
      ]
    ];

    const bodyRows = dataRows.map((s, index) => [
      index + 1,
      s.name,
      s.sex,
      `${s.gradeLevel} - ${s.section}`,
      formatDate(s.birthDate),
      formatDate(s.weighingDate),
      calculateAge(s.birthDate, s.weighingDate),
      s.weight ? parseFloat(s.weight).toFixed(2) : "",
      s.height ? (parseFloat(s.height) > 3 ? parseFloat(s.height).toFixed(2) : (parseFloat(s.height) * 100).toFixed(2)) : "", // handle m vs cm
      s.bmi || "",
      s.status || "",
      "Normal", // HFA default
      "YES",
      "NO",
      s.isSbfp ? "YES" : "NO"
    ]);

    const allRows = [...headerRows, ...bodyRows];
    return allRows.map(row => row.map(escapeCsvField).join(",")).join("\n");
  };

  // -------- EXPORT CSV --------
  const exportCSV = () => {
    if (finalFilteredStudents.length === 0) return;
    const csvContent = generateSbfpCsv(finalFilteredStudents);
    const reportDate = new Date().toISOString().slice(0, 10);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `SBFP_Form1_Report_${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------- DOWNLOAD TEMPLATE --------
  const downloadTemplate = () => {
    const csvContent = generateSbfpCsv([]);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "SBFP_Form1_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="reports-wrapper">
      <div className="centered-content">
        <PageHeader
          title="Reports & Analytics"
          action={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
              <div className="last-updated" style={{ fontSize: '0.8rem', color: '#64748b', marginRight: '8px' }}>
                Updated: {lastUpdated.toLocaleTimeString()}
              </div>
              <button
                className="btn-download"
                onClick={downloadTemplate}
              >
                <FileText size={16} className="btn-icon-slide" />
                Download Template
              </button>
              <button
                  className="btn-export"
                  onClick={exportCSV}
                  disabled={loading || finalFilteredStudents.length === 0}
              >
                  <Download size={16} className="btn-icon-bounce" />
                  Export CSV
              </button>
            </div>
          }
        />

        {/* SUMMARY CARDS - Split Layout */}
        <div className="reports-summary-container">
          {/* Top Row: Total Students */}
          <div className="reports-summary-top">
            <StatCard
              label="Total Students"
              value={loading && students.length === 0 ? "..." : summary.total}
              icon={<Users size={20}/>}
              color="blue"
              className="reports-stat-card rsc-blue"
              onClick={() => setStatus("All Status")}
              isActive={status === "All Status"}
            />
          </div>

          {/* Bottom Row: Status Breakdown */}
          <div className="reports-summary-bottom">
            <StatCard
              label="Normal"
              value={loading && students.length === 0 ? "..." : summary.normal}
              icon={<CheckCircle size={20}/>}
              color="green"
              className="reports-stat-card rsc-green"
              onClick={() => handleStatusCardClick("Normal")}
              isActive={status === "Normal"}
            />
            <StatCard
              label="Wasted"
              value={loading && students.length === 0 ? "..." : summary.wasted}
              icon={<AlertTriangle size={20}/>}
              color="yellow"
              className="reports-stat-card rsc-yellow"
              onClick={() => handleStatusCardClick("Wasted")}
              isActive={status === "Wasted"}
            />
            <StatCard
              label="Severely Wasted"
              value={loading && students.length === 0 ? "..." : summary.severelyWasted}
              icon={<AlertTriangle size={20}/>}
              color="orange"
              className="reports-stat-card rsc-orange"
              onClick={() => handleStatusCardClick("Severely Wasted")}
              isActive={status === "Severely Wasted"}
            />
            <StatCard
              label="Overweight"
              value={loading && students.length === 0 ? "..." : summary.overweight}
              icon={<Activity size={20}/>}
              color="purple"
              className="reports-stat-card rsc-purple"
              onClick={() => handleStatusCardClick("Overweight")}
              isActive={status === "Overweight"}
            />
            <StatCard
              label="Obese"
              value={loading && students.length === 0 ? "..." : summary.obese}
              icon={<XCircle size={20}/>}
              color="red"
              className="reports-stat-card rsc-red"
              onClick={() => handleStatusCardClick("Obese")}
              isActive={status === "Obese"}
            />
            <StatCard
              label="Unknown"
              value={loading && students.length === 0 ? "..." : summary.unknown}
              icon={<Users size={20}/>}
              color="gray"
              className="reports-stat-card rsc-gray"
              onClick={() => handleStatusCardClick("Unknown")}
              isActive={status === "Unknown"}
            />
          </div>
        </div>

        <GradeTabs
            activeGrade={grade}
            onTabClick={(g) => {
                setGrade(g);
                setSection("All Sections");
            }}
            grades={GRADE_OPTIONS}
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
              {loading && students.length === 0 ? (
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
              ) : finalFilteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    <div className="empty-state-content">
                      <FileText size={48} className="empty-icon" />
                      <p>No records found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                finalFilteredStudents.map((s) => (
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
    </div>
  );
}
