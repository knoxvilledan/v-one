import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

// Connect to MongoDB
await mongoose.connect(MONGODB_URI);
console.log("Connected to MongoDB");

// Define schemas
const templateSetSchema = new mongoose.Schema(
  {
    userId: String,
    role: String,
    version: String,
    timeBlocks: Array,
    checklists: Array,
  },
  { collection: "templateSets" }
);

const userSpaceSchema = new mongoose.Schema(
  {
    userId: String,
    role: String,
    version: String,
    dayEntries: Object,
  },
  { collection: "userspaces" }
);

const TemplateSet = mongoose.model("TemplateSet", templateSetSchema);
const UserSpace = mongoose.model("UserSpace", userSpaceSchema);

// Enhanced checklist generation with 25 slots each and proper indexing
function generateEnhancedChecklists() {
  const categories = ["morning", "work", "tech", "house", "wrapup"];

  // Generate 25 Master Checklist items with proper indexing
  const masterChecklistItems = [
    // Core items (11 items)
    {
      id: "morning-1",
      itemId: "morning-1",
      text: "Morning meditation/planning",
      completed: false,
      category: "morning",
      blockId: 1,
      order: 1,
    },
    {
      id: "morning-2",
      itemId: "morning-2",
      text: "Review daily priorities",
      completed: false,
      category: "morning",
      blockId: 2,
      order: 2,
    },
    {
      id: "work-1",
      itemId: "work-1",
      text: "Deep focus session 1",
      completed: false,
      category: "work",
      blockId: 7,
      order: 3,
    },
    {
      id: "work-2",
      itemId: "work-2",
      text: "Check and respond to messages",
      completed: false,
      category: "work",
      blockId: 8,
      order: 4,
    },
    {
      id: "work-3",
      itemId: "work-3",
      text: "Deep focus session 2",
      completed: false,
      category: "work",
      blockId: 10,
      order: 5,
    },
    {
      id: "tech-1",
      itemId: "tech-1",
      text: "Update project documentation",
      completed: false,
      category: "tech",
      blockId: 11,
      order: 6,
    },
    {
      id: "tech-2",
      itemId: "tech-2",
      text: "Code review or technical task",
      completed: false,
      category: "tech",
      blockId: 12,
      order: 7,
    },
    {
      id: "house-1",
      itemId: "house-1",
      text: "Tidy living space",
      completed: false,
      category: "house",
      blockId: 15,
      order: 8,
    },
    {
      id: "house-2",
      itemId: "house-2",
      text: "Plan tomorrow's meals",
      completed: false,
      category: "house",
      blockId: 16,
      order: 9,
    },
    {
      id: "wrapup-1",
      itemId: "wrapup-1",
      text: "Review day's accomplishments",
      completed: false,
      category: "wrapup",
      blockId: 17,
      order: 10,
    },
    {
      id: "wrapup-2",
      itemId: "wrapup-2",
      text: "Prepare for tomorrow",
      completed: false,
      category: "wrapup",
      blockId: 18,
      order: 11,
    },

    // Additional 14 slots for customization
    ...Array.from({ length: 14 }, (_, i) => ({
      id: `custom-${i + 1}`,
      itemId: `custom-${i + 1}`,
      text: `Custom task ${i + 1}`,
      completed: false,
      category: categories[i % categories.length],
      blockId: (i % 18) + 1,
      isCustomizable: true,
      order: i + 12,
    })),
  ];

  // Generate 25 Todo items with proper indexing
  const todoItems = [
    // Core items (10 items)
    {
      id: "todo-1",
      itemId: "todo-1",
      text: "Complete project milestone",
      completed: false,
      category: "work",
      priority: "high",
      blockId: 7,
      order: 1,
    },
    {
      id: "todo-2",
      itemId: "todo-2",
      text: "Schedule team meeting",
      completed: false,
      category: "work",
      priority: "medium",
      blockId: 8,
      order: 2,
    },
    {
      id: "todo-3",
      itemId: "todo-3",
      text: "Review quarterly goals",
      completed: false,
      category: "work",
      priority: "low",
      blockId: 9,
      order: 3,
    },
    {
      id: "todo-4",
      itemId: "todo-4",
      text: "Grocery shopping",
      completed: false,
      category: "house",
      priority: "medium",
      blockId: 14,
      order: 4,
    },
    {
      id: "todo-5",
      itemId: "todo-5",
      text: "Pay monthly bills",
      completed: false,
      category: "house",
      priority: "high",
      blockId: 15,
      order: 5,
    },
    {
      id: "todo-6",
      itemId: "todo-6",
      text: "Book medical appointment",
      completed: false,
      category: "house",
      priority: "medium",
      blockId: 16,
      order: 6,
    },
    {
      id: "todo-7",
      itemId: "todo-7",
      text: "Update resume",
      completed: false,
      category: "tech",
      priority: "low",
      blockId: 11,
      order: 7,
    },
    {
      id: "todo-8",
      itemId: "todo-8",
      text: "Research new tools",
      completed: false,
      category: "tech",
      priority: "low",
      blockId: 12,
      order: 8,
    },
    {
      id: "todo-9",
      itemId: "todo-9",
      text: "Plan weekend activities",
      completed: false,
      category: "wrapup",
      priority: "low",
      blockId: 17,
      order: 9,
    },
    {
      id: "todo-10",
      itemId: "todo-10",
      text: "Call family members",
      completed: false,
      category: "wrapup",
      priority: "medium",
      blockId: 18,
      order: 10,
    },

    // Additional 15 slots for customization
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `todo-custom-${i + 1}`,
      itemId: `todo-custom-${i + 1}`,
      text: `Custom todo ${i + 1}`,
      completed: false,
      category: categories[i % categories.length],
      priority: ["low", "medium", "high"][i % 3],
      blockId: (i % 18) + 1,
      isCustomizable: true,
      order: i + 11,
    })),
  ];

  // Generate 25 Habit Break items with proper indexing
  const habitBreakItems = [
    // Core items (8 items)
    {
      id: "habit-1",
      itemId: "habit-1",
      text: "No social media scrolling",
      completed: false,
      category: "morning",
      blockId: 3,
      order: 1,
    },
    {
      id: "habit-2",
      itemId: "habit-2",
      text: "No excessive coffee",
      completed: false,
      category: "morning",
      blockId: 4,
      order: 2,
    },
    {
      id: "habit-3",
      itemId: "habit-3",
      text: "No procrastination on key tasks",
      completed: false,
      category: "work",
      blockId: 9,
      order: 3,
    },
    {
      id: "habit-4",
      itemId: "habit-4",
      text: "No checking phone during focused work",
      completed: false,
      category: "work",
      blockId: 10,
      order: 4,
    },
    {
      id: "habit-5",
      itemId: "habit-5",
      text: "No junk food snacking",
      completed: false,
      category: "house",
      blockId: 13,
      order: 5,
    },
    {
      id: "habit-6",
      itemId: "habit-6",
      text: "No late-night screen time",
      completed: false,
      category: "wrapup",
      blockId: 17,
      order: 6,
    },
    {
      id: "habit-7",
      itemId: "habit-7",
      text: "No skipping meals",
      completed: false,
      category: "house",
      blockId: 14,
      order: 7,
    },
    {
      id: "habit-8",
      itemId: "habit-8",
      text: "No negative self-talk",
      completed: false,
      category: "wrapup",
      blockId: 18,
      order: 8,
    },

    // Additional 17 slots for customization
    ...Array.from({ length: 17 }, (_, i) => ({
      id: `habit-custom-${i + 1}`,
      itemId: `habit-custom-${i + 1}`,
      text: `Custom habit break ${i + 1}`,
      completed: false,
      category: categories[i % categories.length],
      blockId: (i % 18) + 1,
      isCustomizable: true,
      order: i + 9,
    })),
  ];

  // Generate 25 Workout items with proper indexing
  const workoutItems = [
    // Core items (12 items)
    {
      id: "workout-1",
      itemId: "workout-1",
      text: "10 min morning stretching",
      completed: false,
      category: "morning",
      blockId: 5,
      order: 1,
    },
    {
      id: "workout-2",
      itemId: "workout-2",
      text: "20 push-ups",
      completed: false,
      category: "morning",
      blockId: 6,
      order: 2,
    },
    {
      id: "workout-3",
      itemId: "workout-3",
      text: "5 min desk stretches",
      completed: false,
      category: "work",
      blockId: 9,
      order: 3,
    },
    {
      id: "workout-4",
      itemId: "workout-4",
      text: "30 min cardio session",
      completed: false,
      category: "work",
      blockId: 13,
      order: 4,
    },
    {
      id: "workout-5",
      itemId: "workout-5",
      text: "15 min core workout",
      completed: false,
      category: "tech",
      blockId: 11,
      order: 5,
    },
    {
      id: "workout-6",
      itemId: "workout-6",
      text: "10 min yoga flow",
      completed: false,
      category: "tech",
      blockId: 12,
      order: 6,
    },
    {
      id: "workout-7",
      itemId: "workout-7",
      text: "Walk 10,000 steps",
      completed: false,
      category: "house",
      blockId: 14,
      order: 7,
    },
    {
      id: "workout-8",
      itemId: "workout-8",
      text: "20 squats",
      completed: false,
      category: "house",
      blockId: 15,
      order: 8,
    },
    {
      id: "workout-9",
      itemId: "workout-9",
      text: "5 min breathing exercise",
      completed: false,
      category: "house",
      blockId: 16,
      order: 9,
    },
    {
      id: "workout-10",
      itemId: "workout-10",
      text: "15 min evening walk",
      completed: false,
      category: "wrapup",
      blockId: 17,
      order: 10,
    },
    {
      id: "workout-11",
      itemId: "workout-11",
      text: "10 min meditation",
      completed: false,
      category: "wrapup",
      blockId: 18,
      order: 11,
    },
    {
      id: "workout-12",
      itemId: "workout-12",
      text: "Drink 8 glasses of water",
      completed: false,
      category: "morning",
      blockId: 1,
      order: 12,
    },

    // Additional 13 slots for customization
    ...Array.from({ length: 13 }, (_, i) => ({
      id: `workout-custom-${i + 1}`,
      itemId: `workout-custom-${i + 1}`,
      text: `Custom workout ${i + 1}`,
      completed: false,
      category: categories[i % categories.length],
      blockId: (i % 18) + 1,
      isCustomizable: true,
      order: i + 13,
    })),
  ];

  return [
    {
      checklistId: "master-checklist",
      name: "Master Checklist",
      items: masterChecklistItems,
      itemsOrder: masterChecklistItems.map((item) => item.itemId),
      order: 1,
    },
    {
      checklistId: "todo-list",
      name: "Todo List",
      items: todoItems,
      itemsOrder: todoItems.map((item) => item.itemId),
      order: 2,
    },
    {
      checklistId: "habit-break-checklist",
      name: "Habit Break Checklist",
      items: habitBreakItems,
      itemsOrder: habitBreakItems.map((item) => item.itemId),
      order: 3,
    },
    {
      checklistId: "workout-checklist",
      name: "Workout Checklist",
      items: workoutItems,
      itemsOrder: workoutItems.map((item) => item.itemId),
      order: 4,
    },
  ];
}

