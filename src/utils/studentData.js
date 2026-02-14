import { supabase } from "../supabaseClient";

/**
 * Fetches the total count of students, optionally filtered by grade and section.
 * @param {Object} filters - Optional filters
 * @param {string} [filters.grade] - Grade level to filter by
 * @param {string} [filters.section] - Section to filter by
 * @returns {Promise<number>} - The count of students
 */
export async function getTotalStudents(filters = {}) {
  let query = supabase.from("students").select("id", { count: "exact", head: true });

  if (filters.grade && filters.grade !== "All" && filters.grade !== "All Grades") {
    // We might need to handle normalization if the DB has mixed values,
    // but usually exact match on what's in DB is expected.
    // However, the UI uses normalized grades (e.g. "Kinder 1").
    // The DB might have "Kinder 1", "K1", etc.
    // The user code in StudentTeacher.jsx uses normalizeGrade on data fetched.
    // If we filter server side, we must match what is in DB.
    // Assuming the filters passed here match the DB values or we need to try multiple?
    // For now, let's assume direct match or let the caller handle it.
    query = query.eq("grade_level", filters.grade);
  }

  if (filters.section && filters.section !== "All" && filters.section !== "All Sections") {
    query = query.eq("section", filters.section);
  }

  const { count, error } = await query;

  if (error) {
    console.error("Error fetching student count:", error);
    return 0;
  }

  return count || 0;
}
