// src/pages/FeedingNutrition.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Upload, CalendarDays, Filter, X } from "lucide-react";
import { format } from "date-fns";
import "./FeedingNutrition.css";

import { supabase } from "../supabaseClient";

/* ----------------------------- FEEDING_MAPPING ----------------------------- */
const FEEDING_MAPPING = {
  K1: [
    "MASAYAHIN & MAPAGBIGAY",
    "AKTIBO & BAYANIHAN",
    "MASUNURIN & MAPAG-ALAGA",
    "MAGITING & MARIKIT",
    "MAHINHIN & MAKATAO",
    "MATIPID & MASIPAG",
    "MALAMBING & MAUNAWAIN",
    "MASIGLA & PAGKAKAISA",
    "KATAPATAN & MAPAGKAWANGGAWA",
    "KARANGALAN & MAALALAHANIN",
    "MATULUNGIN & KAAYA-AYA",
    "MAHUSAY & TAGUMPAY",
    "MASINOP & MATALINO",
    "MAYUMI & MAKISIG",
  ],
  K2: [
    "MAGALANG & MAGILIW",
    "MAKA-DIYOS & MAPAGMAHAL",
    "PAG-ASA & MABAIT",
    "MAPAGKUMBABA & KAGALAKAN",
    "MAPAGKAKATIWALAAN & MASIGASIG",
    "MATIYAGA & MATAPAT",
    "RESPONSABLE & MALIKHAIN",
    "PAKAKAIBIGAN & MAPARAAN",
    "MASIKAP & MAAGAP",
    "KAALAMAN & KARUNUNGAN",
    "MAKABAYAN",
  ],
  "1": [
    "FL AM",
    "PAKWAN",
    "SUHA",
    "SAMPALOK",
    "LANGKA",
    "MANGGA",
    "PERAS",
    "DALANDAN",
    "KAIMITO",
    "MANGOSTEEN",
    "RAMBUTAN",
    "DUHAT",
    "LANZONES",
    "POMELO",
    "BLUEBERRY",
    "KIWI",
    "FL PM",
    "MELON",
    "MACOPA",
    "BAYABAS",
    "CHERRY",
    "SAGING",
    "DURIAN",
    "KAHEL",
    "KASOY",
    "GUYABANO",
  ],
  "2": [
    "FL NARRA",
    "ACACIA",
    "ALIBANGBANG",
    "AMUGIS",
    "APITONG",
    "BANABA",
    "KAMATSILE",
    "KAMUNING",
    "LANETE",
    "MAHOGANY",
    "PINO",
    "TALISAY",
    "TANGUILE",
    "TIBIG",
    "TOOG",
    "MAYAPIS",
    "NIPA",
    "FL IGOS",
    "KAMAGONG",
    "ANONANG",
    "CABALLERO",
    "DAPDAP",
    "GEMELINA",
    "IPIL-IPIL",
    "KALUMPIT",
    "LAWAAN",
    "MALUGAI",
    "MULAWIN",
    "MALABULAK",
    "MOLAVE",
    "OLIVA",
    "TINDALO",
    "YAKAL",
    "ALMACIGA",
    "BANI",
    "AROMA",
  ],
  "3": [
    "ST. MARY",
    "ST. JOHN",
    "ST. DOMINIC",
    "ST. SEBASTIAN",
    "ST. VINCENT",
    "ST. AGNES",
    "ST. MICHAEL",
    "ST. CLEMENT",
    "ST. RAPHAEL",
    "ST. MARTIN",
    "ST. HELENA",
    "ST. MARK",
    "ST. CLARE",
    "ST. JOSEPH",
    "ST. THOMAS",
    "ST. EMMANUEL",
    "ST. LUKE",
    "ST. GABRIEL",
    "ST. PAUL",
    "ST. MATTHEW",
    "ST. DAVID",
    "ST. ANNE",
    "ST. ROSE",
    "ST. PATRICK",
    "ST. CATHERINE",
    "ST. THERESE",
    "ST. ELIZABETH",
    "ST. CASSIAN",
    "ST. PHILOMENA",
    "ST. FRANCIS",
    "ST. BENEDICT",
  ],
  "4": [
    "FL - AM",
    "FL - PM",
    "ROSE",
    "ANTHURIUM",
    "ASTER",
    "BOUGAINVILLEA",
    "LILAC",
    "CARNATION",
    "GLADIOLA",
    "JASMINE",
    "ILANG - ILANG",
    "MARIGOLD",
    "DAFFODIL",
    "SUNFLOWER",
    "YELLOWBELL",
    "STARGAZER",
    "HYACINTH",
    "DAISY",
    "EVERLASTING",
    "WILDZINNIA",
    "TULIPS",
    "LAVENDER",
  ],
  "5": [
    "FL AM",
    "HOMO",
    "CORAL",
    "EMERALD",
    "GOSHENITE",
    "IDOCRASE",
    "JASPER",
    "MOONSTONE",
    "PERIDOT",
    "SAPPHIRE",
    "YELLOW TOPAZ",
    "TOURMALINE",
    "FL PM",
    "HOMO",
    "APATITE",
    "BLUE TOPAZ",
    "CITRINE",
    "DIAMOND",
    "PEARL",
    "RUBY",
    "SARDONYX",
  ],
  "6": [
    "FL AM JOSE RIZAL",
    "E. JACINTO",
    "E. AGUINALDO",
    "F. DAGOHOY",
    "MH. DEL PILAR",
    "S. KUDARAT",
    "M. PONCE",
    "F. BALTAZAR",
    "G. SILANG",
    "FL PM - ANDRES BONIFACIO",
    "P. URDUJA",
    "G. DEL PILAR",
    "D. SILANG",
    "M. SAKAY",
    "J. LUNA",
    "JL. ESCODA",
    "A. LUNA",
    "M. GOMEZ",
    "GL. JAENA",
    "A. MABINI",
    "V. LUCBAN",
  ],
};

