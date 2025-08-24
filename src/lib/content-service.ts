import dbConnect from "./dbConnect";
import type {
  User,
  UserRole,
  ContentTemplate as ContentTemplateType,
} from "../types/content";
import { ContentTemplate as ContentTemplateModel } from "../models/ContentTemplate";

export class ContentService {
  private static async ensureDb() {
    await dbConnect();
  }

  // User Management
  static async createUser(
    email: string,
    name?: string,
    role: UserRole = "public"
  ): Promise<User> {
    try {
      await this.ensureDb();
      const usersCollection = (
        await import("mongoose")
      ).default.connection.db!.collection<User>("users");

      const user: User = {
        email,
        name,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      await usersCollection.updateOne(
        { email },
        { $setOnInsert: user },
        { upsert: true }
      );
      const doc = await usersCollection.findOne({ email });
      return doc as unknown as User;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      await this.ensureDb();
      const usersCollection = (
        await import("mongoose")
      ).default.connection.db!.collection<User>("users");
      return await usersCollection.findOne({ email, isActive: true });
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  }

  static async updateUserRole(email: string, role: UserRole): Promise<boolean> {
    try {
      await this.ensureDb();
      const usersCollection = (
        await import("mongoose")
      ).default.connection.db!.collection<User>("users");

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
  ): Promise<ContentTemplateType | null> {
    try {
      await this.ensureDb();
      return await ContentTemplateModel.findOne({
        userRole,
      }).lean<ContentTemplateType | null>();
    } catch (error) {
      console.error("Error getting content template:", error);
      return null;
    }
  }

  static async createDefaultContentTemplates(): Promise<boolean> {
    try {
      await this.ensureDb();

      // Public user template (generic placeholders)
      const publicTemplate: ContentTemplateType = {
        userRole: "public",
        type: "placeholderText",
        content: {
          masterChecklist: [
            {
              id: "mc-morning-001",
              text: "Test 1",
              category: "morning",
              order: 1,
            },
            {
              id: "mc-morning-002",
              text: "Add your daily habits to this checklist",
              category: "morning",
              order: 2,
            },
            {
              id: "mc-work-001",
              text: "Track your work tasks in this section",
              category: "work",
              order: 3,
            },
            {
              id: "mc-tech-001",
              text: "Add your learning goals here",
              category: "tech",
              order: 4,
            },
            {
              id: "mc-house-001",
              text: "Keep track of household tasks",
              category: "house",
              order: 5,
            },
            {
              id: "mc-wrapup-001",
              text: "Plan tomorrow and reflect on today",
              category: "wrapup",
              order: 6,
            },
          ],
          habitBreakChecklist: [
            {
              id: "hb-lsd-001",
              text: "You can break your habits by tracking them here",
              category: "lsd",
              order: 1,
            },
            {
              id: "hb-lsd-002",
              text: "Click to edit and add your habit to break",
              category: "lsd",
              order: 2,
            },
            {
              id: "hb-financial-001",
              text: "Track financial waste and spending habits",
              category: "financial",
              order: 3,
            },
            {
              id: "hb-time-001",
              text: "Monitor time-wasting activities",
              category: "time",
              order: 4,
            },
          ],
          workoutChecklist: [
            {
              id: "wo-cardio-001",
              text: "Morning walk or jog",
              category: "cardio",
              order: 1,
            },
            {
              id: "wo-strength-001",
              text: "Strength training session",
              category: "strength",
              order: 2,
            },
            {
              id: "wo-stretching-001",
              text: "Daily stretching routine",
              category: "stretching",
              order: 3,
            },
            {
              id: "wo-cardio-002",
              text: "Add your cardio workout here",
              category: "cardio",
              order: 4,
            },
          ],
          timeBlocks: [
            {
              id: "tb-04h-001",
              time: "6:00 AM",
              label: "You can change this time block",
              order: 1,
            },
            {
              id: "tb-05h-001",
              time: "7:00 AM",
              label: "Edit this to plan your morning",
              order: 2,
            },
            {
              id: "tb-06h-001",
              time: "8:00 AM",
              label: "Customize your schedule here",
              order: 3,
            },
            {
              id: "tb-07h-001",
              time: "9:00 AM",
              label: "Add your work or focus time",
              order: 4,
            },
            {
              id: "tb-12h-001",
              time: "12:00 PM",
              label: "Plan your lunch and breaks",
              order: 5,
            },
            {
              id: "tb-17h-001",
              time: "5:00 PM",
              label: "Add your evening activities",
              order: 6,
            },
            {
              id: "tb-20h-001",
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
            workoutTitle: "P90X Workout Tracker",
            workoutDescription: "Track your daily P90X workouts and fitness activities",
            timeBlocksTitle: "Time Blocks",
            timeBlocksDescription:
              "You can customize these time blocks for your daily schedule",
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Admin user template (current personal content as example)
      const adminTemplate: ContentTemplateType = {
        userRole: "admin",
        type: "placeholderText",
        content: {
          masterChecklist: [
            {
              id: "mc-morning-101",
              text: "Get Mind Right! Put 1 on Loop",
              category: "morning",
              order: 1,
            },
            {
              id: "mc-morning-102",
              text: "Hear/Read/ Write/Speak/ Vision/Feeling",
              category: "morning",
              order: 2,
            },
            {
              id: "mc-morning-103",
              text: "Teeth / Face",
              category: "morning",
              order: 3,
            },
            {
              id: "mc-morning-104",
              text: "Spa Treatment / Feet / Deodorant / Hair",
              category: "morning",
              order: 4,
            },
            {
              id: "mc-morning-105",
              text: "Stretch & Build up…EVERYTHING",
              category: "morning",
              order: 5,
            },
            {
              id: "mc-morning-106",
              text: "Workout [101] [201] [301]",
              category: "morning",
              order: 6,
            },
            {
              id: "mc-work-101",
              text: "Work Tasks",
              category: "work",
              order: 7,
            },
            {
              id: "mc-tech-101",
              text: "Programming, Tech Stacks, Tools",
              category: "tech",
              order: 8,
            },
            {
              id: "mc-tech-102",
              text: "Coding, Build Portfolio/Projects",
              category: "tech",
              order: 9,
            },
            {
              id: "mc-house-101",
              text: "Household / Chores / Misc",
              category: "house",
              order: 10,
            },
            {
              id: "mc-wrapup-101",
              text: "Plan Next Day",
              category: "wrapup",
              order: 11,
            },
          ],
          habitBreakChecklist: [
            {
              id: "hb-lsd-101",
              text: "LSD energy",
              category: "lsd",
              order: 1,
            },
            {
              id: "hb-lsd-102",
              text: "LNR",
              category: "lsd",
              order: 2,
            },
            {
              id: "hb-financial-101",
              text: "financial waste",
              category: "financial",
              order: 3,
            },
            {
              id: "hb-youtube-101",
              text: "youtube shorts",
              category: "youtube",
              order: 4,
            },
            {
              id: "hb-time-101",
              text: "time wasted",
              category: "time",
              order: 5,
            },
          ],
          workoutChecklist: [
            {
              id: "wo-cardio-101",
              text: "Morning AMP Workout",
              category: "cardio",
              order: 1,
            },
            {
              id: "wo-strength-101",
              text: "Strength Training [101] [201] [301]",
              category: "strength",
              order: 2,
            },
            {
              id: "wo-stretching-101",
              text: "Stretch & Build up…EVERYTHING",
              category: "stretching",
              order: 3,
            },
            {
              id: "wo-cardio-102",
              text: "Cardio Session",
              category: "cardio",
              order: 4,
            },
            {
              id: "wo-yoga-101",
              text: "Evening Wind Down Yoga",
              category: "yoga",
              order: 5,
            },
          ],
          timeBlocks: [
            {
              id: "tb-04h-101",
              time: "4:00 AM",
              label: "Wake & AMP Start",
              order: 1,
            },
            {
              id: "tb-05h-101",
              time: "5:00 AM",
              label: "Workout & Stretch",
              order: 2,
            },
            {
              id: "tb-06h-101",
              time: "6:00 AM",
              label: "Family Morning",
              order: 3,
            },
            {
              id: "tb-07h-101",
              time: "7:00 AM",
              label: "Open Hour (Focus)",
              order: 4,
            },
            {
              id: "tb-08h-101",
              time: "8:00 AM",
              label: "Education (Sales/Programming)",
              order: 5,
            },
            {
              id: "tb-09h-101",
              time: "9:00 AM",
              label: "Switch to Work (Sales/FUP)",
              order: 6,
            },
            {
              id: "tb-17h-101",
              time: "5:00 PM",
              label: "Tech Work",
              order: 7,
            },
            {
              id: "tb-20h-101",
              time: "8:00 PM",
              label: "Family / Chores",
              order: 8,
            },
            {
              id: "tb-21h-101",
              time: "9:00 PM",
              label: "EOD Wrap Up",
              order: 9,
            },
          ],
          placeholderText: {
            masterChecklistTitle: "AMP Daily Checklist",
            masterChecklistDescription:
              "Your personalized daily routine and goals",
            habitBreakTitle: "Habit Breaker Tracker",
            habitBreakDescription: "Track and break negative patterns",
            todoTitle: "Daily Tasks",
            todoDescription: "Today's action items and priorities",
            workoutTitle: "AMP P90X Workout Tracker",
            workoutDescription: "Your personalized P90X fitness routine and tracking",
            timeBlocksTitle: "AMP Time Blocks",
            timeBlocksDescription: "Your optimized daily schedule",
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert templates (idempotent upsert)
      await ContentTemplateModel.findOneAndUpdate(
        { userRole: "public" },
        { $set: publicTemplate },
        { upsert: true }
      );
      await ContentTemplateModel.findOneAndUpdate(
        { userRole: "admin" },
        { $set: adminTemplate },
        { upsert: true }
      );

      return true;
    } catch (error) {
      console.error("Error creating default content templates:", error);
      return false;
    }
  }

  static async updateContentTemplate(
    userRole: UserRole,
    content: ContentTemplateType["content"]
  ): Promise<boolean> {
    try {
      await this.ensureDb();
      const res = await ContentTemplateModel.updateOne(
        { userRole },
        { $set: { content, updatedAt: new Date() } }
      );
      return res.modifiedCount > 0 || res.upsertedId != null;
    } catch (error) {
      console.error("Error updating content template:", error);
      return false;
    }
  }
}
