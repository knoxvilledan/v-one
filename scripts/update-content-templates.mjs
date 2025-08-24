#!/usr/bin/env node

/**
 * Update content templates with enhanced TodoList and WorkoutChecklist formatting
 * - Ensures new users get the improved component structure
 * - Updates default IDs to use new format
 * - Applies P90X categories and enhanced workflow
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is required");
  process.exit(1);
}

// Content Template Schema
const contentTemplateSchema = new mongoose.Schema({
  userRole: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  content: {
    masterChecklist: [
      {
        id: String,
        text: String,
        category: String,
        order: Number,
      },
    ],
    habitBreakChecklist: [
      {
        id: String,
        text: String,
        category: String,
        order: Number,
      },
    ],
    workoutChecklist: [
      {
        id: String,
        text: String,
        category: String,
        order: Number,
      },
    ],
    timeBlocks: [
      {
        id: String,
        time: String,
        label: String,
        order: Number,
      },
    ],
    placeholderText: {
      masterChecklistTitle: String,
      masterChecklistDescription: String,
      habitBreakTitle: String,
      habitBreakDescription: String,
      todoTitle: String,
      todoDescription: String,
      workoutTitle: String,
      workoutDescription: String,
      timeBlocksTitle: String,
      timeBlocksDescription: String,
    },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ContentTemplate = mongoose.model(
  "content_templates",
  contentTemplateSchema,
  "content_templates"
);

/**
 * Generate new-format ID for template items
 */