const FEEDING_GRADES = ["K1", "K2", "1", "2", "3", "4", "5", "6"];

// Normalize a section string: remove punctuation quirks, normalize whitespace, uppercase
function normalizeSectionName(raw) {
  if (!raw && raw !== 0) return "";
  let s = String(raw).trim();
  // remove surrounding quotes
  s = s.replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "");
  // convert long dashes to hyphen, collapse multiple spaces
  s = s.replace(/[\u2012\u2013\u2014\u2015–—]/g, "-");
  s = s.replace(/[^\w\s&\.-]/g, " "); // allow & . - and words
  s = s.replace(/\s+/g, " ").trim();
  return s.toUpperCase();
}

// parse grade prefix tolerant: arabic or roman numerals
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

  // Check for explicit K or K1/K2 variants
  const kMatch = s.match(/^\s*(K(?:1|2)?)\s*[-\s]?(.*)$/i);
  if (kMatch) {
    const kpref = kMatch[1].toUpperCase();
    const sec = normalizeSectionName(kMatch[2] || "");
    if (sec) {
      // if section exists in mapping choose which K
      const foundK1 = (FEEDING_MAPPING.K1 || []).some(x => normalizeSectionName(x) === sec);
      const foundK2 = (FEEDING_MAPPING.K2 || []).some(x => normalizeSectionName(x) === sec);
      if (foundK1) return "K1";
      if (foundK2) return "K2";
    }
    if (/^K1$/i.test(kpref)) return "K1";
    if (/^K2$/i.test(kpref)) return "K2";
    return "K1"; // default to K1 if uncertain
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

  // section-only: consult FEEDING_MAPPING lists
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

  // If we only found a prefix, try parse it
  if (!inferredGrade && prefix) {
    const parsed = parseGradePrefix(prefix);
    if (parsed) inferredGrade = parsed;
  }

  // If still not inferred, try to match the normalizedSection in mapping
  if (!inferredGrade && normalizedSection) {
    for (const g of Object.keys(FEEDING_MAPPING)) {
      if ((FEEDING_MAPPING[g] || []).some(x => normalizeSectionName(x) === normalizedSection)) {
        inferredGrade = g;
        break;
      }
    }
  }

  // final fallback rules
  if (!inferredGrade) {
    // treat plain "K-..." as K1
    if (/^K\b/i.test(s) || /^K-/.test(s)) inferredGrade = "K1";
    else inferredGrade = "UNKNOWN";
  }

  // For nicer display, ensure section is present
  const outSection = normalizedSection || "UNKNOWN";
  return `${inferredGrade} - ${outSection}`;
}

