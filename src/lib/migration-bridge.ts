/**
 * Migration Utility: Helper functions to bridge index-based and ID-based operations
 * This file helps during the transition period and can be removed once migration is complete
 */

import { type ChecklistData } from "./checklist-actions";

export interface TimeBlockData {
  blockId: string;
  time: string;
  label: string;
  order: number;
  isCustom?: boolean;
}

/**
 * Convert blockIndex to blockId using hydrated time blocks data
 * @deprecated Use direct blockId instead
 */
export function getBlockIdFromIndex(
  timeBlocks: TimeBlockData[],
  blockIndex: number
): string | null {
  // Sort by order to get consistent index mapping
  const sortedBlocks = [...timeBlocks].sort((a, b) => a.order - b.order);
  const block = sortedBlocks[blockIndex];
  return block?.blockId || null;
}

/**
 * Convert blockId to blockIndex for legacy components
 * @deprecated Update components to use blockId directly
 */
export function getIndexFromBlockId(
  timeBlocks: TimeBlockData[],
  blockId: string
): number {
  // Sort by order to get consistent index mapping
  const sortedBlocks = [...timeBlocks].sort((a, b) => a.order - b.order);
  const index = sortedBlocks.findIndex((block) => block.blockId === blockId);
  return index >= 0 ? index : -1;
}

/**
 * Get block data by index (for legacy support)
 * @deprecated Use getBlockById from id-helpers instead
 */
export function getBlockByIndex(
  timeBlocks: TimeBlockData[],
  blockIndex: number
): TimeBlockData | null {
  const sortedBlocks = [...timeBlocks].sort((a, b) => a.order - b.order);
  return sortedBlocks[blockIndex] || null;
}

/**
 * Convert checklist item index to itemId
 * @deprecated Use direct itemId instead
 */
export function getItemIdFromIndex(
  checklist: ChecklistData,
  itemIndex: number
): string | null {
  // Use itemsOrder for consistent ordering
  const orderedItemIds = checklist.itemsOrder;
  return orderedItemIds[itemIndex] || null;
}

/**
 * Convert itemId to item index for legacy components
 * @deprecated Update components to use itemId directly
 */
export function getIndexFromItemId(
  checklist: ChecklistData,
  itemId: string
): number {
  return checklist.itemsOrder.indexOf(itemId);
}

/**
 * Migration status checker - scan for remaining index-based operations
 */
export const MIGRATION_WARNINGS = {
  BLOCK_INDEX_USAGE: "Component still using blockIndex - update to use blockId",
  ITEM_INDEX_USAGE: "Component still using itemIndex - update to use itemId",
  CHECKLIST_INDEX_USAGE:
    "Component still using checklistIndex - update to use checklistId",
  API_INDEX_CALL:
    "API call still using index parameters - update to use ID parameters",
};

/**
 * Development helper: Log when legacy index functions are used
 */
export function logMigrationWarning(
  component: string,
  operation: string,
  warningType: keyof typeof MIGRATION_WARNINGS
) {
  if (process.env.NODE_ENV === "development") {
    console.warn(
      `🚨 MIGRATION WARNING in ${component}.${operation}: ${MIGRATION_WARNINGS[warningType]}`
    );
  }
}

/**
 * Check if data has been migrated (has ID fields)
 */
export function hasIdMigration(data: unknown): boolean {
  if (Array.isArray(data)) {
    return data.every((item) => hasIdMigration(item));
  }

  if (typeof data === "object" && data !== null) {
    // Check for common ID fields
    const hasBlockId = "blockId" in data;
    const hasItemId = "itemId" in data;
    const hasChecklistId = "checklistId" in data;
    const hasOrder = "order" in data;

    return (hasBlockId || hasItemId || hasChecklistId) && hasOrder;
  }

  return true; // Primitive values are considered migrated
}

/**
 * Validate that hydrated data has proper ID structure
 */
export function validateHydratedData(userData: Record<string, unknown>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    // Check template set structure
    if (!userData.templateSet) {
      errors.push("Missing templateSet in hydrated data");
      return { isValid: false, errors };
    }

    const templateSet = userData.templateSet as Record<string, unknown>;

    // Check time blocks have IDs and order
    if (
      !Array.isArray(templateSet.timeBlocks) ||
      !templateSet.timeBlocks?.every(
        (block: Record<string, unknown>) =>
          block.blockId && typeof block.order === "number"
      )
    ) {
      errors.push("Time blocks missing blockId or order fields");
    }

    // Check time blocks order array
    if (!Array.isArray(templateSet.timeBlocksOrder)) {
      errors.push("Missing or invalid timeBlocksOrder array");
    }

    // Check checklists structure
    if (
      !Array.isArray(templateSet.checklists) ||
      !templateSet.checklists?.every(
        (checklist: Record<string, unknown>) =>
          checklist.checklistId && typeof checklist.order === "number"
      )
    ) {
      errors.push("Checklists missing checklistId or order fields");
    }

    // Check checklist items have IDs
    for (const checklist of (templateSet.checklists as Record<
      string,
      unknown
    >[]) || []) {
      const items = checklist.items as Record<string, unknown>[] | undefined;
      if (
        !Array.isArray(items) ||
        !items?.every(
          (item: Record<string, unknown>) =>
            item.itemId && typeof item.order === "number"
        )
      ) {
        errors.push(
          `Checklist ${checklist.checklistId} has items missing itemId or order`
        );
      }

      if (!Array.isArray(checklist.itemsOrder)) {
        errors.push(
          `Checklist ${checklist.checklistId} missing itemsOrder array`
        );
      }
    }

    return { isValid: errors.length === 0, errors };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    errors.push(`Validation error: ${errorMessage}`);
    return { isValid: false, errors };
  }
}
