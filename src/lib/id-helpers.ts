/**
 * Helper functions for working with ID-based data structures
 */

import { Block, ChecklistItem } from "../types";
import { ITimeBlockTemplate } from "../models/ContentTemplate";

/**
 * Find a block by its blockId from an ordered list
 */
export function getBlockById(
  order: string[],
  blocks: Block[],
  blockId: string
): Block | undefined {
  return blocks.find(
    (block) => block.blockId === blockId || block.id === blockId // Fallback for backward compatibility
  );
}

/**
 * Find a checklist item by its itemId from an ordered list
 */
export function getItemById(
  order: string[],
  items: ChecklistItem[],
  itemId: string
): ChecklistItem | undefined {
  return items.find(
    (item) => item.itemId === itemId || item.id === itemId // Fallback for backward compatibility
  );
}

/**
 * Validate that an ID exists in a membership array
 */
export function validateIdMembership(id: string, validIds: string[]): boolean {
  return validIds.includes(id);
}

/**
 * Get ordered blocks based on order array
 */
export function getOrderedBlocks(order: string[], blocks: Block[]): Block[] {
  if (!order || order.length === 0) {
    return blocks; // Return blocks in original order if no order specified
  }

  const orderedBlocks: Block[] = [];
  const blockMap = new Map<string, Block>();

  // Create a map for faster lookups
  blocks.forEach((block) => {
    if (block.blockId) {
      blockMap.set(block.blockId, block);
    }
    // Also map by id for backward compatibility
    blockMap.set(block.id, block);
  });

  // Add blocks in order
  order.forEach((blockId) => {
    const block = blockMap.get(blockId);
    if (block) {
      orderedBlocks.push(block);
    }
  });

  // Add any blocks not in the order array at the end
  blocks.forEach((block) => {
    const isIncluded = order.includes(block.blockId || block.id);
    if (!isIncluded) {
      orderedBlocks.push(block);
    }
  });

  return orderedBlocks;
}

/**
 * Get ordered checklist items based on order array
 */
export function getOrderedItems(
  order: string[],
  items: ChecklistItem[]
): ChecklistItem[] {
  if (!order || order.length === 0) {
    return items; // Return items in original order if no order specified
  }

  const orderedItems: ChecklistItem[] = [];
  const itemMap = new Map<string, ChecklistItem>();

  // Create a map for faster lookups
  items.forEach((item) => {
    if (item.itemId) {
      itemMap.set(item.itemId, item);
    }
    // Also map by id for backward compatibility
    itemMap.set(item.id, item);
  });

  // Add items in order
  order.forEach((itemId) => {
    const item = itemMap.get(itemId);
    if (item) {
      orderedItems.push(item);
    }
  });

  // Add any items not in the order array at the end
  items.forEach((item) => {
    const isIncluded = order.includes(item.itemId || item.id);
    if (!isIncluded) {
      orderedItems.push(item);
    }
  });

  return orderedItems;
}

/**
 * Find a time block template by its blockId from an ordered list
 */
export function getTimeBlockTemplateById(
  order: string[],
  blocks: ITimeBlockTemplate[],
  blockId: string
): ITimeBlockTemplate | undefined {
  return blocks.find(
    (block) => block.blockId === blockId || block.id === blockId // Fallback for backward compatibility
  );
}
