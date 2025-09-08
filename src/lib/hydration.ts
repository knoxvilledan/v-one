import { connectDB } from "./database";
import { TemplateSet, type ITemplateSet } from "../models/TemplateSet";
import { UserSpace, type IUserSpace } from "../models/UserSpace";
import { DayEntry, type IDayEntry } from "../models/DayEntry";
import { TodoItem, type ITodoItem } from "../models/TodoItem";
import User from "../models/User";

export interface HydratedUserData {
  // Base user info
  user: {
    id: string;
    email: string;
    role: "public" | "admin";
  };

  // Template data (merged with user overrides)
  templateSet: {
    version: string;
    timeBlocks: Array<{
      blockId: string;
      time: string;
      label: string;
      order: number;
      isCustom?: boolean; // true if this is a user override
    }>;
    timeBlocksOrder: string[];

    checklists: Array<{
      checklistId: string;
      title: string;
      items: Array<{
        itemId: string;
        text: string;
        order: number;
        isCustom?: boolean; // true if this is a user override
      }>;
      itemsOrder: string[];
      order: number;
      isCustom?: boolean; // true if this is a user override
    }>;
    checklistsOrder: string[];
  };

  // User preferences and overrides
  userSpace: IUserSpace | null;

  // Today's data
  todayEntry: IDayEntry | null;

  // Active todos
  todos: {
    pending: ITodoItem[];
    inProgress: ITodoItem[];
    dueToday: ITodoItem[];
    overdue: ITodoItem[];
  };

  // Recent activity
  recentDays: IDayEntry[];
}

