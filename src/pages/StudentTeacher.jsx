import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";
import PageHeader from "../components/common/PageHeader";
import FilterBar from "../components/common/FilterBar";
import Button from "../components/common/Button";
import { SCHOOL_DATA } from "../constants/schoolData";
import { normalizeStudent } from "../utils/normalize";
import "../components/common/TableStyles.css"; // Import standard table styles
import "./StudentTeacher.css";

export default function StudentTeacher() {
  const [activeTab, setActiveTab] = useState("students");

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [studentFilterGrade, setStudentFilterGrade] = useState("All");
  const [studentFilterSection, setStudentFilterSection] = useState("All");
  const [studentFilterGender, setStudentFilterGender] = useState("All");

  const [teacherFilterSection, setTeacherFilterSection] = useState("All");
  const [teacherFilterStatus, setTeacherFilterStatus] = useState("All");

  const [loading, setLoading] = useState(true);

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
  }, [activeTab]);

  async function fetchStudents() {
    setLoading(true);
    // Fetch students
    // Use .range(0, 9999) to bypass 1000 row limit
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .range(0, 9999);

    if (error) {
        console.error("Error fetching students:", error);
    } else {
        // Map data to handle variations using normalizeStudent
        const mapped = data.map(s => {
          const normalized = normalizeStudent(s);
          return {
            id: s.id,
            name: s.name || s.full_name || "Unknown",
            grade: normalized.grade_level,
            section: normalized.section,
            gradeSectionDisplay: normalized.gradeSectionDisplay,
            sex: s.sex || "-",
            nutritionStatus: s.nutrition_status || s.nutritionStatus || "-",
          };
        });

        // Sort manually to be safe
        mapped.sort((a, b) => a.name.localeCompare(b.name));

        setStudents(mapped);
    }
    setLoading(false);
  }

  async function fetchTeachers() {
    setLoading(true);

    const { data, error } = await supabase
      .from("teachers")
      .select("*")
      .range(0, 9999)
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

  // Available filter options
  const gradeOptions = Object.keys(SCHOOL_DATA);

  const sectionOptions = useMemo(() => {
    if (studentFilterGrade === "All") {
      const allSections = Object.values(SCHOOL_DATA).flat();
      return [...new Set(allSections)].sort();
    }
    return SCHOOL_DATA[studentFilterGrade] || [];
  }, [studentFilterGrade]);

  const uniqueStudentGenders = useMemo(() => {
     return [...new Set(students.map((s) => s.sex).filter(Boolean))].sort();
  }, [students]);

  // Compute unique values for filters (Teachers)
  const uniqueTeacherSections = useMemo(() => {
    return [...new Set(teachers.map((t) => t.section).filter(Boolean))].sort();
  }, [teachers]);

  // Filter students
  const filteredStudents = students.filter((s) => {
    // 1. Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!s.name.toLowerCase().includes(q)) return false;
    }
    // 2. Filters
    const matchGrade = studentFilterGrade === "All" || s.grade === studentFilterGrade;
    const matchSection = studentFilterSection === "All" || s.section === studentFilterSection;
    const matchGender = studentFilterGender === "All" || s.sex === studentFilterGender;
    return matchGrade && matchSection && matchGender;
  });

  // Filter teachers
  const filteredTeachers = teachers.filter((t) => {
    // 1. Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const fullName = `${t.firstName} ${t.lastName}`.toLowerCase();
      const email = t.email.toLowerCase();
      if (!fullName.includes(q) && !email.includes(q)) return false;
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
        action={activeTab === "teachers" && (
          <Button variant="success" onClick={openAddModal}>+ Add Teacher</Button>
        )}
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
              <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onReset={() => {
                  setSearchQuery("");
                  setStudentFilterGrade("All");
                  setStudentFilterSection("All");
                  setStudentFilterGender("All");
                }}
              >
                  <select
                    value={studentFilterGrade}
                    onChange={(e) => {
                        setStudentFilterGrade(e.target.value);
                        setStudentFilterSection("All");
                    }}
                  >
                    <option value="All">All Grades</option>
                    {gradeOptions.map((g) => (
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
                    {sectionOptions.map((sec) => (
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
                      <td>{s.nutritionStatus}</td>
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
