/**
 * Enhanced Time Block Calculator for 18-block system (00:00 → 23:59)
 * Implements user's specification: Block 1 (00:00-04:59) through Block 18 (21:00-23:59)
 */

export interface TimeBlockConfig {
  index: number;
  timeLabel: string; // "12:00 a.m.", "5:00 a.m.", etc.
  startHour: number; // 0, 5, 6, etc.
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
 * Generate the 18 time block configurations covering full 24-hour day
 * Block 1: 00:00-04:59, Block 2: 05:00-05:59, ..., Block 18: 21:00-23:59
 */
export function generateTimeBlocks(): TimeBlockConfig[] {
  const blocks: TimeBlockConfig[] = [];

  // Block 1: 00:00-04:59 (5 hours, midnight to 4:59 AM)
  blocks.push({
    index: 1,
    timeLabel: "12:00 a.m.",
    startHour: 0,
  });

  // Blocks 2-17: 05:00-20:59 (1 hour each)
  for (let hour = 5; hour <= 20; hour++) {
    const blockNumber = hour - 3; // hour 5 → block 2, hour 6 → block 3, etc.
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const amPm = hour >= 12 ? "p.m." : "a.m.";
    const timeLabel = `${displayHour}:00 ${amPm}`;

    blocks.push({
      index: blockNumber,
      timeLabel,
      startHour: hour,
    });
  }

  // Block 18: 21:00-23:59 (3 hours, 9 PM to 11:59 PM)
  blocks.push({
    index: 18,
    timeLabel: "9:00 p.m.",
    startHour: 21,
  });

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
      blockIndex = 0; // Goes to Block 1 (00:00-04:59) but indexed as 0
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
 * General rule for time block assignment (0-17 system for compatibility)
 */
function getGeneralRuleBlock(localHour: number): number {
  // Block 0: 00:00-04:59 (hours 0-4)
  if (localHour >= 0 && localHour <= 4) {
    return 0;
  }

  // Blocks 1-16: 05:00-20:59 (hours 5-20, each hour gets its own block)
  if (localHour >= 5 && localHour <= 20) {
    return localHour - 4; // hour 5 → block 1, hour 6 → block 2, ..., hour 20 → block 16
  }

  // Block 17: 21:00-23:59 (hours 21-23)
  if (localHour >= 21 && localHour <= 23) {
    return 17;
  }

  // Fallback - shouldn't happen with valid hours
  return 0;
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