function generateTemplateId(type, sequence) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${type}-${timestamp}-${random}-${sequence}`;
}

/**
 * Enhanced public template with improved formatting
 */
function createEnhancedPublicTemplate() {
  return {
    userRole: "public",
    type: "placeholderText",
    content: {
      masterChecklist: [
        {
          id: generateTemplateId("mc", 1),
          text: "Test 1",
          category: "morning",
          order: 1,
        },
        {
          id: generateTemplateId("mc", 2),
          text: "Add your daily habits to this checklist",
          category: "morning",
          order: 2,
        },
        {
          id: generateTemplateId("mc", 3),
          text: "Track your work tasks in this section",
          category: "work",
          order: 3,
        },
        {
          id: generateTemplateId("mc", 4),
          text: "Add your learning goals here",
          category: "tech",
          order: 4,
        },
        {
          id: generateTemplateId("mc", 5),
          text: "Keep track of household tasks",
          category: "house",
          order: 5,
        },
        {
          id: generateTemplateId("mc", 6),
          text: "Plan tomorrow and reflect on today",
          category: "wrapup",
          order: 6,
        },
      ],
      habitBreakChecklist: [
        {
          id: generateTemplateId("hb", 1),
          text: "You can break your habits by tracking them here",
          category: "lsd",
          order: 1,
        },
        {
          id: generateTemplateId("hb", 2),
          text: "Click to edit and add your habit to break",
          category: "lsd",
          order: 2,
        },
        {
          id: generateTemplateId("hb", 3),
          text: "Track financial waste and spending habits",
          category: "financial",
          order: 3,
        },
        {
          id: generateTemplateId("hb", 4),
          text: "Monitor time-wasting activities",
          category: "time",
          order: 4,
        },
      ],
      workoutChecklist: [
        {
          id: generateTemplateId("wo", 1),
          text: "Morning walk or jog",
          category: "cardio",
          order: 1,
        },
        {
          id: generateTemplateId("wo", 2),
          text: "Strength training session",
          category: "strength",
          order: 2,
        },
        {
          id: generateTemplateId("wo", 3),
          text: "Daily stretching routine",
          category: "stretching",
          order: 3,
        },
        {
          id: generateTemplateId("wo", 4),
          text: "Yoga or flexibility work",
          category: "yoga",
          order: 4,
        },
        {
          id: generateTemplateId("wo", 5),
          text: "Sports or recreational activity",
          category: "sports",
          order: 5,
        },
        {
          id: generateTemplateId("wo", 6),
          text: "Evening walk for recovery",
          category: "walking",
          order: 6,
        },
      ],
      timeBlocks: [
        {
          id: generateTemplateId("tb", 1),
          time: "6:00 AM",
          label: "You can change this time block",
          order: 1,
        },
        {
          id: generateTemplateId("tb", 2),
          time: "7:00 AM",
          label: "Edit this to plan your morning",
          order: 2,
        },
        {
          id: generateTemplateId("tb", 3),
          time: "8:00 AM",
          label: "Customize your schedule here",
          order: 3,
        },
        {
          id: generateTemplateId("tb", 4),
          time: "9:00 AM",
          label: "Add your work or focus time",
          order: 4,
        },
        {
          id: generateTemplateId("tb", 5),
          time: "12:00 PM",
          label: "Plan your lunch and breaks",
          order: 5,
        },
        {
          id: generateTemplateId("tb", 6),
          time: "5:00 PM",
          label: "Add your evening activities",
          order: 6,
        },
        {
          id: generateTemplateId("tb", 7),
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
        todoDescription:
          "You can add and edit your daily tasks here - drag to move, click to edit",
        workoutTitle: "P90X Workout Tracker",
        workoutDescription:
          "Track your daily P90X workouts and fitness activities with enhanced categories",
        timeBlocksTitle: "Time Blocks",
        timeBlocksDescription:
          "You can customize these time blocks for your daily schedule",
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Enhanced admin template with improved formatting
 */
function createEnhancedAdminTemplate() {
  return {
    userRole: "admin",
    type: "placeholderText",
    content: {
      masterChecklist: [
        {
          id: generateTemplateId("mc", 101),
          text: "Get Mind Right! Put 1 on Loop",
          category: "morning",
          order: 1,
        },
        {
          id: generateTemplateId("mc", 102),
          text: "Hear/Read/ Write/Speak/ Vision/Feeling",
          category: "morning",
          order: 2,
        },
        {
          id: generateTemplateId("mc", 103),
          text: "Teeth / Face",
          category: "morning",
          order: 3,
        },
        {
          id: generateTemplateId("mc", 104),
          text: "Spa Treatment / Feet / Deodorant / Hair",
          category: "morning",
          order: 4,
        },
        {
          id: generateTemplateId("mc", 105),
          text: "Stretch & Build up…EVERYTHING",
          category: "morning",
          order: 5,
        },
        {
          id: generateTemplateId("mc", 106),
          text: "Workout [101] [201] [301]",
          category: "morning",
          order: 6,
        },
        {
          id: generateTemplateId("mc", 107),
          text: "Work Tasks",
          category: "work",
          order: 7,
        },
        {
          id: generateTemplateId("mc", 108),
          text: "Programming, Tech Stacks, Tools",
          category: "tech",
          order: 8,
        },
        {
          id: generateTemplateId("mc", 109),
          text: "Coding, Build Portfolio/Projects",
          category: "tech",
          order: 9,
        },
        {
          id: generateTemplateId("mc", 110),
          text: "Household / Chores / Misc",
          category: "house",
          order: 10,
        },
        {
          id: generateTemplateId("mc", 111),
          text: "Plan Next Day",
          category: "wrapup",
          order: 11,
        },
      ],
      habitBreakChecklist: [
        {
          id: generateTemplateId("hb", 101),
          text: "LSD energy",
          category: "lsd",
          order: 1,
        },
        {
          id: generateTemplateId("hb", 102),
          text: "LNR",
          category: "lsd",
          order: 2,
        },
        {
          id: generateTemplateId("hb", 103),
          text: "financial waste",
          category: "financial",
          order: 3,
        },
        {
          id: generateTemplateId("hb", 104),
          text: "youtube shorts",
          category: "youtube",
          order: 4,
        },
        {
          id: generateTemplateId("hb", 105),
          text: "time wasted",
          category: "time",
          order: 5,
        },
      ],
      workoutChecklist: [
        {
          id: generateTemplateId("wo", 101),
          text: "Morning AMP Workout",
          category: "cardio",
          order: 1,
        },
        {
          id: generateTemplateId("wo", 102),
          text: "Strength Training [101] [201] [301]",
          category: "strength",
          order: 2,
        },
        {
          id: generateTemplateId("wo", 103),
          text: "Stretch & Build up…EVERYTHING",
          category: "stretching",
          order: 3,
        },
        {
          id: generateTemplateId("wo", 104),
          text: "Cardio Session",
          category: "cardio",
          order: 4,
        },
        {
          id: generateTemplateId("wo", 105),
          text: "Evening Wind Down Yoga",
          category: "yoga",
          order: 5,
        },
        {
          id: generateTemplateId("wo", 106),
          text: "Walking Recovery Session",
          category: "walking",
          order: 6,
        },
        {
          id: generateTemplateId("wo", 107),
          text: "Sports Activity",
          category: "sports",
          order: 7,
        },
      ],
      timeBlocks: [
        {
          id: generateTemplateId("tb", 101),
          time: "4:00 AM",
          label: "Wake & AMP Start",
          order: 1,
        },
        {
          id: generateTemplateId("tb", 102),
          time: "5:00 AM",
          label: "Workout & Stretch",
          order: 2,
        },
        {
          id: generateTemplateId("tb", 103),
          time: "6:00 AM",
          label: "Family Morning",
          order: 3,
        },
        {
          id: generateTemplateId("tb", 104),
          time: "7:00 AM",
          label: "Open Hour (Focus)",
          order: 4,
        },
        {
          id: generateTemplateId("tb", 105),
          time: "8:00 AM",
          label: "Education (Sales/Programming)",
          order: 5,
        },
        {
          id: generateTemplateId("tb", 106),
          time: "9:00 AM",
          label: "Switch to Work (Sales/FUP)",
          order: 6,
        },
        {
          id: generateTemplateId("tb", 107),
          time: "5:00 PM",
          label: "Tech Work",
          order: 7,
        },
        {
          id: generateTemplateId("tb", 108),
          time: "8:00 PM",
          label: "Family / Chores",
          order: 8,
        },
        {
          id: generateTemplateId("tb", 109),
          time: "9:00 PM",
          label: "EOD Wrap Up",
          order: 9,
        },
      ],
      placeholderText: {
        masterChecklistTitle: "AMP Daily Checklist",
        masterChecklistDescription:
          "Your personalized daily routine and goals with enhanced formatting",
        habitBreakTitle: "Habit Breaker Tracker",
        habitBreakDescription:
          "Track and break negative patterns with improved workflow",
        todoTitle: "Daily Tasks",
        todoDescription:
          "Today's action items and priorities - enhanced with drag & drop and better formatting",
        workoutTitle: "AMP P90X Workout Tracker",
        workoutDescription:
          "Your personalized P90X fitness routine with enhanced categories and tracking",
        timeBlocksTitle: "AMP Time Blocks",
        timeBlocksDescription:
          "Your optimized daily schedule with improved time tracking",
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function updateContentTemplates() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("📊 Updating content templates with enhanced formatting...");

    // Update public template
    const publicTemplate = createEnhancedPublicTemplate();
    await ContentTemplate.findOneAndUpdate(
      { userRole: "public" },
      { $set: publicTemplate },
      { upsert: true, new: true }
    );

    console.log("✅ Updated public content template");
    console.log(
      `   - Master checklist items: ${publicTemplate.content.masterChecklist.length}`
    );
    console.log(
      `   - Habit break items: ${publicTemplate.content.habitBreakChecklist.length}`
    );
    console.log(
      `   - Workout items: ${publicTemplate.content.workoutChecklist.length}`
    );
    console.log(
      `   - Time blocks: ${publicTemplate.content.timeBlocks.length}`
    );

    // Update admin template
    const adminTemplate = createEnhancedAdminTemplate();
    await ContentTemplate.findOneAndUpdate(
      { userRole: "admin" },
      { $set: adminTemplate },
      { upsert: true, new: true }
    );

    console.log("✅ Updated admin content template");
    console.log(
      `   - Master checklist items: ${adminTemplate.content.masterChecklist.length}`
    );
    console.log(
      `   - Habit break items: ${adminTemplate.content.habitBreakChecklist.length}`
    );
    console.log(
      `   - Workout items: ${adminTemplate.content.workoutChecklist.length}`
    );
    console.log(`   - Time blocks: ${adminTemplate.content.timeBlocks.length}`);

    console.log(`\n📊 Content Template Update Summary:`);
    console.log(`   ✅ Enhanced ID generation patterns applied`);
    console.log(`   ✅ P90X workout categories standardized`);
    console.log(`   ✅ Enhanced component descriptions updated`);
    console.log(`   ✅ Improved formatting structure implemented`);
    console.log(`✅ Content template updates completed successfully!`);
  } catch (error) {
    console.error("❌ Error updating content templates:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the update
console.log("🎨 Starting Content Template Updates...");
console.log(
  "📋 Enhancing TodoList and WorkoutChecklist templates with improved formatting"
);
updateContentTemplates();
