import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { Users } from "lucide-react";
import { SCHOOL_DATA, GRADES, normalizeGrade } from "../constants/schoolData";
import { recalculateNutritionStatus } from "../utils/nutritionUpdater";
import { getTotalStudents } from "../utils/studentData";
import PageHeader from "../components/common/PageHeader";
import FilterBar from "../components/common/FilterBar";
import StatCard from "../components/common/StatCard";
import Button from "../components/common/Button";
import "../components/common/TableStyles.css"; // Import standard table styles
import "./StudentTeacher.css";

export default function StudentTeacher() {
  const [activeTab, setActiveTab] = useState("students");

  const [students, setStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [teachers, setTeachers] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [studentFilterGrade, setStudentFilterGrade] = useState("All");
  const [studentFilterSection, setStudentFilterSection] = useState("All");
  const [studentFilterGender, setStudentFilterGender] = useState("All");
  const [studentFilterStatus, setStudentFilterStatus] = useState("All");

  const [teacherFilterSection, setTeacherFilterSection] = useState("All");
  const [teacherFilterStatus, setTeacherFilterStatus] = useState("All");

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

  // =========================
  // Fetch Data
  // =========================
  useEffect(() => {
    if (activeTab === "students") {
      fetchStudents();
    } else {
      fetchTeachers();
    }
  }, [activeTab, studentFilterGrade, studentFilterSection, studentFilterGender]);

  async function fetchStudents() {
    setLoading(true);

    // 1. Fetch total count (fix for incorrect count)
    const count = await getTotalStudents({
      grade: studentFilterGrade,
      section: studentFilterSection,
      sex: studentFilterGender
    });
    setTotalStudents(count);

    // 2. Fetch students
    const { data: studentsData, error: studentError } = await supabase
      .from("students")
      .select("*")
      .range(0, 9999);

    if (studentError) {
        console.error("Error fetching students:", studentError);
        setLoading(false);
        return;
    }

    // 3. Fetch latest BMI records for status
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
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingTeacher(null);
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  // =========================
  // Add / Update teacher
  // =========================
  async function handleSubmit(e) {
    e.preventDefault();

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

  // Filter teachers
  const filteredTeachers = teachers.filter((t) => {
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

  return (
    <div className="student-page">
      <PageHeader
        title="Student & Teacher Management"
        action={
          <div style={{ display: "flex", gap: "10px" }}>
            {activeTab === "students" && (
              <Button
                variant="outline"
                onClick={handleRecalculate}
                disabled={loading || isRecalculating}
              >
                {isRecalculating ? "Recalculating..." : "Recalculate Status"}
              </Button>
            )}
            {activeTab === "teachers" && (
              <Button variant="success" onClick={openAddModal}>+ Add Teacher</Button>
            )}
          </div>
        }
      />

      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === "students" ? "active-tab" : ""}`}
          onClick={() => setActiveTab("students")}
        >
          Students
        </button>
        <button
          className={`tab-btn ${activeTab === "teachers" ? "active-tab" : ""}`}
          onClick={() => setActiveTab("teachers")}
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
              <div className="students-summary-row">
                <StatCard
                  label="Total Students"
                  value={totalStudents}
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
                  <select
                    value={studentFilterGrade}
                    onChange={(e) => setStudentFilterGrade(e.target.value)}
                  >
                    <option value="All">All Grades</option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
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
              <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onReset={() => {
                  setSearchQuery("");
                  setTeacherFilterSection("All");
                  setTeacherFilterStatus("All");
                }}
              >
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
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center" }}>
                        No teachers found.
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((t) => (
                      <tr key={t.uid} className={!t.active ? "inactive" : ""}>
                      <td>{t.idNumber}</td>
                      <td>{t.firstName} {t.lastName}</td>
                      <td>{t.email}</td>
                      <td>{t.section}</td>
                      <td>{t.active ? "Active" : "Inactive"}</td>
                        <td className="cell-actions">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openEditModal(t)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant={t.active ? "warning" : "success"}
                            size="sm"
                            onClick={() => toggleActive(t)}
                          >
                            {t.active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteTeacher(t)}
                          >
                            Delete
                          </Button>
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingTeacher ? "Edit Teacher" : "Add Teacher"}</h3>
              <button className="close-btn" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <label>
                ID Number
                <input
                  name="idNumber"
                  placeholder="Teacher ID Number"
                  value={formData.idNumber}
                  onChange={handleChange}
                />
              </label>
              <label>
                First Name
                <input
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Last Name
                <input
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Section
                <input
                  name="section"
                  placeholder="Section"
                  value={formData.section}
                  onChange={handleChange}
                />
              </label>

              <div className="modal-actions">
                <Button variant="primary" type="submit">Save</Button>
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