/* ----------------------- NAME MATCHING HELPERS ----------------------------- */
// tolerant name tokenization and loose matching for imported SBFP rows -> students
function tokenizeName(n) {
  if (!n) return [];
  const cleaned = String(n)
    .replace(/,/g, " ")
    .replace(/[^\w\s'-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.toLowerCase().split(" ").filter(Boolean);
}

function canonicalNameVariants(n) {
  const tokens = tokenizeName(n);
  if (tokens.length === 0) return [""];
  const full = tokens.join(" ");
  const last = tokens[tokens.length - 1];
  const first = tokens[0];
  const firstTwo = tokens.slice(0, 2).join(" ");
  const lastFirst = `${last} ${first}`;
  const lastFirstTwo = `${last} ${firstTwo}`;
  const firstLast = `${first} ${last}`;
  return [...new Set([full, lastFirst, lastFirstTwo, firstLast])];
}

function namesLooseMatch(a, b) {
  if (!a || !b) return false;
  const av = canonicalNameVariants(a);
  const bv = canonicalNameVariants(b);
  for (const x of av) {
    for (const y of bv) {
      if (!x || !y) continue;
      if (x === y) return true;
      if (x.includes(y) || y.includes(x)) return true;
      const atoks = x.split(" ");
      const btoks = y.split(" ");
      const common = atoks.filter(t => btoks.includes(t));
      if (common.length >= 1) return true;
    }
  }
  return false;
}

/* ------------------------- React Component ------------------------------- */
export default function FeedingNutrition() {
  // data
  const [studentsList, setStudentsList] = useState([]);
  const [studentsMap, setStudentsMap] = useState({});
  const [attendanceIndex, setAttendanceIndex] = useState({}); // date -> { studentId: "Present" }
  const [sbfpDocs, setSbfpDocs] = useState([]); // raw imported rows
  const [sbfpOnlyList, setSbfpOnlyList] = useState([]); // SBFP rows not matched to students

  // UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeGrade, setActiveGrade] = useState("K1");
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showDetails, setShowDetails] = useState(null);
  const [feedView, setFeedView] = useState("all"); // "all" | "sbfp"
  const [refreshKey, setRefreshKey] = useState(0);

  const todayKey = format(new Date(), "yyyy-MM-dd");
  const CACHE_KEY = "feeding_cache_v2";

  const cacheSet = (payload) => {
    try {
      const toStore = { ts: Date.now(), payload };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(toStore));
    } catch {}
  };

  const cacheGet = (maxAgeMs = 1000 * 60 * 3) => {
    try {
      const s = sessionStorage.getItem(CACHE_KEY);
      if (!s) return null;
      const parsed = JSON.parse(s);
      if (!parsed || !parsed.ts || !parsed.payload) return null;
      if (Date.now() - parsed.ts > maxAgeMs) return null;
      return parsed.payload;
    } catch {
      return null;
    }
  };

  const clearCache = () => sessionStorage.removeItem(CACHE_KEY);

  // fetch routine
  const fetchAll = useCallback(async (opts = { useCache: true }) => {
    setLoading(true);
    setError(null);

    // try cache
    if (opts.useCache) {
      const cached = cacheGet();
      if (cached) {
        setStudentsList(cached.studentsList || []);
        setStudentsMap(cached.studentsMap || {});
        setAttendanceIndex(cached.attendanceIndex || {});
        setSbfpDocs(cached.sbfpDocs || []);
        setSbfpOnlyList(cached.sbfpOnlyList || []);
        setLoading(false);
        return;
      }
    }

    try {
      // 1) students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*");

      if (studentsError) throw studentsError;

      const sList = [];
      const sMap = {};

      studentsData.forEach((data) => {
        const id = data.id;

        const nameVal =
          (data.name || data.full_name || "").toString().trim();

        const rawGrade =
          data.grade_section || data.grade || "";

        const normalizedGS = normalizeGradeSection(rawGrade);

        const normalized = {
          id,
          name: nameVal,
          sex: data.sex || "",
          gradeSection: normalizedGS,
          raw: data,
          weight: data.weight ?? null,
          height: data.height ?? null,
          bmi: data.bmi ?? null,
          nutritionStatus: data.nutrition_status || "Unknown",
        };

        sList.push(normalized);
        sMap[id] = normalized;
      });

      // 2) sbfp beneficiaries (imported)
      let sbfpSnapList = [];
      try {
        // Code commented out as it relies on undefined variables and causes build errors
        // const sbfpCol = collection(db, "sbfpBeneficiaries");
        // const sbfpSnap = await getDocs(sbfpCol);
        /*
        const docs = [];
        sbfpSnap.forEach((d) => {
          const dd = { id: d.id, ...(d.data() || {}) };
          // normalize name + gradeSection fields we saw in CSV
          dd.name = (dd.name || dd.Name || "").toString().trim();
          dd.rawGradeSection = dd.gradeSection || dd["Grade/ Section"] || dd.rawGradeSection || dd["Grade/ Section"] || "";
          dd.gradeSection = normalizeGradeSection(dd.rawGradeSection);
          dd.weightKg = dd.weightKg ?? dd.weight ?? dd["Weight (Kg)"] ?? null;
          dd.height = dd.height ?? dd["Height (cm)"] ?? null;
          dd.bmi = dd.bmi ?? null;
          dd.nutritionStatus = dd.nutritionStatus || dd["Nutritional Status (NS)"] || dd["Nutritional Status"] || "Unknown";
          docs.push(dd);
        });
        sbfpSnapList = docs;
        */
      } catch (e) {
        // missing collection or permission; we'll just treat as empty
        sbfpSnapList = [];
      }

      // 3) match SBFP rows to students by name (loose) and gradeSection if possible
      const sbfpByMatched = new Map();
      const matchedSbfpIds = new Set();
      const studentMatches = {}; // studentId -> sbfpDoc

      // Build quick index by normalized student name keys for faster matching
      const studentNameIndex = sList.reduce((acc, s) => {
        const key = (s.name || "").toString().trim().toUpperCase();
        if (!acc[key]) acc[key] = [];
        acc[key].push(s);
        return acc;
      }, {});

      for (const b of sbfpSnapList) {
        let matchedStudent = null;

        // First try direct uppercase match
        const key = (b.name || "").toString().trim().toUpperCase();
        if (key && studentNameIndex[key] && studentNameIndex[key].length === 1) {
          matchedStudent = studentNameIndex[key][0];
        } else {
          // loose name match across all students (but prefer matching same gradeSection)
          for (const s of sList) {
            if (namesLooseMatch(s.name, b.name)) {
              // prefer when gradeSection normalized matches
              if (s.gradeSection === b.gradeSection) {
                matchedStudent = s;
                break;
              }
              if (!matchedStudent) matchedStudent = s;
            }
          }
        }
        if (matchedStudent) {
          studentMatches[matchedStudent.id] = b;
          matchedSbfpIds.add(b.id);
        }
      }

      const sbfpOnly = sbfpSnapList.filter((b) => !matchedSbfpIds.has(b.id));

      // 4) attendance index
      //const attRoot = collection(db, "attendance");
      //const teacherDocs = await getDocs(attRoot);
      const attIdx = {};
      /*
      for (const tdoc of teacherDocs.docs) {
        const teacherId = tdoc.id;
        try {
          const datesCol = collection(db, "attendance", teacherId, "dates");
          const datesSnap = await getDocs(datesCol);
          datesSnap.forEach((d) => {
            const dateId = d.id;
            const data = d.data() || {};
            const records = data.records && typeof data.records === "object" ? data.records : {};
            if (!attIdx[dateId]) attIdx[dateId] = {};
            Object.keys(records).forEach((sid) => {
              const v = records[sid];
              if (typeof v === "string") {
                attIdx[dateId][sid] = v;
              }
            });
          });
        } catch (e) {
          // skip teacher if permission issue or malformed doc
          console.warn("Attendance parse error for teacher", teacherId, e);
        }
      }
      */

      // Persist to cache so next load is faster
      const payload = {
        studentsList: sList,
        studentsMap: sMap,
        attendanceIndex: attIdx,
        sbfpDocs: sbfpSnapList,
        sbfpOnlyList: sbfpOnly,
      };
      cacheSet(payload);

      // set state
      setStudentsList(sList);
      setStudentsMap(sMap);
      setAttendanceIndex(attIdx);
      setSbfpDocs(sbfpSnapList);
      setSbfpOnlyList(sbfpOnly);
      setLoading(false);
    } catch (err) {
      console.error("Feeding fetch failed:", err);
      setError("Failed to fetch feeding data. Try refresh or check rules.");
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => {
    fetchAll({ useCache: true });
  }, [fetchAll, refreshKey]);

  // Refresh / retry helpers
  const handleRetry = () => {
    clearCache();
    setRefreshKey((n) => n + 1);
    fetchAll({ useCache: false });
  };

  // construct active pool depending on feedView
  const activePool = useMemo(() => {
    // produce merged students with attached sbfp info where matched
    const merged = studentsList.map((s) => {
      // find sbfp doc by loose name match (we already matched in fetch but re-check)
      const matched = sbfpDocs.find((b) => namesLooseMatch(s.name, b.name));
      if (matched) {
        return {
          ...s,
          gradeSection: matched.gradeSection || s.gradeSection,
          sbfpId: matched.id,
          sbfpRaw: matched,
          nutritionStatus: matched.nutritionStatus || s.nutritionStatus,
          bmi: matched.bmi ?? s.bmi,
          weight: matched.weightKg ?? s.weight,
          height: matched.height ?? s.height,
        };
      }
      return s;
    });

    if (feedView === "sbfp") {
      const matchedStudents = merged.filter((m) => m.sbfpId);
      const sbfpOnlyRows = sbfpOnlyList.map((b) => ({
        id: `sbfp-${b.id}`,
        name: b.name,
        sex: b.sex || "",
        gradeSection: b.gradeSection,
        nutritionStatus: b.nutritionStatus || "Unknown",
        bmi: b.bmi ?? null,
        weight: b.weightKg ?? null,
        height: b.height ?? null,
        sbfpOnly: true,
        sbfpRaw: b,
      }));
      // dedupe by name/grade if weird duplicates (use id uniqueness)
      return [...matchedStudents, ...sbfpOnlyRows];
    }
    // all students view
    return merged;
  }, [studentsList, sbfpDocs, sbfpOnlyList, feedView]);

  // summary and filtering
  const { summary, filteredStudents } = useMemo(() => {
    const gradeKey = activeGrade;
    const rows = activePool.filter((s) => {
      const gs = (s.gradeSection || "").toUpperCase();
      const gPart = gs.split(" - ")[0].trim();
      if (gradeKey.startsWith("K")) {
        if (gradeKey === "K1") {
          return gPart === "K1" || gPart === "K";
        }
        if (gradeKey === "K2") return gPart === "K2";
        return gPart.startsWith("K");
      } else {
        return gPart === gradeKey || gPart === `GRADE ${gradeKey}` || gPart === `${gradeKey}`;
      }
    });

    const total = rows.length;
    const presentMap = attendanceIndex[todayKey] || {};
    let present = 0;
    rows.forEach((r) => {
      // attendance keys might be student doc id or sbfp imported id
      const isPresent =
        presentMap[r.id] === "Present" ||
        (r.sbfpRaw && presentMap[r.sbfpRaw.id] === "Present") ||
        presentMap[String(r.id)] === "Present";
      if (isPresent) present++;
    });
    const absent = Math.max(0, total - present);

    const statusCounts = {};
    rows.forEach((r) => {
      const st = (r.nutritionStatus || "Unknown").toString();
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    });

    // UI filters
    const filtered = rows.filter((r) => {
      if (selectedSection !== "All") {
        const sec = (r.gradeSection || "").split(" - ")[1] || "";
        if (sec.toUpperCase() !== selectedSection.toUpperCase()) return false;
      }
      if (statusFilter !== "All") {
        if ((r.nutritionStatus || "Unknown").toUpperCase() !== statusFilter.toUpperCase()) return false;
      }
      if (search && search.trim().length > 0) {
        const q = search.trim().toLowerCase();
        const nameMatches = (r.name || "").toLowerCase().includes(q);
        const gradeMatches = (r.gradeSection || "").toLowerCase().includes(q);
        if (!nameMatches && !gradeMatches) return false;
      }
      return true;
    });

    return {
      summary: {
        total,
        present,
        absent,
        pct: total ? ((present / total) * 100).toFixed(1) : "0.0",
        statusCounts,
      },
      filteredStudents: filtered,
    };
  }, [activePool, attendanceIndex, todayKey, activeGrade, selectedSection, statusFilter, search]);

  /* --------------------------- UI pieces --------------------------------- */
  function SummaryBoxes({ s }) {
    return (
      <div className="summary-row">
        <div className="summary-card">
          <div className="card-title">Total Students</div>
          <div className="card-value">{s.total}</div>
        </div>
        <div className="summary-card">
          <div className="card-title">Present Today</div>
          <div className="card-value">{s.present}</div>
        </div>
        <div className="summary-card">
          <div className="card-title">Absent Today</div>
          <div className="card-value">{s.absent}</div>
        </div>
        <div className="summary-card">
          <div className="card-title">Attendance %</div>
          <div className="card-value">{s.pct}%</div>
        </div>
        <div className="summary-card status-chip">
          <div className="card-title">Nutrition</div>
          <div className="card-value small">
            {Object.keys(s.statusCounts)
              .slice(0, 5)
              .map((k) => (
                <span key={k} className="status-pill">
                  {k}: {s.statusCounts[k]}
                </span>
              ))}
          </div>
        </div>
      </div>
    );
  }

  const GRADE_TABS = [
    { key: "K1", label: "K1", tip: "Kinder 1" },
    { key: "K2", label: "K2", tip: "Kinder 2" },
    { key: "1", label: "G1", tip: "Grade 1" },
    { key: "2", label: "G2", tip: "Grade 2" },
    { key: "3", label: "G3", tip: "Grade 3" },
    { key: "4", label: "G4", tip: "Grade 4" },
    { key: "5", label: "G5", tip: "Grade 5" },
    { key: "6", label: "G6", tip: "Grade 6" },
  ];

  function GradeTabs() {
    return (
      <div className="tab-row">
        {GRADE_TABS.map((t) => (
          <button
            key={t.key}
            title={t.tip}
            className={`tab-btn ${activeGrade === t.key ? "active-tab" : ""}`}
            onClick={() => {
              setActiveGrade(t.key);
              setSelectedSection("All");
              setStatusFilter("All");
              setSearch("");
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    );
  }

  function StudentTable({ rows }) {
    return (
      <div className="table-card">
        <table className="people-table attendance-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Grade & Section</th>
              <th>Nutrition Status</th>
              <th>BMI</th>
              <th>Present</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-6 text-center italic">
                  No students found
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const presentVal = (attendanceIndex[todayKey] || {})[r.id] === "Present";
                const bmiVal = r.bmi ?? "-";
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3">{r.gradeSection}</td>
                    <td className="px-4 py-3">{r.nutritionStatus || "Unknown"}</td>
                    <td className="px-4 py-3">{bmiVal}</td>
                    <td className="px-4 py-3 text-center">{presentVal ? "Present" : "Absent"}</td>
                    <td className="px-4 py-3 text-center">
                      <button className="btn small" onClick={() => setShowDetails(r.id)}>
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }

  /* ----------------------------- Render --------------------------------- */
  return (
    <div className="feeding-nutrition-page">
      <div className="meal-banner card-fullwidth">
        <div className="meal-left">
          <h2 className="meal-title">🍽️ Meal for Today</h2>
          <h3 className="meal-name">Rotating Menu — Placeholder</h3>
          <p className="meal-desc">Chicken adobo, brown rice, mixed vegetables (placeholder)</p>
          <div className="meal-meta">Date: {todayKey}</div>
        </div>
        <div className="meal-right">
          <div className="meal-img-placeholder">Image</div>
        </div>
      </div>

      <div className="view-toggle-row">
        <div className="view-toggle">
          <button className={`pill ${feedView === "all" ? "active" : ""}`} onClick={() => setFeedView("all")}>
            All Students
          </button>
          <button className={`pill ${feedView === "sbfp" ? "active" : ""}`} onClick={() => setFeedView("sbfp")}>
            SBFP Only
          </button>
        </div>

        <div style={{ marginLeft: 12 }}>
          <button className="btn small" onClick={() => { clearCache(); setRefreshKey(k => k + 1); }}>
            Refresh (clear cache)
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-item">
          <input placeholder="Search name or section..." value={search} onChange={(e) => setSearch(e.target.value)} className="filter-input" />
        </div>

        <div className="filter-item">
          <select className="filter-select" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
            <option value="All">All Sections</option>
            {(FEEDING_MAPPING[activeGrade] || []).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Nutrition Status</option>
            <option value="Normal">Normal</option>
            <option value="Stunted">Stunted</option>
            <option value="Overweight">Overweight</option>
            <option value="Obese">Obese</option>
            <option value="Wasted">Wasted</option>
          </select>
        </div>

        <div className="filter-item">
          <button className="btn-apply-filter" onClick={() => { /* state-driven */ }}>
            Apply
          </button>
        </div>
      </div>

      <GradeTabs />

      <div style={{ marginTop: 12 }}>
        {loading ? (
          // basic loading skeleton
          <div style={{ padding: 24 }}>
            <div style={{ background: "#f3f4f6", height: 18, width: 220, marginBottom: 8 }} />
            <div style={{ background: "#f3f4f6", height: 14, width: 120, marginBottom: 12 }} />
            <div style={{ background: "#f3f4f6", height: 300 }} />
          </div>
        ) : error ? (
          <div style={{ padding: 24 }}>
            <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>
            <button className="btn add" onClick={handleRetry}>
              Retry
            </button>
          </div>
        ) : (
          <>
            <SummaryBoxes s={summary} />
            <StudentTable rows={filteredStudents} />
          </>
        )}
      </div>

      {showDetails && (() => {
        const s = studentsMap[showDetails] || filteredStudents.find((f) => f.id === showDetails) || null;
        if (!s) return null;
        return (
          <div className="modal-overlay" onClick={() => setShowDetails(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{s.name}</h3>
                <button className="close-btn" onClick={() => setShowDetails(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Grade & Section:</strong> {s.gradeSection}
                </p>
                <p>
                  <strong>Nutrition Status:</strong> {s.nutritionStatus}
                </p>
                <p>
                  <strong>BMI:</strong> {s.bmi ?? "-"}
                </p>
                <p>
                  <strong>Weight:</strong> {s.weight ?? "-"} kg
                </p>
                <p>
                  <strong>Height:</strong> {s.height ?? "-"} m
                </p>
                <p>
                  <strong>Sex:</strong> {s.sex ?? "-"}
                </p>
                {s.sbfpOnly && <p style={{ color: "#666", marginTop: 8 }}>This entry is from SBFP import and has no matched student doc.</p>}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
