import { SCHOOL_DATA } from "../constants/schoolData";

export function normalizeStudent(student) {
  if (!student) return null;

  let grade = (student.grade_level || "").toString().trim();
  let section = (student.section || "").toString().trim();

  // Normalize Grade Level
  let normalizedGrade = grade;

  // Map common variations to canonical keys in SCHOOL_DATA
  const gradeMap = {
    "K": "K1",
    "Kinder 1": "K1",
    "Kinder 2": "K2",
    "1": "GRADE 1",
    "Grade 1": "GRADE 1",
    "2": "GRADE 2",
    "Grade 2": "GRADE 2",
    "3": "GRADE 3",
    "Grade 3": "GRADE 3",
    "4": "GRADE 4",
    "Grade 4": "GRADE 4",
    "5": "GRADE 5",
    "Grade 5": "GRADE 5",
    "6": "GRADE 6",
    "Grade 6": "GRADE 6",
  };

  // If the raw grade is a key in the map, use the value.
  // Also check if the raw grade is already a valid key (e.g. "K1").
  if (gradeMap[grade]) {
    normalizedGrade = gradeMap[grade];
  } else if (SCHOOL_DATA[grade]) {
    normalizedGrade = grade;
  } else if (SCHOOL_DATA[grade.toUpperCase()]) {
    normalizedGrade = grade.toUpperCase();
  }

  // Normalize Section
  let normalizedSection = section;
  const validSections = SCHOOL_DATA[normalizedGrade];

  if (validSections) {
    // Try to find a case-insensitive match
    const match = validSections.find(
      (s) => s.toLowerCase() === section.toLowerCase()
    );
    if (match) {
      normalizedSection = match;
    }
  }

  return {
    ...student,
    grade_level: normalizedGrade,
    section: normalizedSection,
    // Add a display helper if needed, but components often construct it themselves
    gradeSectionDisplay: `${normalizedGrade} - ${normalizedSection}`
  };
}
