/**
 * Enhanced Time Block Calculator for 18-hour system (4:00 a.m. → 9:00 p.m.)
 * Implements wake-up time rules and timezone-aware completion tracking
 */

export interface TimeBlockConfig {
  index: number;
  timeLabel: string; // "4:00 a.m.", "5:00 a.m.", etc.
  startHour: number; // 4, 5, 6, etc.
}

export interface CompletionRecord {
  timestamp: Date; // Server-side captured completion time
  blockIndex: number; // Computed block index (0-17)
  timezoneOffset: number; // Local timezone offset at completion time
  localTimeUsed: string; // Local time string for audit/debugging
}

export interface DailyWakeSettings {
  wakeTime?: string; // Format: "03:30" (24-hour), undefined if not set
  date: string; // Format: "2025-08-19"
}

/**
 * Get default wake time settings based on user role
 */
export function getDefaultWakeSettings(): {
  wakeTime: string;
  blockDuration: number;
} {
  return {
    wakeTime: "04:00", // Default wake time
    blockDuration: 60, // Default 60-minute blocks
  };
}

/**
 * Generate the 18 time block configurations from 4:00 a.m. to 9:00 p.m.
 */
export function generateTimeBlocks(): TimeBlockConfig[] {
  const blocks: TimeBlockConfig[] = [];

  for (let hour = 4; hour <= 21; hour++) {
    const index = hour - 4; // 0-17
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const amPm = hour >= 12 ? "p.m." : "a.m.";
    const timeLabel = `${displayHour}:00 ${amPm}`;

    blocks.push({
      index,
      timeLabel,
      startHour: hour,
    });
  }

  return blocks;
}

/**
 * Get user's local timezone from browser
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert a time to user's local timezone
 */
export function toUserLocalTime(utcTime: Date, userTimezone?: string): Date {
  if (!userTimezone) {
    return utcTime; // Fallback to UTC if no timezone provided
  }

  // Create a new date in the user's timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: userTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(utcTime);
  const partsObj = parts.reduce((acc: Record<string, string>, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return new Date(
    `${partsObj.year}-${partsObj.month}-${partsObj.day}T${partsObj.hour}:${partsObj.minute}:${partsObj.second}`
  );
}

/**
 * Calculate the appropriate time block for a completion
 * Implements the assignment rules with wake-up time special handling
 */
export function calculateCompletionBlock(
  completionTime: Date,
  wakeSettings?: DailyWakeSettings,
  userTimezone?: string
): CompletionRecord {
  // Get local time for the user
  const localTime = userTimezone
    ? toUserLocalTime(completionTime, userTimezone)
    : completionTime;
  const localHour = localTime.getHours();
  const localMinute = localTime.getMinutes();
  const localDate = localTime.toISOString().split("T")[0]; // YYYY-MM-DD

  // Store timezone offset for audit purposes
  const timezoneOffset = localTime.getTimezoneOffset();
  const localTimeUsed = localTime.toLocaleTimeString("en-US", {
    hour12: false,
  });

  let blockIndex: number;

  // Check if we have wake settings for the same local day
  const hasWakeTimeForDay =
    wakeSettings && wakeSettings.date === localDate && wakeSettings.wakeTime;

  if (hasWakeTimeForDay) {
    // Parse wake time
    const [wakeHour, wakeMinute] = wakeSettings
      .wakeTime!.split(":")
      .map(Number);
    const wakeTimeMinutes = wakeHour * 60 + wakeMinute;
    const completionMinutes = localHour * 60 + localMinute;

    // Early-morning special rule: If completion is from wake-up through 4:59 a.m.
    if (completionMinutes >= wakeTimeMinutes && localHour < 5) {
      blockIndex = 0; // Goes to 4:00 a.m. block
    } else {
      // Use general rule
      blockIndex = getGeneralRuleBlock(localHour);
    }
  } else {
    // No wake time set, use general rule
    blockIndex = getGeneralRuleBlock(localHour);
  }

  return {
    timestamp: completionTime,
    blockIndex,
    timezoneOffset,
    localTimeUsed,
  };
}

/**
 * General rule for time block assignment
 */
function getGeneralRuleBlock(localHour: number): number {
  // Before 4:00 a.m. when no wake time is set: put in the 4:00 a.m. block
  if (localHour < 4) {
    return 0; // 4:00 a.m. block
  }

  // 4–4:59 → 4 a.m. block (index 0)
  // 5–5:59 → 5 a.m. block (index 1)
  // ...
  // 20–20:59 → 8 p.m. block (index 16)
  if (localHour >= 4 && localHour <= 20) {
    return localHour - 4;
  }

  // 21–23:59 and anything later → 9 p.m. block (index 17)
  return 17; // 9:00 p.m. block
}

/**
 * Get the display name for a block index
 */
export function getBlockDisplayName(blockIndex: number): string {
  const blocks = generateTimeBlocks();
  return blocks[blockIndex]?.timeLabel || "Unknown Block";
}

/**
 * Parse wake time string to minutes since midnight
 */
export function parseWakeTime(wakeTime: string): number {
  const [hours, minutes] = wakeTime.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Validate wake time format (HH:MM in 24-hour format)
 */
export function isValidWakeTime(wakeTime: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(wakeTime);
}

/**
 * Backfill existing completion data with block assignments
 * For items that were completed previously but don't have a saved block
 */
export function backfillCompletionBlock(
  completedAt: Date,
  wakeSettings?: DailyWakeSettings,
  userTimezone?: string
): number {
  const record = calculateCompletionBlock(
    completedAt,
    wakeSettings,
    userTimezone
  );
  return record.blockIndex;
}

/**
 * Sort checklist items by block, then by completion time
 */
export function sortCompletedItems<
  T extends { targetBlock?: number; completedAt?: Date }
>(items: T[]): T[] {
  return items.sort((a, b) => {
    // First sort by block index
    const blockA = a.targetBlock ?? 0;
    const blockB = b.targetBlock ?? 0;

    if (blockA !== blockB) {
      return blockA - blockB;
    }

    // Then sort by completion time within the same block
    const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;

    return timeA - timeB;
  });
}
