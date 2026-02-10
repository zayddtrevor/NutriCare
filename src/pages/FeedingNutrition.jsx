import React, { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { AlertCircle, X, Users, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import PageHeader from "../components/common/PageHeader";
import FilterBar from "../components/common/FilterBar";
import GradeTabs from "../components/common/GradeTabs";
import StatCard from "../components/common/StatCard";
import Button from "../components/common/Button";
import "../components/common/TableStyles.css";
import "./FeedingNutrition.css";

// Constants
const FEEDING_GRADES = [
  { key: "K1", label: "K1" },
  { key: "K2", label: "K2" },
  { key: "1", label: "G1" },
  { key: "2", label: "G2" },
  { key: "3", label: "G3" },
  { key: "4", label: "G4" },
  { key: "5", label: "G5" },
  { key: "6", label: "G6" },
];

export default function FeedingNutrition() {
  // State
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({}); // Placeholder for attendance
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [activeGrade, setActiveGrade] = useState("K1");
  const [selectedSection, setSelectedSection] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetailsId, setShowDetailsId] = useState(null);

  const todayKey = format(new Date(), "yyyy-MM-dd");

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch Students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .range(0, 9999);

      if (studentsError) throw studentsError;

      // Attempt fetch optional tables (SBFP, Attendance)
      // We use Promise.allSettled to not fail if they don't exist
      const [attRes] = await Promise.allSettled([
        supabase.from("attendance").select("*").eq("date", todayKey).range(0, 9999) // Assuming a date column
      ]);

      // Attendance structure might vary. If table exists, we use it. If not, empty.
      const attList = attRes.status === "fulfilled" && attRes.value.data ? attRes.value.data : [];

      // Normalize Students Data
      const normalizedStudents = studentsData.map(s => ({
        id: s.id,
        name: s.name || s.full_name || "Unknown",
        gradeLevel: (s.grade_level || "").toString(),
        section: (s.section || "").toString(),
        sex: s.sex || "-",
        nutritionStatus: s.nutrition_status || s.nutritionStatus || "Unknown",
        weight: s.weight,
        height: s.height,
        bmi: s.bmi,
        // Helper for display
        gradeSectionDisplay: `${s.grade_level || "?"} - ${s.section || "?"}`
      }));

      setStudents(normalizedStudents);

      // Create a map for fast lookup of attendance
      const attMap = {};
      attList.forEach(r => {
        if(r.student_id) attMap[r.student_id] = r.status || "Present";
      });
      setAttendanceData(attMap);

    } catch (err) {
      console.error("Error fetching feeding data:", err);
      setError("Failed to load data. Please check your connection or try again.");
    } finally {
      setLoading(false);
    }
  }, [todayKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived Data: Available Sections for Active Grade
  const availableSections = useMemo(() => {
    if (!students.length) return [];
    // Filter students by active grade first
    const gradeStudents = students.filter(s =>
      s.gradeLevel.toUpperCase() === activeGrade.toUpperCase() ||
      (activeGrade === "K1" && (s.gradeLevel === "K" || s.gradeLevel === "Kinder 1")) // Handle variations
    );
    // Extract unique sections
    const sections = [...new Set(gradeStudents.map(s => s.section))].filter(Boolean).sort();
    return sections;
  }, [students, activeGrade]);

  // Filtered Students Logic
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // 1. Grade Filter
      // loose match for K1/K2/Grade X
      let gradeMatch = false;
      const sGrade = s.gradeLevel.toUpperCase();
      if (activeGrade === "K1") gradeMatch = sGrade === "K1" || sGrade === "K" || sGrade === "Kinder 1";
      else if (activeGrade === "K2") gradeMatch = sGrade === "K2" || sGrade === "Kinder 2";
      else gradeMatch = sGrade === activeGrade || sGrade === `GRADE ${activeGrade}` || sGrade === activeGrade.toString();

      if (!gradeMatch) return false;

      // 2. Section Filter
      if (selectedSection !== "All" && s.section !== selectedSection) return false;

      // 3. Status Filter
      if (statusFilter !== "All" && (s.nutritionStatus || "Unknown") !== statusFilter) return false;

      // 4. Search Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = s.name.toLowerCase().includes(q);
        const secMatch = s.section.toLowerCase().includes(q);
        if (!nameMatch && !secMatch) return false;
      }

      return true;
    });
  }, [students, activeGrade, selectedSection, statusFilter, searchQuery]);

  // Summary Stats
  const summary = useMemo(() => {
    const total = filteredStudents.length;
    const presentCount = filteredStudents.filter(s => attendanceData[s.id] === "Present").length;

    // Status counts
    const statusCounts = {};
    filteredStudents.forEach(s => {
      const st = s.nutritionStatus || "Unknown";
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    });

    return { total, presentCount, absentCount: total - presentCount, statusCounts };
  }, [filteredStudents, attendanceData]);


  // Handlers
  const handleRetry = () => {
    fetchData();
  };

  const clearFilters = () => {
    setActiveGrade("K1");
    setSelectedSection("All");
    setStatusFilter("All");
    setSearchQuery("");
    fetchData(); // Requirement: Re-fetch default data
  };

  return (
    <div className="feeding-nutrition-page">
        <PageHeader title="Feeding & Nutrition" />

        {/* Banner */}
        <div className="meal-banner card-fullwidth">
            <div className="meal-left">
            <h2 className="meal-title">🍽️ Meal for Today</h2>
            <h3 className="meal-name">Rotating Menu — Placeholder</h3>
            <p className="meal-desc">Chicken adobo, brown rice, mixed vegetables (placeholder)</p>
            <div className="meal-meta">Date: {todayKey}</div>
            </div>
            {/* Image Placeholder or Actual Image */}
             <div className="meal-right">
                <div className="meal-img-placeholder">Image</div>
            </div>
        </div>

        <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onReset={clearFilters}
            isLoading={loading}
        >
                <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                >
                    <option value="All">All Sections</option>
                    {availableSections.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                    ))}
                </select>
                 <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="All">All Status</option>
                    <option value="Normal">Normal</option>
                    <option value="Wasted">Wasted</option>
                    <option value="Severely Wasted">Severely Wasted</option>
                    <option value="Overweight">Overweight</option>
                    <option value="Obese">Obese</option>
                </select>
        </FilterBar>

        <GradeTabs
            activeGrade={activeGrade}
            onTabClick={(g) => {
                setActiveGrade(g);
                setSelectedSection("All");
            }}
            grades={FEEDING_GRADES}
        />

        {/* Main Content Area */}
        <div className="content-area">
            {loading ? (
                <div className="skeleton-container">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="skeleton-row"></div>
                    ))}
                </div>
            ) : error ? (
                <div className="error-state">
                    <AlertCircle size={48} className="error-icon" />
                    <h3>Oops! Something went wrong.</h3>
                    <p>{error}</p>
                    <Button variant="primary" onClick={handleRetry}>Try Again</Button>
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📂</div>
                    <h3>No students found</h3>
                    <p>Try adjusting your filters or search query.</p>
                     {(selectedSection !== "All" || statusFilter !== "All" || searchQuery) && (
                         <Button variant="outline" className="mt-4" onClick={clearFilters}>
                             Clear Filters
                         </Button>
                     )}
                </div>
            ) : (
                <>
                    {/* Stats Summary */}
                    <div className="stats-row">
                        <StatCard label="Total Students" value={summary.total} icon={<Users size={20}/>} color="blue" />
                        <StatCard label="Present" value={summary.presentCount} icon={<CheckCircle size={20}/>} color="green" />
                        <StatCard label="Absent" value={summary.absentCount} icon={<XCircle size={20}/>} color="red" />
                    </div>

                    {/* Table */}
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Grade & Section</th>
                                    <th>Nutrition Status</th>
                                    <th>BMI</th>
                                    <th>Attendance</th>
                                    <th className="th-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map(student => (
                                    <tr key={student.id}>
                                        <td>{student.name}</td>
                                        <td>{student.gradeSectionDisplay}</td>
                                        <td>
                                            <span className={`status-badge ${student.nutritionStatus.toLowerCase().replace(/\s/g, '-')}`}>
                                                {student.nutritionStatus}
                                            </span>
                                        </td>
                                        <td>{student.bmi || "-"}</td>
                                        <td>
                                            {attendanceData[student.id] === "Present" ? (
                                                <span className="attendance-present">Present</span>
                                            ) : (
                                                <span className="attendance-absent">-</span>
                                            )}
                                        </td>
                                        <td className="cell-actions">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setShowDetailsId(student.id)}
                                            >
                                                View
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>

        {/* Modal */}
        {showDetailsId && (
            <div className="modal-overlay" onClick={() => setShowDetailsId(null)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>Student Details</h3>
                        <Button variant="secondary" size="sm" onClick={() => setShowDetailsId(null)} icon={<X size={16} />} />
                    </div>
                    {(() => {
                        const s = students.find(st => st.id === showDetailsId);
                        if(!s) return null;
                        return (
                            <div className="modal-body">
                                <p><strong>Name:</strong> {s.name}</p>
                                <p><strong>Grade & Section:</strong> {s.gradeSectionDisplay}</p>
                                <p><strong>Sex:</strong> {s.sex}</p>
                                <p><strong>Nutrition Status:</strong> {s.nutritionStatus}</p>
                                <p><strong>Height:</strong> {s.height ? `${s.height} cm` : "-"}</p>
                                <p><strong>Weight:</strong> {s.weight ? `${s.weight} kg` : "-"}</p>
                                <p><strong>BMI:</strong> {s.bmi || "-"}</p>
                            </div>
                        );
                    })()}
                </div>
            </div>
        )}
    </div>
  );
}
