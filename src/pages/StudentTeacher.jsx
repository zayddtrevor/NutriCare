import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Users, UserCheck, UserX, BookOpen, Edit2, RefreshCw, Trash2, Mail, Briefcase, Hash, User, UserPlus } from "lucide-react";
import { SCHOOL_DATA, GRADES, normalizeGrade } from "../constants/schoolData";
import { recalculateNutritionStatus } from "../utils/nutritionUpdater";
import PageHeader from "../components/common/PageHeader";
import FilterBar from "../components/common/FilterBar";
import StatCard from "../components/common/StatCard";
import GradeTabs from "../components/common/GradeTabs";
import Button from "../components/common/Button";
import "../components/common/TableStyles.css"; // Import standard table styles
import "./StudentTeacher.css";

const STUDENT_GRADES = [
  { key: "All", label: "All Grades" },
  ...GRADES.map(g => ({ key: g, label: g }))
];

export default function StudentTeacher() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("students");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "students" || tabParam === "teachers") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [studentFilterGrade, setStudentFilterGrade] = useState("All");
  const [studentFilterSection, setStudentFilterSection] = useState("All");
  const [studentFilterGender, setStudentFilterGender] = useState("All");
  const [studentFilterStatus, setStudentFilterStatus] = useState("All");

  const [teacherFilterSection, setTeacherFilterSection] = useState("All");
  const [teacherFilterStatus, setTeacherFilterStatus] = useState("All");
  const [teacherSortBy, setTeacherSortBy] = useState("name-asc");

  const [loading, setLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Modal State (for Teachers only for now)
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    idNumber: "",
    firstName: "",
    lastName: "",
    email: "",
    section: "",
  });
  const [emailError, setEmailError] = useState("");

  // =========================
  // Fetch Data
  // =========================
  useEffect(() => {
    if (activeTab === "students") {
      fetchStudents();
    } else {
      fetchTeachers();
    }
  }, [activeTab]);

  async function fetchStudents() {
    setLoading(true);

    // 1. Fetch students (removed manual limit, using default limit but logging exact count)
    const { data: studentsData, count: totalCount, error: studentError } = await supabase
      .from("students")
      .select("*", { count: "exact" });

    if (studentError) {
        console.error("Error fetching students:", studentError);
        setLoading(false);
        return;
    }

    console.log("StudentTeacher Total Count:", totalCount);

    // 2. Fetch latest BMI records for status
    // We fetch all and map them because Supabase doesn't support easy "latest per student" in one query without join/view
    const { data: bmiData, error: bmiError } = await supabase
      .from("bmi_records")
      .select("student_id, nutrition_status, created_at")
      .order("created_at", { ascending: false })
      .range(0, 9999);

    if (bmiError) {
       console.error("Error fetching BMI records:", bmiError);
    }

    // Map student_id -> latest status
    const statusMap = {};
    if (bmiData) {
      bmiData.forEach(r => {
        if (!statusMap[r.student_id]) {
          statusMap[r.student_id] = r.nutrition_status;
        }
      });
    }

    // Map data to handle variations
    const mapped = studentsData.map(s => {
      const rawGrade = s.grade_level || "";
      const grade = normalizeGrade(rawGrade);
      const section = s.section || "";
      const gradeSectionDisplay = (grade && section)
        ? `${grade} – ${section}`
        : (grade || section || "Unknown");

      // Use status from BMI record if available, fallback to "Unknown"
      // Note: s.nutrition_status might not exist in students table anymore per PR feedback
      const status = statusMap[s.id] || "Unknown";

      return {
        id: s.id,
        name: s.name || s.full_name || "Unknown",
        grade: grade, // Normalized grade
        rawGrade: rawGrade,
        section: section,
        gradeSectionDisplay: gradeSectionDisplay,
        sex: s.sex || "-",
        nutritionStatus: status,
      };
    });

    // Sort manually to be safe
    mapped.sort((a, b) => a.name.localeCompare(b.name));

    setStudents(mapped);
    setLoading(false);
  }

  async function fetchTeachers() {
    setLoading(true);

    const { data, error } = await supabase
      .from("teachers")
      .select("*")
      .order("last_name", { ascending: true });

    if (error) {
      console.error("Error fetching teachers:", error);
    } else {
      const mapped = data.map((t) => ({
        uid: t.id,
        idNumber: t.teacher_id_number || "",
        firstName: t.first_name || "",
        lastName: t.last_name || "",
        email: t.email || "",
        section: t.section || "",
        active: t.active ?? true,
        createdAt: t.created_at,
        deactivatedAt: t.deactivated_at,
      }));

      setTeachers(mapped);
    }

    setLoading(false);
  }

  // =========================
  // Form handlers (Teachers)
  // =========================
  function openAddModal() {
    setEditingTeacher(null);
    setFormData({
      idNumber: "",
      firstName: "",
      lastName: "",
      email: "",
      section: "",
    });
    setEmailError("");
    setShowModal(true);
  }

  function openEditModal(teacher) {
    setEditingTeacher(teacher);
    setFormData({
      idNumber: teacher.idNumber,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      section: teacher.section,
    });
    setEmailError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingTeacher(null);
    setEmailError("");
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "email") {
      // Basic email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setEmailError("Please enter a valid email address.");
      } else {
        setEmailError("");
      }
    }
  }

  // =========================
  // Add / Update teacher
  // =========================
  async function handleSubmit(e) {
    e.preventDefault();

    if (emailError) {
      return; // Prevent submission if validation fails
    }

    if (editingTeacher) {
      // Update
      const { error } = await supabase
        .from("teachers")
        .update({
          teacher_id_number: formData.idNumber || null,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          section: formData.section,
        })
        .eq("id", editingTeacher.uid);

      if (error) {
        console.error("Update error:", error);
      }
    } else {
      // Insert
      const { error } = await supabase.from("teachers").insert({
        teacher_id_number: formData.idNumber || null,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        section: formData.section,
        active: true,
      });

      if (error) {
        console.error("Insert error:", error);
      }
    }

    closeModal();
    fetchTeachers();
  }

  // =========================
  // Recalculate Status
  // =========================
  async function handleRecalculate() {
    if (!window.confirm("This will update nutrition status for students with 'Unknown' status based on their latest BMI records. Continue?")) {
      return;
    }

    setIsRecalculating(true);
    const result = await recalculateNutritionStatus();
    setIsRecalculating(false);

    if (result.success) {
      alert(result.message || `Updated ${result.count} students.`);
      fetchStudents(); // Refresh data
    } else {
      console.error("Recalculation failed:", result.error);
      alert(`Failed to recalculate status: ${result.error?.message || "Unknown error"}`);
    }
  }

  // =========================
  // Activate / Deactivate (Teachers)
  // =========================
  async function toggleActive(teacher) {
    const { error } = await supabase
      .from("teachers")
      .update({
        active: !teacher.active,
        deactivated_at: teacher.active
          ? new Date().toISOString()
          : null,
      })
      .eq("id", teacher.uid);

    if (error) {
      console.error("Toggle active error:", error);
    } else {
      fetchTeachers();
    }
  }

  // =========================
  // Delete teacher
  // =========================
  async function deleteTeacher(teacher) {
    if (!window.confirm("Permanently delete this teacher?")) return;

    const { error } = await supabase
      .from("teachers")
      .delete()
      .eq("id", teacher.uid);

    if (error) {
      console.error("Delete error:", error);
    } else {
      fetchTeachers();
    }
  }

  // =========================
  // Render
  // =========================

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  // Compute unique values for filters (Students)
  const uniqueStudentSections = useMemo(() => {
    if (studentFilterGrade === "All") {
      // Flatten all sections from SCHOOL_DATA
      return [...new Set(Object.values(SCHOOL_DATA).flat())].sort();
    }
    return SCHOOL_DATA[studentFilterGrade] || [];
  }, [studentFilterGrade]);

  const uniqueStudentGenders = [...new Set(students.map((s) => s.sex).filter(Boolean))].sort();

  // Compute unique values for filters (Teachers)
  const uniqueTeacherSections = [...new Set(teachers.map((t) => t.section).filter(Boolean))].sort();

  // Teacher Summary Stats
  const teacherStats = useMemo(() => {
    const total = teachers.length;
    const active = teachers.filter(t => t.active).length;
    const inactive = total - active;
    const sections = new Set(teachers.map(t => t.section).filter(Boolean)).size;
    return { total, active, inactive, sections };
  }, [teachers]);

  // Filter students
  const filteredStudents = students.filter((s) => {
    // 1. Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = s.name.toLowerCase().includes(q);
      const sectionMatch = s.section.toLowerCase().includes(q);
      if (!nameMatch && !sectionMatch) return false;
    }
    // 2. Filters
    const matchGrade = studentFilterGrade === "All" || s.grade === studentFilterGrade;
    const matchSection = studentFilterSection === "All" || s.section === studentFilterSection;
    const matchGender = studentFilterGender === "All" || s.sex === studentFilterGender;
    const matchStatus = studentFilterStatus === "All" || (s.nutritionStatus || "").toLowerCase() === studentFilterStatus.toLowerCase();
    return matchGrade && matchSection && matchGender && matchStatus;
  });

  // Ensure alphabetical sort (already sorted in fetch, but good to ensure)
  filteredStudents.sort((a, b) => a.name.localeCompare(b.name));

  // Filter and Sort teachers
  const filteredTeachers = useMemo(() => {
    let result = teachers.filter((t) => {
      // 1. Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const fullName = `${t.firstName} ${t.lastName}`.toLowerCase();
        const email = t.email.toLowerCase();
        const section = t.section.toLowerCase();
        if (!fullName.includes(q) && !email.includes(q) && !section.includes(q)) return false;
      }
      // 2. Filters
      const matchSection = teacherFilterSection === "All" || t.section === teacherFilterSection;
      const matchStatus = teacherFilterStatus === "All" || (teacherFilterStatus === "Active" ? t.active : !t.active);
      return matchSection && matchStatus;
    });

    // 3. Sort
    result.sort((a, b) => {
      if (teacherSortBy === "name-asc") {
        return a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName);
      } else if (teacherSortBy === "name-desc") {
        return b.lastName.localeCompare(a.lastName) || b.firstName.localeCompare(a.firstName);
      } else if (teacherSortBy === "status-active") {
        // Active first
        return (b.active === a.active) ? 0 : b.active ? 1 : -1;
      } else if (teacherSortBy === "status-inactive") {
        // Inactive first
        return (a.active === b.active) ? 0 : a.active ? 1 : -1;
      }
      return 0;
    });

    return result;
  }, [teachers, searchQuery, teacherFilterSection, teacherFilterStatus, teacherSortBy]);

  return (
    <div className="student-page">
      <div className="content-container">
        <PageHeader
          title="Student & Teacher Management"
          action={
            <div style={{ display: "flex", gap: "10px" }}>
              {activeTab === "students" && (
                <button
                  className={`btn-recalculate ${isRecalculating ? "loading" : ""}`}
                  onClick={handleRecalculate}
                  disabled={loading || isRecalculating}
                >
                  <RefreshCw size={16} className={`recalc-icon ${isRecalculating ? "spin" : ""}`} />
                  {isRecalculating ? "Recalculating..." : "Recalculate Status"}
                </button>
              )}
            </div>
          }
        />

        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === "students" ? "active-tab" : ""}`}
            onClick={() => handleTabChange("students")}
          >
            Students
          </button>
          <button
            className={`tab-btn ${activeTab === "teachers" ? "active-tab" : ""}`}
            onClick={() => handleTabChange("teachers")}
          >
            Teachers
          </button>
        </div>

        {loading ? (
          <div className="table-loading">Loading...</div>
        ) : (
          <div className="data-table-container">
          {activeTab === "students" && (
            <>
              <div className="students-summary-row stats-section-spacing">
                <StatCard
                  label="Total Students"
                  value={students.length}
                  icon={<Users size={20} />}
                  color="blue"
                />

                <div className="grade-sections-summary">
                   <h4>Sections per Grade</h4>
                   <div className="grade-sections-grid">
                      {GRADES.map(grade => (
                        <div key={grade} className="grade-section-item">
                           <span className="gs-label">{grade}:</span>
                           <span className="gs-count">{SCHOOL_DATA[grade].length}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              {/* Grade Filter Buttons (Moved below stats) */}
              <GradeTabs
                activeGrade={studentFilterGrade}
                onTabClick={setStudentFilterGrade}
                grades={STUDENT_GRADES}
              />

              <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onReset={() => {
                  setSearchQuery("");
                  setStudentFilterGrade("All");
                  setStudentFilterSection("All");
                  setStudentFilterGender("All");
                  setStudentFilterStatus("All");
                }}
              >
                  <select
                    value={studentFilterStatus}
                    onChange={(e) => setStudentFilterStatus(e.target.value)}
                  >
                    <option value="All">All Status</option>
                    <option value="Normal">Normal</option>
                    <option value="Wasted">Wasted</option>
                    <option value="Severely Wasted">Severely Wasted</option>
                    <option value="Overweight">Overweight</option>
                    <option value="Obese">Obese</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                  {/* Grade filter removed as it is now above as buttons */}
                  <select
                    value={studentFilterSection}
                    onChange={(e) => setStudentFilterSection(e.target.value)}
                  >
                    <option value="All">All Sections</option>
                    {uniqueStudentSections.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                  <select
                    value={studentFilterGender}
                    onChange={(e) => setStudentFilterGender(e.target.value)}
                  >
                    <option value="All">All Genders</option>
                    {uniqueStudentGenders.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
              </FilterBar>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                  <th>Grade & Section</th>
                  <th>Sex</th>
                  <th>Nutrition Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
                      No students found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.gradeSectionDisplay}</td>
                      <td>{s.sex}</td>
                      <td>
                        <span className={`status-badge ${s.nutritionStatus.toLowerCase().replace(/\s/g, '-')}`}>
                          {s.nutritionStatus}
                        </span>
                      </td>
                    </tr>
                   ))
                )}
              </tbody>
            </table>
            </>
          )}

          {activeTab === "teachers" && (
            <>
              <div className="teachers-summary-row stats-section-spacing">
                <StatCard
                  label="Total Teachers"
                  value={teacherStats.total}
                  icon={<Users size={28} />}
                  color="blue"
                />
                <StatCard
                  label="Active"
                  value={teacherStats.active}
                  icon={<UserCheck size={28} />}
                  color="green"
                />
                <StatCard
                  label="Inactive"
                  value={teacherStats.inactive}
                  icon={<UserX size={28} />}
                  color="red"
                />
                <StatCard
                  label="Sections Covered"
                  value={teacherStats.sections}
                  icon={<BookOpen size={28} />}
                  color="orange"
                />
              </div>

              <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onReset={() => {
                  setSearchQuery("");
                  setTeacherFilterSection("All");
                  setTeacherFilterStatus("All");
                  setTeacherSortBy("name-asc");
                }}
              >
                  <select
                    value={teacherSortBy}
                    onChange={(e) => setTeacherSortBy(e.target.value)}
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="status-active">Active First</option>
                    <option value="status-inactive">Inactive First</option>
                  </select>
                  <select
                    value={teacherFilterSection}
                    onChange={(e) => setTeacherFilterSection(e.target.value)}
                  >
                    <option value="All">All Sections</option>
                    {uniqueTeacherSections.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                  <select
                    value={teacherFilterStatus}
                    onChange={(e) => setTeacherFilterStatus(e.target.value)}
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
              </FilterBar>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID No.</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Section</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                        <div className="empty-state">
                          <div className="empty-icon-bg">
                            <Users size={40} color="#cbd5e1" />
                          </div>
                          <h3>No teachers found</h3>
                          <p>Try adjusting your filters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((t) => (
                      <tr key={t.uid} className={!t.active ? "inactive-row" : ""}>
                        <td>{t.idNumber}</td>
                        <td>
                          <div className="teacher-name-cell">
                            <div className={`teacher-avatar avatar-${(t.firstName.length + t.lastName.length) % 5}`}>
                              {getInitials(t.firstName, t.lastName)}
                            </div>
                            <span className="teacher-name-text">
                              {t.firstName} {t.lastName}
                            </span>
                          </div>
                        </td>
                        <td>{t.email}</td>
                        <td>{t.section}</td>
                        <td>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "-"}</td>
                        <td>
                          <span className={`status-badge ${t.active ? "active" : "inactive"}`}>
                            {t.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="cell-actions">
                          <button
                            className="btn-icon edit"
                            onClick={() => openEditModal(t)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className={`btn-icon toggle ${t.active ? "deactivate" : "activate"}`}
                            onClick={() => toggleActive(t)}
                            title={t.active ? "Deactivate" : "Activate"}
                          >
                            {t.active ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => deleteTeacher(t)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header-colored">
              <div className="modal-title-group">
                <h3>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</h3>
                <p className="modal-subtitle">Enter teacher details below</p>
              </div>
              <button className="close-btn-white" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <label>
                ID Number
                <div className="input-with-icon">
                  <Hash size={18} className="input-icon" />
                  <input
                    name="idNumber"
                    placeholder="Teacher ID Number"
                    value={formData.idNumber}
                    onChange={handleChange}
                  />
                </div>
              </label>

              <div className="form-row-2">
                <label>
                  First Name
                  <div className="input-with-icon">
                    <User size={18} className="input-icon" />
                    <input
                      name="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </label>
                <label>
                  Last Name
                  <div className="input-with-icon">
                    <User size={18} className="input-icon" />
                    <input
                      name="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </label>
              </div>

              <label>
                Email
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    name="email"
                    type="email"
                    placeholder="juan.delacruz@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={emailError ? "input-error" : ""}
                    required
                  />
                </div>
                {emailError && <span className="error-text">{emailError}</span>}
              </label>

              <label>
                Section
                <div className="input-with-icon">
                  <Briefcase size={18} className="input-icon" />
                  <input
                    name="section"
                    placeholder="Section"
                    value={formData.section}
                    onChange={handleChange}
                  />
                </div>
              </label>

              <div className="modal-actions">
                <button className="btn-save-premium" type="submit">Save Teacher</button>
                <Button variant="secondary" type="button" onClick={closeModal}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
