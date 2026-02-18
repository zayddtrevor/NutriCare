import { supabase } from "../supabaseClient";
import { normalizeGrade } from "../constants/schoolData";

/**
 * Service for fetching student-related data from Supabase.
 * Centralizes all queries as requested.
 */

// Fetch total count of students
export const fetchTotalStudentCount = async () => {
  const { count, error } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error fetching student count:", error);
    throw error;
  }
  return count;
};

// Fetch all students (raw data)
export const fetchStudents = async () => {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .range(0, 9999);

  if (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
  return data;
};

// Fetch all BMI records, ordered by created_at desc
export const fetchBmiRecords = async () => {
  const { data, error } = await supabase
    .from("bmi_records")
    .select("*")
    .order("created_at", { ascending: false })
    .range(0, 9999);

  if (error) {
    console.error("Error fetching BMI records:", error);
    throw error;
  }
  return data;
};

// Fetch attendance records, optionally filtered by date
export const fetchAttendance = async (dateStr = null) => {
  let query = supabase.from("attendance").select("*").range(0, 9999);

  if (dateStr) {
    query = query.eq("date", dateStr);
  }

  const { data, error } = await query;

  if (error) {
    // Attendance table might not exist or return error in some environments, handle gracefully if needed
    console.error("Error fetching attendance:", error);
    // Return empty array to avoid breaking UI if table is missing/error
    return [];
  }
  return data;
};

// Fetch SBFP beneficiaries
export const fetchSbfpBeneficiaries = async () => {
  const { data, error } = await supabase
    .from("sbfp_beneficiaries")
    .select("student_id")
    .range(0, 9999);

  if (error) {
    console.error("Error fetching SBFP beneficiaries:", error);
    return [];
  }
  return data;
};

/**
 * Composite function to fetch students and their latest nutrition status.
 * This is the "clean data flow" requested: fetch once, process, return ready-to-use objects.
 */
export const fetchStudentsWithNutrition = async () => {
  // Parallel fetch for performance
  const [studentsRes, bmiRes] = await Promise.allSettled([
    fetchStudents(),
    fetchBmiRecords()
  ]);

  const students = studentsRes.status === "fulfilled" ? studentsRes.value : [];
  const bmiRecords = bmiRes.status === "fulfilled" ? bmiRes.value : [];

  // Map student_id -> latest BMI record
  const bmiMap = {};
  bmiRecords.forEach((r) => {
    if (r.student_id && !bmiMap[r.student_id]) {
      bmiMap[r.student_id] = r;
    }
  });

  // Process and return enhanced student objects
  return students.map((s) => {
    const bmiRecord = bmiMap[s.id];

    // Normalize grade
    const rawGrade = (s.grade_level || "").toString();
    const normalizedGrade = normalizeGrade(rawGrade);
    const section = s.section || "";

    // Determine status: prefer latest BMI record, fallback to student record, default "Unknown"
    const status = bmiRecord?.nutrition_status || s.nutrition_status || s.nutritionStatus || "Unknown";

    // Determine BMI value
    const bmiValue = bmiRecord?.bmi || s.bmi || null;
    const weight = bmiRecord?.weight_kg || s.weight || null;
    const height = bmiRecord?.height_m || s.height || null;

    return {
      id: s.id,
      name: s.name || s.full_name || "Unknown",
      gradeLevel: normalizedGrade,
      rawGrade: rawGrade,
      section: section,
      gradeSectionDisplay: (normalizedGrade && section) ? `${normalizedGrade} - ${section}` : (normalizedGrade || section || "Unknown"),
      sex: s.sex || "-",
      birthDate: s.birth_date || s.dob || null,
      nutritionStatus: status,
      bmi: bmiValue ? parseFloat(bmiValue).toFixed(1) : "-",
      weight: weight,
      height: height,
      // Helper for filtering
      searchString: `${s.name || ""} ${normalizedGrade || ""} ${section || ""}`.toLowerCase()
    };
  });
};
