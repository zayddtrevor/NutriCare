import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";
import "./StudentTeacher.css";

/* ----------------------------- FEEDING_MAPPING (Reused for consistent section parsing) ----------------------------- */
const FEEDING_MAPPING = {
  K1: [
    "MASAYAHIN & MAPAGBIGAY", "AKTIBO & BAYANIHAN", "MASUNURIN & MAPAG-ALAGA", "MAGITING & MARIKIT",
    "MAHINHIN & MAKATAO", "MATIPID & MASIPAG", "MALAMBING & MAUNAWAIN", "MASIGLA & PAGKAKAISA",
    "KATAPATAN & MAPAGKAWANGGAWA", "KARANGALAN & MAALALAHANIN", "MATULUNGIN & KAAYA-AYA",
    "MAHUSAY & TAGUMPAY", "MASINOP & MATALINO", "MAYUMI & MAKISIG"
  ],
  K2: [
    "MAGALANG & MAGILIW", "MAKA-DIYOS & MAPAGMAHAL", "PAG-ASA & MABAIT", "MAPAGKUMBABA & KAGALAKAN",
    "MAPAGKAKATIWALAAN & MASIGASIG", "MATIYAGA & MATAPAT", "RESPONSABLE & MALIKHAIN",
    "PAKAKAIBIGAN & MAPARAAN", "MASIKAP & MAAGAP", "KAALAMAN & KARUNUNGAN", "MAKABAYAN"
  ],
  "1": ["FL AM", "PAKWAN", "SUHA", "SAMPALOK", "LANGKA", "MANGGA", "PERAS", "DALANDAN", "KAIMITO", "MANGOSTEEN", "RAMBUTAN", "DUHAT", "LANZONES", "POMELO", "BLUEBERRY", "KIWI", "FL PM", "MELON", "MACOPA", "BAYABAS", "CHERRY", "SAGING", "DURIAN", "KAHEL", "KASOY", "GUYABANO"],
  "2": ["FL NARRA", "ACACIA", "ALIBANGBANG", "AMUGIS", "APITONG", "BANABA", "KAMATSILE", "KAMUNING", "LANETE", "MAHOGANY", "PINO", "TALISAY", "TANGUILE", "TIBIG", "TOOG", "MAYAPIS", "NIPA", "FL IGOS", "KAMAGONG", "ANONANG", "CABALLERO", "DAPDAP", "GEMELINA", "IPIL-IPIL", "KALUMPIT", "LAWAAN", "MALUGAI", "MULAWIN", "MALABULAK", "MOLAVE", "OLIVA", "TINDALO", "YAKAL", "ALMACIGA", "BANI", "AROMA"],
  "3": ["ST. MARY", "ST. JOHN", "ST. DOMINIC", "ST. SEBASTIAN", "ST. VINCENT", "ST. AGNES", "ST. MICHAEL", "ST. CLEMENT", "ST. RAPHAEL", "ST. MARTIN", "ST. HELENA", "ST. MARK", "ST. CLARE", "ST. JOSEPH", "ST. THOMAS", "ST. EMMANUEL", "ST. LUKE", "ST. GABRIEL", "ST. PAUL", "ST. MATTHEW", "ST. DAVID", "ST. ANNE", "ST. ROSE", "ST. PATRICK", "ST. CATHERINE", "ST. THERESE", "ST. ELIZABETH", "ST. CASSIAN", "ST. PHILOMENA", "ST. FRANCIS", "ST. BENEDICT"],
  "4": ["FL - AM", "FL - PM", "ROSE", "ANTHURIUM", "ASTER", "BOUGAINVILLEA", "LILAC", "CARNATION", "GLADIOLA", "JASMINE", "ILANG - ILANG", "MARIGOLD", "DAFFODIL", "SUNFLOWER", "YELLOWBELL", "STARGAZER", "HYACINTH", "DAISY", "EVERLASTING", "WILDZINNIA", "TULIPS", "LAVENDER"],
  "5": ["FL AM", "HOMO", "CORAL", "EMERALD", "GOSHENITE", "IDOCRASE", "JASPER", "MOONSTONE", "PERIDOT", "SAPPHIRE", "YELLOW TOPAZ", "TOURMALINE", "FL PM", "HOMO", "APATITE", "BLUE TOPAZ", "CITRINE", "DIAMOND", "PEARL", "RUBY", "SARDONYX"],
  "6": ["FL AM JOSE RIZAL", "E. JACINTO", "E. AGUINALDO", "F. DAGOHOY", "MH. DEL PILAR", "S. KUDARAT", "M. PONCE", "F. BALTAZAR", "G. SILANG", "FL PM - ANDRES BONIFACIO", "P. URDUJA", "G. DEL PILAR", "D. SILANG", "M. SAKAY", "J. LUNA", "JL. ESCODA", "A. LUNA", "M. GOMEZ", "GL. JAENA", "A. MABINI", "V. LUCBAN"]
};

