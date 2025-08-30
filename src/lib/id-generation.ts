/**
 * Centralized ID Generation Utility
 *
 * This module provides consistent, optimized ID generation patterns
 * for all AMP Tracker components and data structures.
 */

import { randomUUID } from "crypto";

// canonical ID API
export const ID_PREFIX = {
  check: "ck",   // for all checklist items
  habit: "hb",
  workout: "wx",
  todo: "td",
  block: "tb",   // time block
  note: "nt",
  section: "sc", // subsection headers
} as const;

export type IdKind = keyof typeof ID_PREFIX;

export function makeId(kind: IdKind): string {
  // Use crypto.randomUUID() if available, else import from 'crypto'
  return `${ID_PREFIX[kind]}_${crypto.randomUUID()}`;
}

export function isValidId(id: string): boolean {
  return /^[a-z]{2}_[0-9a-f-]{36}$/.test(id);
}

export function assertId(id: string, ctx = "id"): void {
  if (!id || /^\d+$/.test(id) || !isValidId(id)) {
    throw new Error(`[${ctx}] expected stable ID, got "${id}"`);
  }
}

/**
 * Generate collision-resistant IDs for user-created items
 */
export const generateId = {
  // For user todo items
  todo: (sequence: number = 0): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `todo-${timestamp}-${random}-${sequence}`;
  },

  // For user workout items
  workout: (sequence: number = 0): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `workout-${timestamp}-${random}-${sequence}`;
  },

  // For time blocks in user data
  block: (): string => `block-${randomUUID()}`,

  // For template items (semantic, stable IDs)
  template: {
    masterChecklist: (category: string, sequence: number): string => {
      const validCategories = ["morning", "work", "tech", "house", "wrapup"];
      const cat = validCategories.includes(category) ? category : "morning";
      return `mc-${cat}-${String(sequence).padStart(3, "0")}`;
    },

    habitBreak: (category: string, sequence: number): string => {
      const validCategories = ["lsd", "financial", "youtube", "time"];
      const cat = validCategories.includes(category) ? category : "lsd";
      return `hb-${cat}-${String(sequence).padStart(3, "0")}`;
    },

    timeBlock: (hour: number, sequence: number): string => {
      return `tb-${String(hour).padStart(2, "0")}h-${String(sequence).padStart(
        3,
        "0"
      )}`;
    },
  },
};

/**
 * Validate ID patterns
 */
export const validateId = {
  todo: (id: string): boolean => /^todo-\d{13}-\d{1,4}-\d+$/.test(id),
  workout: (id: string): boolean => /^workout-\d{13}-\d{1,4}-\d+$/.test(id),
  block: (id: string): boolean =>
    /^block-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
      id
    ),
  templateMasterChecklist: (id: string): boolean =>
    /^mc-(morning|work|tech|house|wrapup)-\d{3}$/.test(id),
  templateHabitBreak: (id: string): boolean =>
    /^hb-(lsd|financial|youtube|time)-\d{3}$/.test(id),
  templateTimeBlock: (id: string): boolean => /^tb-\d{2}h-\d{3}$/.test(id),
};

/**
 * Check if an ID needs migration from old format
 */
export const needsMigration = {
  isLegacyBlock: (id: string): boolean => /^block-\d+$/.test(id),
  isOldFormat: (id: string): boolean => {
    // Check if ID follows old patterns that should be updated
    return (
      !Object.values(validateId).some((validator) => validator(id)) &&
      !/^(mc|hb|tb|todo|workout|block)-/.test(id)
    );
  },
};

/**
 * Enhanced ID generation with collision detection for user-generated content
 */
export const generateOptimizedId = {
  todo: (existingIds: string[], sequence: number): string => {
    let id: string;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      id = generateId.todo(sequence + attempts);
      attempts++;
    } while (existingIds.includes(id) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      // Fallback to UUID-based approach if collision persists
      id = `todo-${Date.now()}-${randomUUID().slice(0, 8)}-${sequence}`;
    }

    return id;
  },

  workout: (existingIds: string[], sequence: number): string => {
    let id: string;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      id = generateId.workout(sequence + attempts);
      attempts++;
    } while (existingIds.includes(id) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      // Fallback to UUID-based approach if collision persists
      id = `workout-${Date.now()}-${randomUUID().slice(0, 8)}-${sequence}`;
    }

    return id;
  },

  block: (): string => generateId.block(),
};
