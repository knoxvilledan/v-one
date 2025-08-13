import clientPromise from "./mongodb";
import { User, UserRole, ContentTemplate } from "../types/content";

export class ContentService {
  private static async getDatabase() {
    const client = await clientPromise;
    return client.db(); // default DB from connection string
  }

  // User Management
  static async createUser(
    email: string,
    name?: string,
    role: UserRole = "public"
  ): Promise<User> {
    try {
      const db = await this.getDatabase();
      const usersCollection = db.collection<User>("users");

      const user: User = {
        email,
        name,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const result = await usersCollection.insertOne(user);
      return { ...user, _id: result.insertedId.toString() };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const db = await this.getDatabase();
      const usersCollection = db.collection<User>("users");
      return await usersCollection.findOne({ email, isActive: true });
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  }

  static async updateUserRole(email: string, role: UserRole): Promise<boolean> {
    try {
      const db = await this.getDatabase();
      const usersCollection = db.collection<User>("users");

      const result = await usersCollection.updateOne(
        { email },
        { $set: { role, updatedAt: new Date() } }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error updating user role:", error);
      return false;
    }
  }

  // Content Template Management
  static async getContentTemplateByRole(
    userRole: UserRole
  ): Promise<ContentTemplate | null> {
    try {
      const db = await this.getDatabase();
      const contentCollection =
        db.collection<ContentTemplate>("content_templates");

      return await contentCollection.findOne({ userRole });
    } catch (error) {
      console.error("Error getting content template:", error);
      return null;
    }
  }

  static async createDefaultContentTemplates(): Promise<boolean> {
    try {
      const db = await this.getDatabase();
      const contentCollection =
        db.collection<ContentTemplate>("content_templates");

      // Public user template (generic placeholders)
      const publicTemplate: ContentTemplate = {
        userRole: "public",
        type: "placeholderText",
        content: {
          masterChecklist: [
            {
              id: "m1",
              text: "You can track your morning routine here",
              category: "morning",
              order: 1,
            },
            {
              id: "m2",
              text: "Add your daily habits to this checklist",
              category: "morning",
              order: 2,
            },
            {
              id: "w1",
              text: "Track your work tasks in this section",
              category: "work",
              order: 3,
            },
            {
              id: "t1",
              text: "Add your learning goals here",
              category: "tech",
              order: 4,
            },
            {
              id: "h1",
              text: "Keep track of household tasks",
              category: "house",
              order: 5,
            },
            {
              id: "wr1",
              text: "Plan tomorrow and reflect on today",
              category: "wrapup",
              order: 6,
            },
          ],
          habitBreakChecklist: [
            {
              id: "hb1",
              text: "You can break your habits by tracking them here",
              category: "lsd",
              order: 1,
            },
            {
              id: "hb2",
              text: "Click to edit and add your habit to break",
              category: "lsd",
              order: 2,
            },
            {
              id: "hb3",
              text: "Track financial waste and spending habits",
              category: "financial",
              order: 3,
            },
            {
              id: "hb4",
              text: "Monitor time-wasting activities",
              category: "time",
              order: 4,
            },
          ],
          timeBlocks: [
            {
              id: "tb1",
              time: "6:00 AM",
              label: "You can change this time block",
              order: 1,
            },
            {
              id: "tb2",
              time: "7:00 AM",
              label: "Edit this to plan your morning",
              order: 2,
            },
            {
              id: "tb3",
              time: "8:00 AM",
              label: "Customize your schedule here",
              order: 3,
            },
            {
              id: "tb4",
              time: "9:00 AM",
              label: "Add your work or focus time",
              order: 4,
            },
            {
              id: "tb5",
              time: "12:00 PM",
              label: "Plan your lunch and breaks",
              order: 5,
            },
            {
              id: "tb6",
              time: "5:00 PM",
              label: "Add your evening activities",
              order: 6,
            },
            {
              id: "tb7",
              time: "8:00 PM",
              label: "Plan your wind-down time",
              order: 7,
            },
          ],
          placeholderText: {
            masterChecklistTitle: "Daily Checklist",
            masterChecklistDescription:
              "You can edit these boxes to track your daily habits and goals",
            habitBreakTitle: "Habit Breaker",
            habitBreakDescription:
              "You can change this box to track habits you want to break",
            todoTitle: "Todo List",
            todoDescription: "You can add and edit your daily tasks here",
            timeBlocksTitle: "Time Blocks",
            timeBlocksDescription:
              "You can customize these time blocks for your daily schedule",
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Admin user template (current personal content as example)
      const adminTemplate: ContentTemplate = {
        userRole: "admin",
        type: "placeholderText",
        content: {
          masterChecklist: [
            {
              id: "m1",
              text: "Get Mind Right! Put 1 on Loop",
              category: "morning",
              order: 1,
            },
            {
              id: "m2",
              text: "Hear/Read/ Write/Speak/ Vision/Feeling",
              category: "morning",
              order: 2,
            },
            { id: "m3", text: "Teeth / Face", category: "morning", order: 3 },
            {
              id: "m4",
              text: "Spa Treatment / Feet / Deodorant / Hair",
              category: "morning",
              order: 4,
            },
            {
              id: "m5",
              text: "Stretch & Build up…EVERYTHING",
              category: "morning",
              order: 5,
            },
            {
              id: "m6",
              text: "Workout [101] [201] [301]",
              category: "morning",
              order: 6,
            },
            { id: "w1", text: "Work Tasks", category: "work", order: 7 },
            {
              id: "t1",
              text: "Programming, Tech Stacks, Tools",
              category: "tech",
              order: 8,
            },
            {
              id: "t2",
              text: "Coding, Build Portfolio/Projects",
              category: "tech",
              order: 9,
            },
            {
              id: "h1",
              text: "Household / Chores / Misc",
              category: "house",
              order: 10,
            },
            { id: "wr1", text: "Plan Next Day", category: "wrapup", order: 11 },
          ],
          habitBreakChecklist: [
            { id: "hb1", text: "LSD energy", category: "lsd", order: 1 },
            { id: "hb2", text: "LNR", category: "lsd", order: 2 },
            {
              id: "hb3",
              text: "financial waste",
              category: "financial",
              order: 3,
            },
            {
              id: "hb4",
              text: "youtube shorts",
              category: "youtube",
              order: 4,
            },
            { id: "hb5", text: "time wasted", category: "time", order: 5 },
          ],
          timeBlocks: [
            { id: "tb1", time: "4:00 AM", label: "Wake & AMP Start", order: 1 },
            {
              id: "tb2",
              time: "5:00 AM",
              label: "Workout & Stretch",
              order: 2,
            },
            { id: "tb3", time: "6:00 AM", label: "Family Morning", order: 3 },
            {
              id: "tb4",
              time: "7:00 AM",
              label: "Open Hour (Focus)",
              order: 4,
            },
            {
              id: "tb5",
              time: "8:00 AM",
              label: "Education (Sales/Programming)",
              order: 5,
            },
            {
              id: "tb6",
              time: "9:00 AM",
              label: "Switch to Work (Sales/FUP)",
              order: 6,
            },
            { id: "tb7", time: "5:00 PM", label: "Tech Work", order: 7 },
            { id: "tb8", time: "8:00 PM", label: "Family / Chores", order: 8 },
            { id: "tb9", time: "9:00 PM", label: "EOD Wrap Up", order: 9 },
          ],
          placeholderText: {
            masterChecklistTitle: "AMP Daily Checklist",
            masterChecklistDescription:
              "Your personalized daily routine and goals",
            habitBreakTitle: "Habit Breaker Tracker",
            habitBreakDescription: "Track and break negative patterns",
            todoTitle: "Daily Tasks",
            todoDescription: "Today's action items and priorities",
            timeBlocksTitle: "AMP Time Blocks",
            timeBlocksDescription: "Your optimized daily schedule",
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert templates
      await contentCollection.deleteMany({}); // Clear existing
      await contentCollection.insertMany([publicTemplate, adminTemplate]);

      return true;
    } catch (error) {
      console.error("Error creating default content templates:", error);
      return false;
    }
  }

  static async updateContentTemplate(
    userRole: UserRole,
    content: ContentTemplate["content"]
  ): Promise<boolean> {
    try {
      const db = await this.getDatabase();
      const contentCollection =
        db.collection<ContentTemplate>("content_templates");

      const result = await contentCollection.updateOne(
        { userRole },
        {
          $set: {
            content,
            updatedAt: new Date(),
          },
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error updating content template:", error);
      return false;
    }
  }
}
