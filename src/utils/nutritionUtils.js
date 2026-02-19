/**
 * Normalizes nutrition status to a consistent format.
 * Maps variations like "severely_wasted", "Severely Wasted", "severely wasted" to "Severely Wasted".
 * Maps empty or invalid values to "Unknown".
 *
 * @param {string|null} status - The nutrition status string to normalize.
 * @returns {string} - The normalized nutrition status.
 */
export const normalizeNutritionStatus = (status) => {
  if (!status) return "Unknown";
  const s = String(status).trim().toLowerCase();

  // Basic normalization
  if (s === "normal") return "Normal";
  if (s === "wasted") return "Wasted";
  if (s === "severely wasted" || s === "severely_wasted") return "Severely Wasted";
  if (s === "overweight") return "Overweight";
  if (s === "obese") return "Obese";

  // Handle specific edge cases or legacy values if any
  if (s === "unknown" || s === "-" || s === "?") return "Unknown";

  return "Unknown"; // Default to Unknown for unrecognized values
};

/**
 * Maps normalized nutrition statuses to semantic color names.
 * These colors should correspond to CSS classes or variables (e.g., bg-green, text-red).
 */
export const STATUS_COLORS = {
  "Normal": "green",
  "Wasted": "yellow",
  "Severely Wasted": "red",
  "Overweight": "blue",
  "Obese": "purple",
  "Unknown": "gray"
};

/**
 * Helper to get color for a given status (handles unnormalized input).
 */
export const getStatusColor = (status) => {
  const normalized = normalizeNutritionStatus(status);
  return STATUS_COLORS[normalized] || "gray";
};
