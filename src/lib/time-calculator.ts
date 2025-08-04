/**
 * Time Calculator Utility for Dynamic TimeBlock Scheduling
 * Supports 16 time blocks (index 0-15) with customizable wake times and durations
 */

export interface TimeBlockConfig {
  index: number;
  timeLabel: string;
  startTime: Date;
  duration: number; // in minutes
}

export interface WakeTimeSettings {
  wakeTime: string; // Format: "04:00" (24-hour format)
  blockDuration: number; // Default duration for each block in minutes (e.g., 60)
}

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
export function timeStringToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Format time string to 12-hour format with AM/PM
 */
export function formatTo12Hour(timeString: string): string {
  const [hours, minutes] = timeString.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Calculate all 16 time block configurations based on wake time
 */
export function calculateTimeBlocks(
  wakeTimeSettings: WakeTimeSettings,
  customDurations?: number[] // Optional array of 16 custom durations
): TimeBlockConfig[] {
  const { wakeTime, blockDuration } = wakeTimeSettings;
  const startMinutes = timeStringToMinutes(wakeTime);

  const timeBlocks: TimeBlockConfig[] = [];
  let currentMinutes = startMinutes;

  for (let index = 0; index < 16; index++) {
    const duration = customDurations?.[index] || blockDuration;
    const timeLabel = formatTo12Hour(minutesToTimeString(currentMinutes));

    timeBlocks.push({
      index,
      timeLabel,
      startTime: new Date(
        Date.UTC(
          1970,
          0,
          1,
          Math.floor(currentMinutes / 60),
          currentMinutes % 60
        )
      ),
      duration,
    });

    currentMinutes += duration;
  }

  return timeBlocks;
}

/**
 * Get default time block configurations for role-based templates
 */
export function getDefaultTimeBlockSettings(
  userRole: "admin" | "public"
): WakeTimeSettings {
  if (userRole === "admin") {
    return {
      wakeTime: "04:00",
      blockDuration: 60, // 1 hour blocks
    };
  } else {
    return {
      wakeTime: "06:00",
      blockDuration: 60, // 1 hour blocks
    };
  }
}

/**
 * Get time block for completion based on current time and time block configurations
 */
export function getTimeBlockForCompletion(
  completionTime: Date,
  timeBlocks: TimeBlockConfig[],
  currentPageDate: string
): number {
  const completionHour = completionTime.getHours();
  const completionMinutes =
    completionTime.getHours() * 60 + completionTime.getMinutes();
  const completionDate = completionTime.toISOString().split("T")[0];

  // If completing on the current page date
  if (completionDate === currentPageDate) {
    // Find the appropriate time block based on actual time ranges
    for (let i = 0; i < timeBlocks.length; i++) {
      const block = timeBlocks[i];
      const blockStartMinutes = timeStringToMinutes(
        block.timeLabel.replace(" AM", "").replace(" PM", "")
      );
      const nextBlockStartMinutes =
        i < timeBlocks.length - 1
          ? timeStringToMinutes(
              timeBlocks[i + 1].timeLabel.replace(" AM", "").replace(" PM", "")
            )
          : blockStartMinutes + block.duration;

      if (
        completionMinutes >= blockStartMinutes &&
        completionMinutes < nextBlockStartMinutes
      ) {
        return i;
      }
    }

    // Fall back to traditional logic for edge cases
    if (completionHour >= 0 && completionHour < 5) return 0;
    if (completionHour >= 5 && completionHour < 6) return 1;
    if (completionHour >= 6 && completionHour < 7) return 2;
    if (completionHour >= 7 && completionHour < 8) return 3;
    if (completionHour >= 8 && completionHour < 9) return 4;
    if (completionHour >= 9 && completionHour < 10) return 5;
    if (completionHour >= 10 && completionHour < 11) return 6;
    if (completionHour >= 11 && completionHour < 12) return 7;
    if (completionHour >= 12 && completionHour < 13) return 8;
    if (completionHour >= 13 && completionHour < 14) return 9;
    if (completionHour >= 14 && completionHour < 15) return 10;
    if (completionHour >= 15 && completionHour < 16) return 11;
    if (completionHour >= 16 && completionHour < 17) return 12;
    if (completionHour >= 17 && completionHour < 18) return 13;
    if (completionHour >= 18 && completionHour < 20) return 14;
    if (completionHour >= 20) return 15;
  } else {
    // Cross-date scenarios
    const currentPageDateObj = new Date(currentPageDate + "T00:00:00");
    const completionDateObj = new Date(completionDate + "T00:00:00");

    // If completing on the day before the current page (late night work)
    if (completionDateObj.getTime() < currentPageDateObj.getTime()) {
      if (completionHour >= 21) return 15; // Late evening -> last block
      if (completionHour >= 0 && completionHour < 5) return 0; // Early morning -> first block
    }

    // If completing on the day after the current page (early morning work)
    if (completionDateObj.getTime() > currentPageDateObj.getTime()) {
      if (completionHour >= 0 && completionHour < 5) return 0; // Early morning -> first block
      if (completionHour >= 5 && completionHour < 6) return 1;
    }
  }

  return 0; // Default fallback to first block
}

/**
 * Generate all 16 time block labels for dropdowns and displays
 */
export function generateTimeBlockLabels(
  timeBlocks: TimeBlockConfig[]
): string[] {
  return timeBlocks.map((block) => block.timeLabel);
}

/**
 * Validate wake time format (HH:MM)
 */
export function isValidWakeTime(wakeTime: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(wakeTime);
}

/**
 * Convert 12-hour time to 24-hour format
 */
export function convertTo24Hour(time12h: string): string {
  const [time, period] = time12h.split(" ");
  const [hours, minutes] = time.split(":").map(Number);

  let hours24 = hours;
  if (period === "PM" && hours !== 12) {
    hours24 += 12;
  } else if (period === "AM" && hours === 12) {
    hours24 = 0;
  }

  return `${hours24.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}
