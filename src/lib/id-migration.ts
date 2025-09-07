/**
 * ID Migration Utility
 *
 * Migrates old ID systems to new optimized itemId system
 */

import { connectDB } from "./database";
import { generateId } from "./id-generation";

interface MigrationResult {
  success: boolean;
  migratedCollections: string[];
  errors: string[];
  oldToNewMapping: Record<string, string>;
}

/**
 * Migrate ContentTemplate items to include required itemId
 */
export async function migrateContentTemplateIds(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migratedCollections: [],
    errors: [],
    oldToNewMapping: {},
  };

  try {
    await connectDB();
    const { ContentTemplate } = await import("./database");

    const templates = await ContentTemplate.find({});

    for (const template of templates) {
      let hasChanges = false;

      // Migrate masterChecklist items
      if (template.content.masterChecklist) {
        template.content.masterChecklist.forEach((item: any, index: number) => {
          if (!item.itemId) {
            const newItemId = generateId.template.masterChecklist(
              item.category || "morning",
              index
            );
            result.oldToNewMapping[item.id] = newItemId;
            item.itemId = newItemId;
            hasChanges = true;
          }
        });
      }

      // Migrate habitBreakChecklist items
      if (template.content.habitBreakChecklist) {
        template.content.habitBreakChecklist.forEach(
          (item: any, index: number) => {
            if (!item.itemId) {
              const newItemId = generateId.template.habitBreak(
                item.category || "lsd",
                index
              );
              result.oldToNewMapping[item.id] = newItemId;
              item.itemId = newItemId;
              hasChanges = true;
            }
          }
        );
      }

      // Migrate workoutChecklist items
      if (template.content.workoutChecklist) {
        template.content.workoutChecklist.forEach(
          (item: any, index: number) => {
            if (!item.itemId) {
              const newItemId = `wk-${item.category || "cardio"}-${String(
                index
              ).padStart(3, "0")}`;
              result.oldToNewMapping[item.id] = newItemId;
              item.itemId = newItemId;
              hasChanges = true;
            }
          }
        );
      }

      if (hasChanges) {
        await template.save();
        console.log(`Migrated ContentTemplate ${template.userRole}`);
      }
    }

    result.migratedCollections.push("content_templates");
    result.success = true;
  } catch (error) {
    result.errors.push(`ContentTemplate migration failed: ${error}`);
  }

  return result;
}

/**
 * Migrate UserData items to include required itemId
 */
export async function migrateUserDataIds(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migratedCollections: [],
    errors: [],
    oldToNewMapping: {},
  };

  try {
    await connectDB();
    const { UserData } = await import("./database");

    const userData = await UserData.find({});

    for (const data of userData) {
      let hasChanges = false;

      // Migrate masterChecklist items
      if (data.masterChecklist) {
        data.masterChecklist.forEach((item: any, index: number) => {
          if (!item.itemId) {
            const newItemId = `mc-user-${item.category || "morning"}-${String(
              index
            ).padStart(3, "0")}`;
            result.oldToNewMapping[item.id] = newItemId;
            item.itemId = newItemId;
            hasChanges = true;
          }
        });
      }

      // Migrate habitBreakChecklist items
      if (data.habitBreakChecklist) {
        data.habitBreakChecklist.forEach((item: any, index: number) => {
          if (!item.itemId) {
            const newItemId = `hb-user-${item.category || "lsd"}-${String(
              index
            ).padStart(3, "0")}`;
            result.oldToNewMapping[item.id] = newItemId;
            item.itemId = newItemId;
            hasChanges = true;
          }
        });
      }

      // Migrate workoutChecklist items
      if (data.workoutChecklist) {
        data.workoutChecklist.forEach((item: any, index: number) => {
          if (!item.itemId) {
            const newItemId = `wk-user-${item.category || "cardio"}-${String(
              index
            ).padStart(3, "0")}`;
            result.oldToNewMapping[item.id] = newItemId;
            item.itemId = newItemId;
            hasChanges = true;
          }
        });
      }

      // Migrate todoList items
      if (data.todoList) {
        data.todoList.forEach((item: any, index: number) => {
          if (!item.itemId) {
            const newItemId = `todo-user-${data.userId}-${String(
              index
            ).padStart(3, "0")}`;
            result.oldToNewMapping[item.id] = newItemId;
            item.itemId = newItemId;
            hasChanges = true;
          }
        });
      }

      if (hasChanges) {
        await data.save();
        console.log(`Migrated UserData for ${data.userId} on ${data.date}`);
      }
    }

    result.migratedCollections.push("user_data");
    result.success = true;
  } catch (error) {
    result.errors.push(`UserData migration failed: ${error}`);
  }

  return result;
}

/**
 * Run complete ID migration
 */
export async function runIdMigration(): Promise<MigrationResult> {
  console.log("Starting ID migration...");

  const contentResult = await migrateContentTemplateIds();
  const userDataResult = await migrateUserDataIds();

  const combinedResult: MigrationResult = {
    success: contentResult.success && userDataResult.success,
    migratedCollections: [
      ...contentResult.migratedCollections,
      ...userDataResult.migratedCollections,
    ],
    errors: [...contentResult.errors, ...userDataResult.errors],
    oldToNewMapping: {
      ...contentResult.oldToNewMapping,
      ...userDataResult.oldToNewMapping,
    },
  };

  if (combinedResult.success) {
    console.log("✅ ID migration completed successfully");
    console.log(
      `Migrated collections: ${combinedResult.migratedCollections.join(", ")}`
    );
    console.log(
      `Generated ${
        Object.keys(combinedResult.oldToNewMapping).length
      } ID mappings`
    );
  } else {
    console.error("❌ ID migration failed");
    combinedResult.errors.forEach((error) => console.error(error));
  }

  return combinedResult;
}

/**
 * Get old->new ID mapping for a specific ID
 */
export function getNewIdForOld(
  oldId: string,
  mapping: Record<string, string>
): string | null {
  return mapping[oldId] || null;
}

/**
 * Validate that all items have required itemId
 */
export async function validateItemIds(): Promise<{
  valid: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  try {
    await connectDB();
    const { ContentTemplate, UserData } = await import("./database");

    // Check ContentTemplate
    const templates = await ContentTemplate.find({});
    for (const template of templates) {
      ["masterChecklist", "habitBreakChecklist", "workoutChecklist"].forEach(
        (listName) => {
          const list = template.content[listName];
          if (Array.isArray(list)) {
            list.forEach((item: any, index: number) => {
              if (!item.itemId) {
                issues.push(
                  `ContentTemplate ${template.userRole} ${listName}[${index}] missing itemId`
                );
              }
            });
          }
        }
      );
    }

    // Check UserData
    const userData = await UserData.find({});
    for (const data of userData) {
      [
        "masterChecklist",
        "habitBreakChecklist",
        "workoutChecklist",
        "todoList",
      ].forEach((listName) => {
        const list = data[listName];
        if (Array.isArray(list)) {
          list.forEach((item: any, index: number) => {
            if (!item.itemId) {
              issues.push(
                `UserData ${data.userId}/${data.date} ${listName}[${index}] missing itemId`
              );
            }
          });
        }
      });
    }
  } catch (error) {
    issues.push(`Validation failed: ${error}`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