// Generate 18 time blocks (4:00 AM to 9:00 PM)
function generateTimeBlocks() {
  const timeBlocks = [];
  for (let hour = 4; hour <= 21; hour++) {
    const blockId = hour - 3; // Start from 1
    const time24 = `${hour.toString().padStart(2, "0")}:00`;
    const hour12 = hour === 12 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour < 12 ? "AM" : "PM";
    const time12 = `${hour12}:00 ${period}`;

    let label = "";
    if (hour >= 4 && hour <= 6) label = `Early Morning Block ${blockId}`;
    else if (hour >= 7 && hour <= 9) label = `Morning Block ${blockId}`;
    else if (hour >= 10 && hour <= 12) label = `Late Morning Block ${blockId}`;
    else if (hour >= 13 && hour <= 15) label = `Afternoon Block ${blockId}`;
    else if (hour >= 16 && hour <= 18) label = `Evening Block ${blockId}`;
    else label = `Night Block ${blockId}`;

    timeBlocks.push({
      blockId: blockId,
      id: `block-${blockId}`,
      time: time12,
      time24: time24,
      label: label,
      notes: [],
      complete: false,
      duration: 60,
      order: blockId,
    });
  }
  return timeBlocks;
}

async function updateTemplatesAndUsers() {
  try {
    const checklists = generateEnhancedChecklists();
    const timeBlocks = generateTimeBlocks();

    // Update all template sets to have 25 slots per checklist
    const templateSets = await TemplateSet.find({});
    console.log(`Found ${templateSets.length} template sets to update`);

    for (const templateSet of templateSets) {
      templateSet.version = "2.1.0-enhanced-25-slots";
      templateSet.timeBlocks = timeBlocks;
      templateSet.timeBlocksOrder = timeBlocks.map((block) => block.blockId);
      templateSet.checklists = checklists;
      templateSet.checklistsOrder = checklists.map(
        (checklist) => checklist.checklistId
      );
      await templateSet.save();
      console.log(
        `Updated template set for ${templateSet.role} role with 25 slots per checklist`
      );
    }

    // Update all user spaces to admin role for consistent experience
    const userSpaces = await UserSpace.find({});
    console.log(`Found ${userSpaces.length} user spaces to update`);

    for (const userSpace of userSpaces) {
      userSpace.role = "admin";
      userSpace.version = "2.1.0-enhanced-25-slots";
      await userSpace.save();
      console.log(`Updated user space for ${userSpace.userId} to admin role`);
    }

    console.log(
      "\n✅ Successfully updated all templates and users with 25-slot checklists!"
    );
    console.log(
      "📋 Each checklist now has 25 items with proper indexID and blockID alignment"
    );
    console.log("🔢 Time blocks: 18 blocks (4:00 AM - 9:00 PM)");
    console.log(
      "📝 Checklists: 4 types × 25 items each = 100 total customizable slots"
    );
  } catch (error) {
    console.error("Error updating templates:", error);
  }
}

// Run the update
await updateTemplatesAndUsers();

// Verify the update
console.log("\n🔍 Verifying updates...");
const verifyTemplates = await TemplateSet.find({});
for (const template of verifyTemplates) {
  console.log(`Template Set ${template.role}:`);
  console.log(`  - Time Blocks: ${template.timeBlocks.length}`);
  console.log(`  - Checklists: ${template.checklists.length}`);
  template.checklists.forEach((checklist) => {
    console.log(`    * ${checklist.name}: ${checklist.items.length} items`);
  });
  console.log(`  - Version: ${template.version}`);
}

await mongoose.disconnect();
console.log("\n✅ Database updated successfully with 25-slot system!");
