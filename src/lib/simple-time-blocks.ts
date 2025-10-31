/**
 * Simplified 24-Block Time Calculator
 * One block per hour: 00:00-00:59 = Block 0, 01:00-01:59 = Block 1, etc.
 * No wake times, no custom durations, no complexity.
 */

export interface SimpleTimeBlock {
  id: string;
  index: number;
  time: string; // Display time like "00:00" or "13:00"
  hourRange: string; // Range like "00:00 - 00:59"
  label: string; // User customizable label
  notes: string[]; // User notes
  complete: boolean; // Completion status
}

/**
 * Generate 24 simple time blocks (one per hour)
 */
export function generateSimpleTimeBlocks(): SimpleTimeBlock[] {
  const blocks: SimpleTimeBlock[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const id = `block-${hour.toString().padStart(2, "0")}`;
    const time = formatHourTo24Hour(hour);
    const hourRange = `${hour.toString().padStart(2, "0")}:00 - ${hour
      .toString()
      .padStart(2, "0")}:59`;
    const label = getDefaultLabel(hour);

    blocks.push({
      id,
      index: hour,
      time,
      hourRange,
      label,
      notes: [],
      complete: false,
    });
  }

  return blocks;
}

/**
 * Calculate which block a completion should go to
 * Simple rule: completion hour = block index
 */
export function calculateSimpleCompletionBlock(completionTime: Date): number {
  const hour = completionTime.getHours();

  // Clamp to valid range (0-23)
  return Math.max(0, Math.min(23, hour));
}

/**
 * Format hour (0-23) to 24-hour display format
 */
function formatHourTo24Hour(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

/**
 * Get default label for a time block based on typical daily schedule
 */
function getDefaultLabel(hour: number): string {
  const labels: { [key: number]: string } = {
    0: "Late Night",
    1: "Deep Sleep",
    2: "Deep Sleep",
    3: "Deep Sleep",
    4: "Early Morning",
    5: "Wake Up Time",
    6: "Morning Routine",
    7: "Breakfast",
    8: "Work Start",
    9: "Morning Work",
    10: "Mid Morning",
    11: "Pre Lunch",
    12: "Lunch Time",
    13: "Afternoon Work",
    14: "Mid Afternoon",
    15: "Late Afternoon",
    16: "Work Wrap Up",
    17: "Evening Prep",
    18: "Dinner Time",
    19: "Evening Activities",
    20: "Wind Down",
    21: "Relax Time",
    22: "Bedtime Prep",
    23: "Sleep Time",
  };

  return labels[hour] || `Hour ${hour}`;
}

/**
 * Validate that a block index is in valid range
 */
export function isValidBlockIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index <= 23;
}

/**
 * Get block by hour (convenience function)
 */
export function getBlockByHour(hour: number): number {
  return calculateSimpleCompletionBlock(new Date(2000, 0, 1, hour, 0, 0));
}

/**
 * Convert old 18-block index to new 24-block index (for migration)
 */
export function migrateOldBlockIndex(oldIndex: number): number {
  // Old system mapping (approximate):
  // Block 0 = 00:00-04:59 → New blocks 0-4
  // Block 1 = 05:00-05:59 → New block 5
  // Block 2 = 06:00-06:59 → New block 6
  // ...
  // Block 17 = 21:00-23:59 → New blocks 21-23

  if (oldIndex === 0) return 2; // Map old "early morning" to 2 AM
  if (oldIndex >= 1 && oldIndex <= 16) return oldIndex + 4; // Shift by 4 hours
  if (oldIndex === 17) return 22; // Map old "late night" to 10 PM

  return 0; // Fallback
}
