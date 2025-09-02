import { IContentTemplate } from "../models/ContentTemplate";
import { IUserData } from "../models/UserData";

/**
 * Generate a stable unique ID for entities
 */
export function generateStableId(prefix: string = ""): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}${timestamp}_${random}`;
}

/**
 * Migrate ContentTemplate to add missing IDs and order arrays
 */
export function migrateContentTemplate(template: IContentTemplate): {
  modified: boolean;
  template: Partial<IContentTemplate>;
} {
  let modified = false;
  const updatedTemplate = { ...template };

  // Ensure content object exists
  if (!updatedTemplate.content) {
    updatedTemplate.content = {};
    modified = true;
  }

  // Migrate timeBlocks to add blockId and create order array
  if (updatedTemplate.content.timeBlocks) {
    const timeBlockIds: string[] = [];

    updatedTemplate.content.timeBlocks = updatedTemplate.content.timeBlocks.map(
      (block) => {
        const updatedBlock = { ...block };

        // Add blockId if missing
        if (!updatedBlock.blockId) {
          updatedBlock.blockId = generateStableId("block_");
          modified = true;
        }

        timeBlockIds.push(updatedBlock.blockId);
        return updatedBlock;
      }
    );

    // Create or update timeBlocksOrder if it doesn't exist or is different
    if (
      !updatedTemplate.content.timeBlocksOrder ||
      JSON.stringify(updatedTemplate.content.timeBlocksOrder) !==
        JSON.stringify(timeBlockIds)
    ) {
      updatedTemplate.content.timeBlocksOrder = timeBlockIds;
      modified = true;
    }
  }

  // Migrate checklists to add itemId and create order arrays
  const checklistFields = [
    "masterChecklist",
    "habitBreakChecklist",
    "workoutChecklist",
  ] as const;

  checklistFields.forEach((fieldName) => {
    if (updatedTemplate.content[fieldName]) {
      const itemIds: string[] = [];

      updatedTemplate.content[fieldName] = updatedTemplate.content[
        fieldName
      ]!.map((item) => {
        const updatedItem = { ...item };

        // Add itemId if missing
        if (!updatedItem.itemId) {
          updatedItem.itemId = generateStableId("item_");
          modified = true;
        }

        itemIds.push(updatedItem.itemId);
        return updatedItem;
      });

      // Create or update order array
      const orderFieldName =
        `${fieldName}Order` as keyof typeof updatedTemplate.content;
      if (
        !updatedTemplate.content[orderFieldName] ||
        JSON.stringify(updatedTemplate.content[orderFieldName]) !==
          JSON.stringify(itemIds)
      ) {
        (updatedTemplate.content as Record<string, unknown>)[orderFieldName] =
          itemIds;
        modified = true;
      }
    }
  });

  // Initialize checklistSectionOrder if it doesn't exist
  if (!updatedTemplate.content.checklistSectionOrder) {
    updatedTemplate.content.checklistSectionOrder = [
      "masterChecklist",
      "habitBreakChecklist",
      "workoutChecklist",
    ];
    modified = true;
  }

  return { modified, template: updatedTemplate };
}

/**
 * Migrate UserData to add missing IDs and order arrays
 */
export function migrateUserData(userData: IUserData): {
  modified: boolean;
  userData: Partial<IUserData>;
} {
  let modified = false;
  const updatedUserData = { ...userData };

  // Migrate blocks to add blockId and create order array
  if (updatedUserData.blocks) {
    const blockIds: string[] = [];

    updatedUserData.blocks = updatedUserData.blocks.map((block) => {
      const updatedBlock = { ...block };

      // Add blockId if missing
      if (!updatedBlock.blockId) {
        updatedBlock.blockId = generateStableId("block_");
        modified = true;
      }

      blockIds.push(updatedBlock.blockId);
      return updatedBlock;
    });

    // Create or update timeBlocksOrder
    if (
      !updatedUserData.timeBlocksOrder ||
      JSON.stringify(updatedUserData.timeBlocksOrder) !==
        JSON.stringify(blockIds)
    ) {
      updatedUserData.timeBlocksOrder = blockIds;
      modified = true;
    }
  }

  // Migrate checklists to add itemId and create order arrays
  const checklistFields = [
    "masterChecklist",
    "habitBreakChecklist",
    "workoutChecklist",
    "todoList",
  ] as const;

  checklistFields.forEach((fieldName) => {
    if (updatedUserData[fieldName]) {
      const itemIds: string[] = [];

      updatedUserData[fieldName] = updatedUserData[fieldName]!.map((item) => {
        const updatedItem = { ...item };

        // Add itemId if missing
        if (!updatedItem.itemId) {
          updatedItem.itemId = generateStableId("item_");
          modified = true;
        }

        itemIds.push(updatedItem.itemId);
        return updatedItem;
      });

      // Create or update order array
      const orderFieldName =
        `${fieldName}Order` as keyof typeof updatedUserData;
      if (
        !updatedUserData[orderFieldName] ||
        JSON.stringify(updatedUserData[orderFieldName]) !==
          JSON.stringify(itemIds)
      ) {
        (updatedUserData as Record<string, unknown>)[orderFieldName] = itemIds;
        modified = true;
      }
    }
  });

  // Initialize checklistSectionOrder if it doesn't exist
  if (!updatedUserData.checklistSectionOrder) {
    updatedUserData.checklistSectionOrder = [
      "masterChecklist",
      "habitBreakChecklist",
      "workoutChecklist",
      "todoList",
    ];
    modified = true;
  }

  return { modified, userData: updatedUserData };
}