// --- Helper Functions ---
function normalizeSectionName(raw) {
  if (!raw && raw !== 0) return "";
  let s = String(raw).trim();
  s = s.replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "");
  s = s.replace(/[\u2012\u2013\u2014\u2015–—]/g, "-");
  s = s.replace(/[^\w\s&\.-]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s.toUpperCase();
}

const ROMAN_TO_NUM = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7 };
function parseGradePrefix(pref) {
  if (!pref) return null;
  const p = String(pref).trim().toUpperCase();
  const n = parseInt(p.replace(/\D/g, ""), 10);
  if (!isNaN(n) && n >= 1 && n <= 12) return String(n);
  const roman = p.replace(/[^IVXLCDM]/g, "");
  if (roman && ROMAN_TO_NUM[roman]) return String(ROMAN_TO_NUM[roman]);
  return null;
}

function inferGradeFromRaw(raw) {
  if (!raw && raw !== 0) return null;
  const s = String(raw).trim();
  if (!s) return null;

  const kMatch = s.match(/^\s*(K(?:1|2)?)\s*[-\s]?(.*)$/i);
  if (kMatch) {
    const kpref = kMatch[1].toUpperCase();
    const sec = normalizeSectionName(kMatch[2] || "");
    if (sec) {
      const foundK1 = (FEEDING_MAPPING.K1 || []).some(x => normalizeSectionName(x) === sec);
      const foundK2 = (FEEDING_MAPPING.K2 || []).some(x => normalizeSectionName(x) === sec);
      if (foundK1) return "K1";
      if (foundK2) return "K2";
    }
    if (/^K1$/i.test(kpref)) return "K1";
    if (/^K2$/i.test(kpref)) return "K2";
    return "K1";
  }

  const numMatch = s.match(/^\s*([0-9]{1,2})\s*[-\s]\s*(.*)$/);
  if (numMatch) {
    const g = parseInt(numMatch[1], 10);
    if (!isNaN(g)) return String(g);
  }

  const romanMatch = s.match(/^\s*([IVXLCDM]+)\s*[-\s]\s*(.*)$/i);
  if (romanMatch) {
    const parsed = parseGradePrefix(romanMatch[1]);
    if (parsed) return parsed;
  }

  const gradeWordMatch = s.match(/GRADE\s*([0-9]+)/i);
  if (gradeWordMatch) return String(parseInt(gradeWordMatch[1], 10));

  const secOnly = normalizeSectionName(s);
  if (secOnly) {
    for (const g of Object.keys(FEEDING_MAPPING)) {
      if ((FEEDING_MAPPING[g] || []).some(x => normalizeSectionName(x) === secOnly)) {
        return g;
      }
    }
  }
  return null;
}

function normalizeGradeSection(raw) {
  if (!raw && raw !== 0) return "UNKNOWN - UNKNOWN";
  const s = String(raw).trim();
  let prefix = null;
  let sectionPart = s;

  if (s.includes("-")) {
    const parts = s.split(/[-–—\u2013\u2014]/).map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      prefix = parts[0];
      sectionPart = parts.slice(1).join(" - ");
    }
  } else {
    const tokens = s.split(/\s+/);
    if (tokens.length > 1 && /^[0-9IVXLCDM]+$/i.test(tokens[0])) {
      prefix = tokens[0];
      sectionPart = tokens.slice(1).join(" ");
    }
  }

  const normalizedSection = normalizeSectionName(sectionPart);
  let inferredGrade = inferGradeFromRaw(s);

  if (!inferredGrade && prefix) {
    const parsed = parseGradePrefix(prefix);
    if (parsed) inferredGrade = parsed;
  }

  if (!inferredGrade && normalizedSection) {
    for (const g of Object.keys(FEEDING_MAPPING)) {
      if ((FEEDING_MAPPING[g] || []).some(x => normalizeSectionName(x) === normalizedSection)) {
        inferredGrade = g;
        break;
      }
    }
  }

  if (!inferredGrade) {
    if (/^K\b/i.test(s) || /^K-/.test(s)) inferredGrade = "K1";
    else inferredGrade = "UNKNOWN";
  }

  const outSection = normalizedSection || "UNKNOWN";
  return `${inferredGrade} - ${outSection}`;
}
/* --------------------------------------------------------------------------------------------------- */


