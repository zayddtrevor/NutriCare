import { format } from "date-fns";

/**
 * Returns a Date object adjusted to Philippine Time (PHT, UTC+8).
 * @returns {Date}
 */
export const getPHDate = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
};

/**
 * Returns a formatted date string in Philippine Time.
 * @param {Date} [date] - Optional date object. Defaults to current PH date.
 * @param {string} [formatStr] - date-fns format string. Defaults to 'yyyy-MM-dd'.
 * @returns {string}
 */
export const getPHDateString = (date = getPHDate(), formatStr = "yyyy-MM-dd") => {
  return format(date, formatStr);
};
