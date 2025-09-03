import "server-only";
import { connectMongoose } from "./db";
import {
  ContentTemplate,
  type IContentTemplate,
  type ITimeBlockTemplate,
  type IChecklistTemplate,
} from "../models/ContentTemplate";
import UserData, { type IUserData } from "../models/UserData";
import User, { type IUser } from "../models/User";
import { ContentService } from "./content-service";
import { generateId } from "./id-generation";
import { Block, ChecklistItem } from "../types";

export interface TemplateSyncOptions {
  syncTimeBlocks?: boolean;
  syncChecklists?: boolean;
  syncPlaceholderText?: boolean;
  preserveUserIds?: boolean;
}

export interface SyncResult {
  success: boolean;
  message: string;
  affectedUsers?: number;
  errors?: string[];
}

export class TemplateSyncService {
  /**
   * Main synchronization function: Admin templates serve as source of truth
   * 1. Admin template changes propagate to public template
   * 2. Public template changes propagate to all user documents
   * 3. All IDs and relationships are maintained
   */
  static async syncAdminToPublicAndUsers(
    options: TemplateSyncOptions = {
      syncTimeBlocks: true,
      syncChecklists: true,
      syncPlaceholderText: true,
      preserveUserIds: true,
    }
  ): Promise<SyncResult> {
    try {
      await connectMongoose();

      // Step 1: Get admin template (source of truth)
      const adminTemplate = await ContentTemplate.findOne({
        userRole: "admin",
      }).lean<IContentTemplate>();

      if (!adminTemplate) {
        return {
          success: false,
          message: "Admin template not found - cannot propagate changes",
        };
      }

      // Step 2: Update public template from admin template
      const publicSyncResult = await this.syncAdminToPublic(
        adminTemplate,
        options
      );
      if (!publicSyncResult.success) {
        return publicSyncResult;
      }

      // Step 3: Get updated public template
      const publicTemplate = await ContentTemplate.findOne({
        userRole: "public",
      }).lean<IContentTemplate>();

      if (!publicTemplate) {
        return {
          success: false,
          message: "Public template not found after sync",
        };
      }

      // Step 4: Propagate public template to all user documents
      const userSyncResult = await this.syncPublicToAllUsers(
        publicTemplate,
        options
      );

      return {
        success: userSyncResult.success,
        message: `Template sync complete: ${publicSyncResult.message}, ${userSyncResult.message}`,
        affectedUsers: userSyncResult.affectedUsers,
        errors: userSyncResult.errors,
      };
    } catch (error) {
      console.error("Template sync error:", error);
      return {
        success: false,
        message: `Template sync failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Sync admin template to public template
   * Maintains schema consistency while updating content
   */
  private static async syncAdminToPublic(
    adminTemplate: IContentTemplate,
    options: TemplateSyncOptions
  ): Promise<SyncResult> {
    try {
      const publicTemplate = await ContentTemplate.findOne({
        userRole: "public",
      }).lean<IContentTemplate>();

      if (!publicTemplate) {
        return {
          success: false,
          message: "Public template not found",
        };
      }

      const updatedContent = { ...publicTemplate.content };

      // Sync time blocks
      if (options.syncTimeBlocks && adminTemplate.content.timeBlocks) {
        updatedContent.timeBlocks = this.convertTemplateTimeBlocks(
          adminTemplate.content.timeBlocks,
          "public"
        );
        updatedContent.timeBlocksOrder = this.convertOrder(
          adminTemplate.content.timeBlocksOrder || [],
          "public"
        );
      }

      // Sync checklists
      if (options.syncChecklists) {
        if (adminTemplate.content.masterChecklist) {
          updatedContent.masterChecklist = this.convertTemplateChecklist(
            adminTemplate.content.masterChecklist,
            "public"
          );
          updatedContent.masterChecklistOrder = this.convertOrder(
            adminTemplate.content.masterChecklistOrder || [],
            "public"
          );
        }

        if (adminTemplate.content.habitBreakChecklist) {
          updatedContent.habitBreakChecklist = this.convertTemplateChecklist(
            adminTemplate.content.habitBreakChecklist,
            "public"
          );
          updatedContent.habitBreakChecklistOrder = this.convertOrder(
            adminTemplate.content.habitBreakChecklistOrder || [],
            "public"
          );
        }

        if (adminTemplate.content.workoutChecklist) {
          updatedContent.workoutChecklist = this.convertTemplateChecklist(
            adminTemplate.content.workoutChecklist,
            "public"
          );
          updatedContent.workoutChecklistOrder = this.convertOrder(
            adminTemplate.content.workoutChecklistOrder || [],
            "public"
          );
        }
      }

      // Sync placeholder text
      if (
        options.syncPlaceholderText &&
        adminTemplate.content.placeholderText
      ) {
        updatedContent.placeholderText = {
          ...adminTemplate.content.placeholderText,
        };
      }

      // Update public template
      const result = await ContentTemplate.updateOne(
        { userRole: "public" },
        {
          $set: {
            content: updatedContent,
            updatedAt: new Date(),
          },
        }
      );

      return {
        success: result.modifiedCount > 0,
        message:
          result.modifiedCount > 0
            ? "Public template updated from admin template"
            : "Public template already up to date",
      };
    } catch (error) {
      console.error("Admin to public sync error:", error);
      return {
        success: false,
        message: `Failed to sync admin to public: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Sync public template to all user documents
   * Preserves user-specific data while updating template structure
   */
  private static async syncPublicToAllUsers(
    publicTemplate: IContentTemplate,
    options: TemplateSyncOptions
  ): Promise<SyncResult> {
    try {
      // Get all users (excluding admin if they have custom data)
      const users = await UserData.find({}).lean();

      if (!users || users.length === 0) {
        return {
          success: true,
          message: "No user documents to sync",
          affectedUsers: 0,
        };
      }

      let affectedUsers = 0;
      const errors: string[] = [];

      for (const user of users) {
        try {
          const updatedData = { ...user };

          // Sync time blocks structure while preserving user data
          if (options.syncTimeBlocks && publicTemplate.content.timeBlocks) {
            const syncedTimeBlocks = this.syncUserTimeBlocks(
              user.blocks || [],
              publicTemplate.content.timeBlocks,
              options.preserveUserIds || false
            );
            updatedData.blocks = syncedTimeBlocks;
            updatedData.timeBlocksOrder = this.generateUserOrder(
              syncedTimeBlocks.map((b) => b.blockId || b.id || generateId())
            );
          }

          // Sync checklist structures while preserving user data
          if (options.syncChecklists) {
            if (publicTemplate.content.masterChecklist) {
              updatedData.masterChecklist = this.syncUserChecklist(
                user.masterChecklist || [],
                publicTemplate.content.masterChecklist,
                options.preserveUserIds || false
              );
              updatedData.masterChecklistOrder = this.generateUserOrder(
                updatedData.masterChecklist.map(
                  (item) => item.itemId || item.id || generateId()
                )
              );
            }

            if (publicTemplate.content.habitBreakChecklist) {
              updatedData.habitBreakChecklist = this.syncUserChecklist(
                user.habitBreakChecklist || [],
                publicTemplate.content.habitBreakChecklist,
                options.preserveUserIds || false
              );
              updatedData.habitBreakChecklistOrder = this.generateUserOrder(
                updatedData.habitBreakChecklist.map(
                  (item) => item.itemId || item.id || generateId()
                )
              );
            }
          }

          // Update user document
          const result = await UserData.updateOne(
            { _id: user._id },
            {
              $set: {
                ...updatedData,
                updatedAt: new Date(),
              },
            }
          );

          if (result.modifiedCount > 0) {
            affectedUsers++;
          }
        } catch (userError) {
          console.error(`Error syncing user ${user.userId}:`, userError);
          errors.push(
            `User ${user.userId}: ${
              userError instanceof Error ? userError.message : "Unknown error"
            }`
          );
        }
      }

      return {
        success: errors.length === 0,
        message: `Synced ${affectedUsers} user documents`,
        affectedUsers,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error("Public to users sync error:", error);
      return {
        success: false,
        message: `Failed to sync public to users: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        affectedUsers: 0,
      };
    }
  }

  /**
   * Convert admin template time blocks to public template format
   */
  private static convertTemplateTimeBlocks(
    adminTimeBlocks: any[],
    targetRole: "public" | "admin"
  ): any[] {
    return adminTimeBlocks.map((block, index) => ({
      ...block,
      id: `${targetRole}-t${Date.now()}-${index}`,
      blockId: `${targetRole}-block-${index + 1}`,
      order: index + 1,
    }));
  }

  /**
   * Convert admin template checklist to public template format
   */
  private static convertTemplateChecklist(
    adminChecklist: any[],
    targetRole: "public" | "admin"
  ): any[] {
    return adminChecklist.map((item, index) => ({
      ...item,
      id: `${targetRole}-${item.category}-${Date.now()}-${index}`,
      itemId: `${targetRole}-item-${index + 1}`,
      order: index + 1,
    }));
  }

  /**
   * Convert order arrays for different roles
   */
  private static convertOrder(
    adminOrder: string[],
    targetRole: "public" | "admin"
  ): string[] {
    return adminOrder.map((id, index) =>
      id
        .replace(/^admin-/, `${targetRole}-`)
        .replace(/^public-/, `${targetRole}-`)
    );
  }

  /**
   * Sync user time blocks with template while preserving user data
   */
  private static syncUserTimeBlocks(
    userBlocks: any[],
    templateBlocks: any[],
    preserveUserIds: boolean
  ): any[] {
    const syncedBlocks = [];

    for (const templateBlock of templateBlocks) {
      // Find corresponding user block by position or ID
      const userBlock =
        userBlocks[templateBlock.order - 1] ||
        userBlocks.find((b) => b.blockId === templateBlock.blockId);

      if (userBlock && preserveUserIds) {
        // Preserve user data and IDs, update template structure
        syncedBlocks.push({
          ...userBlock,
          time: templateBlock.time, // Update time from template
          // Keep user's label and other data
          blockId: userBlock.blockId || templateBlock.blockId,
          order: templateBlock.order,
        });
      } else {
        // Create new block from template
        syncedBlocks.push({
          ...templateBlock,
          id: `user-t${Date.now()}-${templateBlock.order}`,
          blockId: `user-block-${templateBlock.order}`,
          label: templateBlock.label, // Use template label for new blocks
          completed: false,
          notes: [],
        });
      }
    }

    return syncedBlocks;
  }

  /**
   * Sync user checklist with template while preserving user data
   */
  private static syncUserChecklist(
    userChecklist: any[],
    templateChecklist: any[],
    preserveUserIds: boolean
  ): any[] {
    const syncedChecklist = [];

    for (const templateItem of templateChecklist) {
      // Find corresponding user item by position or ID
      const userItem =
        userChecklist[templateItem.order - 1] ||
        userChecklist.find((item) => item.itemId === templateItem.itemId);

      if (userItem && preserveUserIds) {
        // Preserve user data and IDs, update template structure
        syncedChecklist.push({
          ...userItem,
          text: templateItem.text, // Update text from template
          category: templateItem.category, // Update category from template
          itemId: userItem.itemId || templateItem.itemId,
          order: templateItem.order,
        });
      } else {
        // Create new item from template
        syncedChecklist.push({
          ...templateItem,
          id: `user-${templateItem.category}-${Date.now()}-${
            templateItem.order
          }`,
          itemId: `user-item-${templateItem.order}`,
          completed: false,
        });
      }
    }

    return syncedChecklist;
  }

  /**
   * Generate user-specific order arrays
   */
  private static generateUserOrder(ids: string[]): string[] {
    return ids.filter((id) => id && id.length > 0);
  }

  /**
   * Manual trigger for admin-only synchronization
   * Call this after admin template changes
   */
  static async triggerFullSync(): Promise<SyncResult> {
    console.log("🔄 Triggering full template synchronization...");

    const result = await this.syncAdminToPublicAndUsers({
      syncTimeBlocks: true,
      syncChecklists: true,
      syncPlaceholderText: true,
      preserveUserIds: true,
    });

    console.log(`📊 Sync result: ${result.message}`);
    if (result.errors && result.errors.length > 0) {
      console.warn("⚠️ Sync warnings:", result.errors);
    }

    return result;
  }

  /**
   * Verify template integrity and ID consistency
   */
  static async verifyTemplateIntegrity(): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    try {
      await connectMongoose();

      const issues: string[] = [];

      // Check admin template
      const adminTemplate = await ContentTemplate.findOne({
        userRole: "admin",
      }).lean();
      if (!adminTemplate) {
        issues.push("Admin template missing");
      } else {
        issues.push(...this.validateTemplateStructure(adminTemplate, "admin"));
      }

      // Check public template
      const publicTemplate = await ContentTemplate.findOne({
        userRole: "public",
      }).lean();
      if (!publicTemplate) {
        issues.push("Public template missing");
      } else {
        issues.push(
          ...this.validateTemplateStructure(publicTemplate, "public")
        );
      }

      return {
        valid: issues.length === 0,
        issues,
      };
    } catch (error) {
      return {
        valid: false,
        issues: [
          `Verification failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
      };
    }
  }

  /**
   * Validate template structure and ID consistency
   */
  private static validateTemplateStructure(
    template: IContentTemplate,
    role: "admin" | "public"
  ): string[] {
    const issues: string[] = [];

    // Validate time blocks
    if (template.content.timeBlocks) {
      const timeBlockIds = new Set<string>();
      for (const block of template.content.timeBlocks) {
        if (!block.id) {
          issues.push(`${role} template: Time block missing id`);
        }
        if (timeBlockIds.has(block.id)) {
          issues.push(`${role} template: Duplicate time block id ${block.id}`);
        }
        timeBlockIds.add(block.id);

        if (!block.time || !block.label) {
          issues.push(
            `${role} template: Time block ${block.id} missing required fields`
          );
        }
      }
    }

    // Validate checklists
    const checklistTypes = [
      "masterChecklist",
      "habitBreakChecklist",
      "workoutChecklist",
    ] as const;
    for (const checklistType of checklistTypes) {
      const checklist = template.content[checklistType];
      if (checklist) {
        const itemIds = new Set<string>();
        for (const item of checklist) {
          if (!item.id) {
            issues.push(`${role} template: ${checklistType} item missing id`);
          }
          if (itemIds.has(item.id)) {
            issues.push(
              `${role} template: Duplicate ${checklistType} id ${item.id}`
            );
          }
          itemIds.add(item.id);

          if (!item.text || !item.category) {
            issues.push(
              `${role} template: ${checklistType} item ${item.id} missing required fields`
            );
          }
        }
      }
    }

    return issues;
  }
}