export class HydrationService {
  /**
   * Load all user data needed for the application
   */
  static async hydrateUserData(
    email: string,
    targetDate?: string // YYYY-MM-DD format, defaults to today
  ): Promise<HydratedUserData | null> {
    try {
      await connectDB();

      // Get base user info
      const user = (await User.findOne({ email }).lean()) as {
        _id: { toString(): string };
        email: string;
        role: "public" | "admin";
      } | null;
      if (!user) return null;

      const today = targetDate || new Date().toISOString().split("T")[0];

      // Load all data in parallel
      const [templateSet, userSpace, todayEntry, todos, recentDays] =
        await Promise.all([
          this.getActiveTemplateSet(user.role),
          this.getUserSpace(user._id.toString(), email),
          this.getDayEntry(user._id.toString(), email, today),
          this.getUserTodos(user._id.toString()),
          this.getRecentDayEntries(user._id.toString(), email, 7),
        ]);

      if (!templateSet) {
        throw new Error(`No active template set found for role: ${user.role}`);
      }

      // Merge template data with user overrides
      const mergedTemplateSet = this.mergeTemplateWithOverrides(
        templateSet,
        userSpace
      );

      return {
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
        },
        templateSet: mergedTemplateSet,
        userSpace,
        todayEntry,
        todos,
        recentDays,
      };
    } catch (error) {
      console.error("Error hydrating user data:", error);
      throw error;
    }
  }

  /**
   * Get the active template set for a role
   */
  private static async getActiveTemplateSet(
    role: "public" | "admin"
  ): Promise<ITemplateSet | null> {
    return (await TemplateSet.findOne({
      role,
      isActive: true,
    }).lean()) as ITemplateSet | null;
  }

  /**
   * Get or create user space
   */
  private static async getUserSpace(
    userId: string,
    email: string
  ): Promise<IUserSpace | null> {
    let userSpace = (await UserSpace.findOne({
      userId,
    }).lean()) as IUserSpace | null;

    if (!userSpace) {
      // Create default user space
      userSpace = await UserSpace.create({
        userId,
        email,
        timeBlockOverrides: [],
        checklistOverrides: [],
        preferences: {
          theme: "auto",
          timezone: "UTC",
          defaultView: "both",
          notifications: {
            timeBlockReminders: true,
            dailyDigest: false,
          },
        },
      });
    }

    return userSpace;
  }

  /**
   * Get day entry for a specific date
   */
  private static async getDayEntry(
    userId: string,
    email: string,
    date: string
  ): Promise<IDayEntry | null> {
    return (await DayEntry.findOne({
      userId,
      date,
    }).lean()) as IDayEntry | null;
  }

  /**
   * Get user's active todos organized by status
   */
  private static async getUserTodos(userId: string) {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    const [pending, inProgress, dueToday, overdue] = await Promise.all([
      TodoItem.find({
        userId,
        status: "pending",
        archivedAt: { $exists: false },
      })
        .sort({ priority: -1, createdAt: 1 })
        .lean()
        .exec() as unknown as Promise<ITodoItem[]>,

      TodoItem.find({
        userId,
        status: "in-progress",
        archivedAt: { $exists: false },
      })
        .sort({ priority: -1, updatedAt: -1 })
        .lean()
        .exec() as unknown as Promise<ITodoItem[]>,

      TodoItem.find({
        userId,
        status: { $in: ["pending", "in-progress"] },
        dueDate: {
          $gte: new Date(today),
          $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000),
        },
        archivedAt: { $exists: false },
      })
        .sort({ priority: -1, dueDate: 1 })
        .lean()
        .exec() as unknown as Promise<ITodoItem[]>,

      TodoItem.find({
        userId,
        status: { $in: ["pending", "in-progress"] },
        dueDate: { $lt: new Date(today) },
        archivedAt: { $exists: false },
      })
        .sort({ dueDate: 1, priority: -1 })
        .lean()
        .exec() as unknown as Promise<ITodoItem[]>,
    ]);

    return { pending, inProgress, dueToday, overdue };
  }

  /**
   * Get recent day entries
   */
  private static async getRecentDayEntries(
    userId: string,
    email: string,
    days: number
  ): Promise<IDayEntry[]> {
    return (await DayEntry.find({ userId })
      .sort({ date: -1 })
      .limit(days)
      .lean()) as unknown as IDayEntry[];
  }

  /**
   * Merge template set with user overrides
   */
  private static mergeTemplateWithOverrides(
    templateSet: ITemplateSet,
    userSpace: IUserSpace | null
  ) {
    if (!userSpace) {
      return {
        version: templateSet.version,
        timeBlocks: templateSet.timeBlocks,
        timeBlocksOrder: templateSet.timeBlocksOrder || [],
        checklists: templateSet.checklists,
        checklistsOrder: templateSet.checklistsOrder || [],
      };
    }

    // Apply time block overrides
    const timeBlocks = templateSet.timeBlocks
      .map((block) => {
        const override = userSpace?.timeBlockOverrides?.find(
          (o) => o.blockId === block.blockId
        );
        if (override && override.isHidden) {
          return null; // Will be filtered out
        }

        return {
          ...block,
          label: override?.label || block.label,
          time: override?.time || block.time,
          isCustom: !!override?.label || !!override?.time,
        };
      })
      .filter(Boolean) as Array<{
      blockId: string;
      time: string;
      label: string;
      order: number;
      isCustom?: boolean;
    }>;

    // Apply checklist overrides
    const checklists = templateSet.checklists
      .map((checklist) => {
        const checklistOverride = userSpace?.checklistOverrides?.find(
          (o) => o.checklistId === checklist.checklistId
        );
        if (checklistOverride && checklistOverride.isHidden) {
          return null; // Will be filtered out
        }

        const items = checklist.items
          .map((item) => {
            const itemOverride = checklistOverride?.itemOverrides.find(
              (o) => o.itemId === item.itemId
            );
            if (itemOverride && itemOverride.isHidden) {
              return null; // Will be filtered out
            }

            return {
              ...item,
              text: itemOverride?.text || item.text,
              isCustom: !!itemOverride?.text,
            };
          })
          .filter(Boolean) as Array<{
          itemId: string;
          text: string;
          order: number;
          isCustom?: boolean;
        }>;

        return {
          ...checklist,
          title: checklistOverride?.title || checklist.title,
          items,
          itemsOrder: (checklist.itemsOrder || []).filter((id) =>
            items.some((item) => item.itemId === id)
          ),
          isCustom: !!checklistOverride?.title,
        };
      })
      .filter(Boolean) as Array<{
      checklistId: string;
      title: string;
      items: Array<{
        itemId: string;
        text: string;
        order: number;
        isCustom?: boolean;
      }>;
      itemsOrder: string[];
      order: number;
      isCustom?: boolean;
    }>;

    return {
      version: templateSet.version,
      timeBlocks,
      timeBlocksOrder: (templateSet.timeBlocksOrder || []).filter((id) =>
        timeBlocks.some((block) => block.blockId === id)
      ),
      checklists,
      checklistsOrder: (templateSet.checklistsOrder || []).filter((id) =>
        checklists.some((checklist) => checklist.checklistId === id)
      ),
    };
  }

  /**
   * Update day data
   */
  static async updateDayData(
    email: string,
    date: string,
    data: any
  ): Promise<void> {
    try {
      await connectDB();
      const user = await User.findOne({ email }).lean();
      if (!user) throw new Error("User not found");

      // Update or create day entry
      await DayEntry.findOneAndUpdate(
        { userId: user._id.toString(), date },
        {
          $set: {
            ...data,
            updatedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error("Error updating day data:", error);
      throw error;
    }
  }

  /**
   * Complete a checklist item
   */
  static async completeItem(
    email: string,
    date: string,
    itemId: string,
    category: string
  ): Promise<void> {
    try {
      await connectDB();
      const user = await User.findOne({ email }).lean();
      if (!user) throw new Error("User not found");

      const checklistIdMap: Record<string, string> = {
        master: "master-checklist",
        habit: "habit-break-checklist",
        workout: "workout-checklist",
        todo: "todo-list",
      };

      const checklistId = checklistIdMap[category] || category;

      await DayEntry.findOneAndUpdate(
        { userId: user._id.toString(), date },
        {
          $addToSet: {
            [`checklistCompletions.${checklistId}`]: {
              itemId,
              completedAt: new Date(),
            },
          },
          $set: { updatedAt: new Date() },
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error("Error completing item:", error);
      throw error;
    }
  }

  /**
   * Toggle time block completion
   */
  static async toggleTimeBlock(
    email: string,
    date: string,
    blockId: string
  ): Promise<void> {
    try {
      await connectDB();
      const user = await User.findOne({ email }).lean();
      if (!user) throw new Error("User not found");

      const dayEntry = await DayEntry.findOne({
        userId: user._id.toString(),
        date,
      });

      if (!dayEntry) {
        // Create new entry with completed block
        await DayEntry.create({
          userId: user._id.toString(),
          date,
          timeBlockCompletions: [
            {
              blockId,
              completedAt: new Date(),
              notes: [],
            },
          ],
        });
      } else {
        // Toggle existing block
        const existingIndex = dayEntry.timeBlockCompletions.findIndex(
          (comp: any) => comp.blockId === blockId
        );

        if (existingIndex >= 0) {
          // Remove completion
          dayEntry.timeBlockCompletions.splice(existingIndex, 1);
        } else {
          // Add completion
          dayEntry.timeBlockCompletions.push({
            blockId,
            completedAt: new Date(),
            notes: [],
          });
        }

        await dayEntry.save();
      }
    } catch (error) {
      console.error("Error toggling time block:", error);
      throw error;
    }
  }

  /**
   * Add note to time block
   */
  static async addBlockNote(
    email: string,
    date: string,
    blockId: string,
    note: string
  ): Promise<void> {
    try {
      await connectDB();
      const user = await User.findOne({ email }).lean();
      if (!user) throw new Error("User not found");

      await DayEntry.findOneAndUpdate(
        {
          userId: user._id.toString(),
          date,
          "timeBlockCompletions.blockId": blockId,
        },
        {
          $push: { "timeBlockCompletions.$.notes": note },
          $set: { updatedAt: new Date() },
        },
        { upsert: false }
      );

      // If block doesn't exist, create it
      const result = await DayEntry.findOne({
        userId: user._id.toString(),
        date,
        "timeBlockCompletions.blockId": blockId,
      });

      if (!result) {
        await DayEntry.findOneAndUpdate(
          { userId: user._id.toString(), date },
          {
            $push: {
              timeBlockCompletions: {
                blockId,
                notes: [note],
                completedAt: new Date(),
              },
            },
            $set: { updatedAt: new Date() },
          },
          { upsert: true }
        );
      }
    } catch (error) {
      console.error("Error adding block note:", error);
      throw error;
    }
  }

  /**
   * Delete note from time block
   */
  static async deleteBlockNote(
    email: string,
    date: string,
    blockId: string,
    noteIndex: number
  ): Promise<void> {
    try {
      await connectDB();
      const user = await User.findOne({ email }).lean();
      if (!user) throw new Error("User not found");

      const dayEntry = await DayEntry.findOne({
        userId: user._id.toString(),
        date,
        "timeBlockCompletions.blockId": blockId,
      });

      if (dayEntry) {
        const blockCompletion = dayEntry.timeBlockCompletions.find(
          (comp: any) => comp.blockId === blockId
        );

        if (
          blockCompletion &&
          blockCompletion.notes &&
          blockCompletion.notes.length > noteIndex
        ) {
          blockCompletion.notes.splice(noteIndex, 1);
          await dayEntry.save();
        }
      }
    } catch (error) {
      console.error("Error deleting block note:", error);
      throw error;
    }
  }

  /**
   * Update time block label
   */
  static async updateBlockLabel(
    email: string,
    date: string,
    blockId: string,
    newLabel: string
  ): Promise<void> {
    try {
      await connectDB();
      const user = await User.findOne({ email }).lean();
      if (!user) throw new Error("User not found");

      // Update in user space overrides for persistence
      await UserSpace.findOneAndUpdate(
        { userId: user._id.toString() },
        {
          $set: {
            [`timeBlockOverrides.${blockId}.label`]: newLabel,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    } catch (error) {
      console.error("Error updating block label:", error);
      throw error;
    }
  }

  /**
   * Add new checklist item to user's custom items
   */
  static async addChecklistItem(
    email: string,
    checklistType: string,
    item: {
      text: string;
      category: string;
    }
  ): Promise<string> {
    try {
      await connectDB();
      const user = await User.findOne({ email });
      if (!user) throw new Error("User not found");

      // Generate a proper ID
      const itemId = `custom-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Map checklist types to database IDs
      const checklistIdMap: Record<string, string> = {
        master: "daily-master-checklist",
        habit: "habit-break-tracker",
        workout: "workout-checklist",
        todo: "todo-list",
      };

      const checklistId = checklistIdMap[checklistType] || checklistType;

      // Add to user's custom checklist items in UserSpace
      await UserSpace.findOneAndUpdate(
        { userId: user._id.toString() },
        {
          $push: {
            [`checklistOverrides.${checklistId}.customItems`]: {
              itemId,
              text: item.text,
              category: item.category,
              order: Date.now(), // Use timestamp for ordering
              isCustom: true,
              createdAt: new Date(),
            },
          },
          $set: { updatedAt: new Date() },
        },
        { upsert: true, new: true }
      );

      return itemId;
    } catch (error) {
      console.error("Error adding checklist item:", error);
      throw error;
    }
  }

  /**
   * Add new time block to user's custom blocks
   */
  static async addTimeBlock(
    email: string,
    block: {
      time: string;
      label: string;
    }
  ): Promise<string> {
    try {
      await connectDB();
      const user = await User.findOne({ email });
      if (!user) throw new Error("User not found");

      // Generate a proper ID
      const blockId = `custom-block-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Add to user's custom time blocks in UserSpace
      await UserSpace.findOneAndUpdate(
        { userId: user._id.toString() },
        {
          $push: {
            "timeBlockOverrides.customBlocks": {
              blockId,
              time: block.time,
              label: block.label,
              order: Date.now(), // Use timestamp for ordering
              isCustom: true,
              createdAt: new Date(),
            },
          },
          $set: { updatedAt: new Date() },
        },
        { upsert: true, new: true }
      );

      return blockId;
    } catch (error) {
      console.error("Error adding time block:", error);
      throw error;
    }
  }

  /**
   * Update checklist item text
   */
  static async updateChecklistItem(
    email: string,
    itemId: string,
    updates: {
      text?: string;
      category?: string;
    }
  ): Promise<void> {
    try {
      await connectDB();
      const user = await User.findOne({ email });
      if (!user) throw new Error("User not found");

      // Update in UserSpace custom items
      const updateFields: any = {};
      if (updates.text) {
        updateFields["checklistOverrides.$[elem].customItems.$[item].text"] =
          updates.text;
      }
      if (updates.category) {
        updateFields[
          "checklistOverrides.$[elem].customItems.$[item].category"
        ] = updates.category;
      }
      updateFields["updatedAt"] = new Date();

      await UserSpace.findOneAndUpdate(
        { userId: user._id.toString() },
        { $set: updateFields },
        {
          arrayFilters: [
            { "elem.customItems.itemId": itemId },
            { "item.itemId": itemId },
          ],
        }
      );
    } catch (error) {
      console.error("Error updating checklist item:", error);
      throw error;
    }
  }

  /**
   * Delete checklist item
   */
  static async deleteChecklistItem(
    email: string,
    itemId: string
  ): Promise<void> {
    try {
      await connectDB();
      const user = await User.findOne({ email });
      if (!user) throw new Error("User not found");

      // Remove from UserSpace custom items
      await UserSpace.findOneAndUpdate(
        { userId: user._id.toString() },
        {
          $pull: {
            "checklistOverrides.$[].customItems": { itemId },
          },
          $set: { updatedAt: new Date() },
        }
      );
    } catch (error) {
      console.error("Error deleting checklist item:", error);
      throw error;
    }
  }

  /**
   * Update time block
   */
  static async updateTimeBlock(
    email: string,
    blockId: string,
    updates: {
      time?: string;
      label?: string;
    }
  ): Promise<void> {
    try {
      await connectDB();
      const user = await User.findOne({ email });
      if (!user) throw new Error("User not found");

      // Update in UserSpace custom blocks
      const updateFields: any = {};
      if (updates.time) {
        updateFields["timeBlockOverrides.customBlocks.$[block].time"] =
          updates.time;
      }
      if (updates.label) {
        updateFields["timeBlockOverrides.customBlocks.$[block].label"] =
          updates.label;
      }
      updateFields["updatedAt"] = new Date();

      await UserSpace.findOneAndUpdate(
        { userId: user._id.toString() },
        { $set: updateFields },
        {
          arrayFilters: [{ "block.blockId": blockId }],
        }
      );
    } catch (error) {
      console.error("Error updating time block:", error);
      throw error;
    }
  }

  /**
   * Delete time block
   */
  static async deleteTimeBlock(email: string, blockId: string): Promise<void> {
    try {
      await connectDB();
      const user = await User.findOne({ email });
      if (!user) throw new Error("User not found");

      // Remove from UserSpace custom blocks
      await UserSpace.findOneAndUpdate(
        { userId: user._id.toString() },
        {
          $pull: {
            "timeBlockOverrides.customBlocks": { blockId },
          },
          $set: { updatedAt: new Date() },
        }
      );
    } catch (error) {
      console.error("Error deleting time block:", error);
      throw error;
    }
  }
}
