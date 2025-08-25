/**
 * Centralized ID Generation Utility
 *
 * This module provides consistent, optimized ID generation patterns
 * for all AMP Tracker components and data structures.
 */

import { randomUUID } from "crypto";

/**
 * Generate collision-resistant IDs for user-created items
 */
export const generateId = {
  // For user todo items
  todo: (sequence = 0) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `todo-${timestamp}-${random}-${sequence}`;
  },

  // For user workout items
  workout: (sequence = 0) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `workout-${timestamp}-${random}-${sequence}`;
  },

  // For time blocks in user data
  block: () => `block-${randomUUID()}`,

  // For template items (semantic, stable IDs)
  template: {
    masterChecklist: (category, sequence) => {
      const validCategories = ["morning", "work", "tech", "house", "wrapup"];
      const cat = validCategories.includes(category) ? category : "morning";
      return `mc-${cat}-${String(sequence).padStart(3, "0")}`;
    },

    habitBreak: (category, sequence) => {
      const validCategories = ["lsd", "financial", "youtube", "time"];
      const cat = validCategories.includes(category) ? category : "lsd";
      return `hb-${cat}-${String(sequence).padStart(3, "0")}`;
    },

    timeBlock: (hour, sequence) => {
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
  todo: (id) => /^todo-\d{13}-\d{1,4}-\d+$/.test(id),
  workout: (id) => /^workout-\d{13}-\d{1,4}-\d+$/.test(id),
  block: (id) =>
    /^block-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
      id
    ),
  templateMasterChecklist: (id) =>
    /^mc-(morning|work|tech|house|wrapup)-\d{3}$/.test(id),
  templateHabitBreak: (id) =>
    /^hb-(lsd|financial|youtube|time)-\d{3}$/.test(id),
  templateTimeBlock: (id) => /^tb-\d{2}h-\d{3}$/.test(id),
};

/**
 * Check if an ID needs migration from old format
 */
export const needsMigration = {
  isLegacyBlock: (id) => /^block-\d+$/.test(id),
  isOldFormat: (id) => {
    // Check if ID follows old patterns that should be updated
    return (
      !Object.values(validateId).some((validator) => validator(id)) &&
      !/^(mc|hb|tb|todo|workout|block)-/.test(id)
    );
  },
};
