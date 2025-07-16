/**
 * Date utility functions for AMP Tracker
 */

/**
 * Format a date as "Wed 7-16-25"
 */
export function formatDisplayDate(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = days[date.getDay()];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear().toString().slice(-2);

  return `${dayName} ${month}-${day}-${year}`;
}

/**
 * Format a date as "YYYY-MM-DD" for storage
 */
export function formatStorageDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Parse a storage date string back to a Date object
 */
export function parseStorageDate(dateString: string): Date {
  return new Date(dateString + "T00:00:00");
}

/**
 * Get today's date in storage format
 */
export function getTodayStorageDate(): string {
  return formatStorageDate(new Date());
}

/**
 * Get today's display date
 */
export function getTodayDisplayDate(): string {
  return formatDisplayDate(new Date());
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get yesterday's date in storage format
 */
export function getYesterdayStorageDate(): string {
  const yesterday = addDays(new Date(), -1);
  return formatStorageDate(yesterday);
}

/**
 * Get tomorrow's date in storage format
 */
export function getTomorrowStorageDate(): string {
  const tomorrow = addDays(new Date(), 1);
  return formatStorageDate(tomorrow);
}

/**
 * Check if a date string is today
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayStorageDate();
}

/**
 * Check if a date string is yesterday
 */
export function isYesterday(dateString: string): boolean {
  return dateString === getYesterdayStorageDate();
}

/**
 * Get a user-friendly relative date description
 */
export function getRelativeDateDescription(dateString: string): string {
  if (isToday(dateString)) return "Today";
  if (isYesterday(dateString)) return "Yesterday";

  const date = parseStorageDate(dateString);
  const today = new Date();
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === -1) return "Tomorrow";
  if (diffDays > 0) return `${diffDays} days ago`;
  if (diffDays < 0) return `${Math.abs(diffDays)} days from now`;

  return formatDisplayDate(date);
}
