import { supabase } from "../supabaseClient";

/**
 * Fetches the total count of students, optionally filtered by grade, section, and sex.
 * @param {Object} filters - Optional filters
 * @param {string} [filters.grade] - Grade level to filter by
 * @param {string} [filters.section] - Section to filter by
 * @param {string} [filters.sex] - Sex to filter by ('M' or 'F')
 * @returns {Promise<number>} - The count of students
 */
export async function getTotalStudents(filters = {}) {
  let query = supabase.from("students").select("id", { count: "exact", head: true });

  if (filters.grade && filters.grade !== "All" && filters.grade !== "All Grades") {
    query = query.eq("grade_level", filters.grade);
  }

  if (filters.section && filters.section !== "All" && filters.section !== "All Sections") {
    query = query.eq("section", filters.section);
  }

  if (filters.sex && filters.sex !== "All" && filters.sex !== "All Genders") {
    query = query.eq("sex", filters.sex);
  }

  const { count, error } = await query;

  if (error) {
    console.error("Error fetching student count:", error);
    return 0;
  }

  return count || 0;
}