export default function StudentTeacher() {
  const [activeTab, setActiveTab] = useState("students");

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(true);

  // Filters
  const [filterSection, setFilterSection] = useState("All");
  const [filterGender, setFilterGender] = useState("All");
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'

  // Modal State (Teachers)
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
    const { data, error } = await supabase.from("students").select("*");

    if (error) {
        console.error("Error fetching students:", error);
    } else {
        const mapped = data.map(s => ({
            id: s.id,
            name: s.name || s.full_name || "Unknown",
            // Normalize grade/section here
            gradeSection: normalizeGradeSection(s.grade_section || s.grade || ""),
            sex: s.sex || "-",
            nutritionStatus: s.nutrition_status || s.nutritionStatus || "-",
        }));
        setStudents(mapped);
    }
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
  // Filter Logic
  // =========================
  const uniqueSections = useMemo(() => {
    const sections = new Set(students.map(s => s.gradeSection));
    return ["All", ...Array.from(sections).sort()];
  }, [students]);

  const filteredStudents = useMemo(() => {
    let list = [...students];

    if (filterSection !== "All") {
      list = list.filter(s => s.gradeSection === filterSection);
    }

    if (filterGender !== "All") {
      list = list.filter(s => (s.sex || "").toUpperCase() === filterGender.toUpperCase());
    }

    list.sort((a, b) => {
      const nameA = a.name.toUpperCase();
      const nameB = b.name.toUpperCase();
      if (sortOrder === "asc") {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

    return list;
  }, [students, filterSection, filterGender, sortOrder]);


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
        deactivated_at: teacher.active ? new Date().toISOString() : null,
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
  return (
    <div className="student-page">
      <div className="header-area">
        <h1>Management</h1>
        {activeTab === "teachers" && (
          <div className="button-row">
            <button className="btn add" onClick={openAddModal}>+ Add Teacher</button>
          </div>
        )}
      </div>

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

      {/* FILTER BAR (Only for Students Tab) */}
      {activeTab === "students" && (
        <div className="filter-bar">
          {/* Section Filter */}
          <div className="filter-item">
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Section:</label>
            <select
              className="filter-select"
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
            >
              {uniqueSections.map((sec) => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="filter-item">
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Gender:</label>
            <select
              className="filter-select"
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
            >
              <option value="All">All</option>
              <option value="M">Male (M)</option>
              <option value="F">Female (F)</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="filter-item">
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Sort:</label>
            <select
              className="filter-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="asc">A-Z (Ascending)</option>
              <option value="desc">Z-A (Descending)</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-card">
          {activeTab === "students" && (
            <table className="people-table">
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
                     <td colSpan="4" style={{ textAlign: "center" }}>No students found.</td>
                   </tr>
                ) : (
                   filteredStudents.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.gradeSection}</td>
                      <td>{s.sex}</td>
                      <td>{s.nutritionStatus}</td>
                    </tr>
                   ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === "teachers" && (
            <table className="people-table">
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
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>No teachers found.</td>
                  </tr>
                ) : (
                  teachers.map((t) => (
                    <tr key={t.uid} className={!t.active ? "inactive" : ""}>
                      <td>{t.idNumber}</td>
                      <td>{t.firstName} {t.lastName}</td>
                      <td>{t.email}</td>
                      <td>{t.section}</td>
                      <td>{t.active ? "Active" : "Inactive"}</td>
                      <td className="actions-cell">
                        <button className="btn small edit" onClick={() => openEditModal(t)}>Edit</button>
                        <button
                          className={`btn small ${t.active ? "deactivate" : "activate"}`}
                          onClick={() => toggleActive(t)}
                        >
                          {t.active ? "Deactivate" : "Activate"}
                        </button>
                        <button className="btn small delete" onClick={() => deleteTeacher(t)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                <button className="btn add" type="submit">Save</button>
                <button className="btn cancel" type="button" onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
