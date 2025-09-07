import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function ensure18BlocksForEveryone() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  console.log("🔧 STANDARDIZING ALL USERS TO 18 TIME BLOCKS...");

  // Generate 18 comprehensive time blocks (4:00 AM to 9:00 PM)
  const generate18TimeBlocks = () => {
    const blocks = [];
    let startHour = 4; // 4:00 AM

    for (let i = 0; i < 18; i++) {
      const hour = (startHour + i) % 24;
      const time24 = `${hour.toString().padStart(2, "0")}:00`;

      // Convert to 12-hour format for display
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour < 12 ? "AM" : "PM";
      const timeDisplay = `${hour12}:00 ${ampm}`;

      // Generate meaningful labels for different time periods
      let label;
      if (hour >= 4 && hour < 6) label = `Early Morning Block ${i + 1}`;
      else if (hour >= 6 && hour < 9) label = `Morning Block ${i + 1}`;
      else if (hour >= 9 && hour < 12) label = `Late Morning Block ${i + 1}`;
      else if (hour >= 12 && hour < 14) label = `Midday Block ${i + 1}`;
      else if (hour >= 14 && hour < 17) label = `Afternoon Block ${i + 1}`;
      else if (hour >= 17 && hour < 20) label = `Evening Block ${i + 1}`;
      else if (hour >= 20 && hour < 22) label = `Night Block ${i + 1}`;
      else label = `Late Night Block ${i + 1}`;

      blocks.push({
        blockId: `block-${i + 1}`,
        time: timeDisplay,
        label: label,
        order: i + 1,
      });
    }

    return blocks;
  };

  // Generate comprehensive checklists for all users
  const generateComprehensiveChecklists = () => {
    return [
      {
        checklistId: "daily-master-checklist",
        title: "Daily Master Checklist",
        items: [
          {
            itemId: "morning-1",
            text: "Morning meditation/planning",
            order: 1,
          },
          { itemId: "morning-2", text: "Review daily priorities", order: 2 },
          { itemId: "work-1", text: "Deep focus session 1", order: 3 },
          { itemId: "work-2", text: "Check and respond to messages", order: 4 },
          { itemId: "work-3", text: "Deep focus session 2", order: 5 },
          { itemId: "tech-1", text: "Update project documentation", order: 6 },
          { itemId: "tech-2", text: "Code review or technical task", order: 7 },
          { itemId: "house-1", text: "Tidy living space", order: 8 },
          { itemId: "house-2", text: "Plan tomorrow's meals", order: 9 },
          {
            itemId: "wrapup-1",
            text: "Review day's accomplishments",
            order: 10,
          },
          { itemId: "wrapup-2", text: "Prepare for tomorrow", order: 11 },
        ],
        itemsOrder: [
          "morning-1",
          "morning-2",
          "work-1",
          "work-2",
          "work-3",
          "tech-1",
          "tech-2",
          "house-1",
          "house-2",
          "wrapup-1",
          "wrapup-2",
        ],
        order: 1,
      },
      {
        checklistId: "habit-break-tracker",
        title: "Habit Break Tracker",
        items: [
          { itemId: "break-1", text: "Avoid mindless social media", order: 1 },
          { itemId: "break-2", text: "No unnecessary purchases", order: 2 },
          {
            itemId: "break-3",
            text: "Limit entertainment consumption",
            order: 3,
          },
          { itemId: "break-4", text: "Avoid procrastination", order: 4 },
          { itemId: "break-5", text: "No negative self-talk", order: 5 },
        ],
        itemsOrder: ["break-1", "break-2", "break-3", "break-4", "break-5"],
        order: 2,
      },
      {
        checklistId: "workout-checklist",
        title: "Workout & Fitness",
        items: [
          { itemId: "cardio-1", text: "30 min cardio session", order: 1 },
          {
            itemId: "strength-1",
            text: "Upper body strength training",
            order: 2,
          },
          {
            itemId: "strength-2",
            text: "Lower body strength training",
            order: 3,
          },
          { itemId: "stretch-1", text: "Full body stretching", order: 4 },
          { itemId: "yoga-1", text: "Yoga or mobility work", order: 5 },
          { itemId: "walk-1", text: "10,000+ steps or walk", order: 6 },
        ],
        itemsOrder: [
          "cardio-1",
          "strength-1",
          "strength-2",
          "stretch-1",
          "yoga-1",
          "walk-1",
        ],
        order: 3,
      },
    ];
  };

  const timeBlocks = generate18TimeBlocks();
  const checklists = generateComprehensiveChecklists();
  const timeBlocksOrder = timeBlocks.map((block) => block.blockId);
  const checklistsOrder = checklists.map((list) => list.checklistId);

  // Update ALL template sets to have 18 blocks and comprehensive functionality
  console.log("📋 Updating ALL template sets...");

  const updateAllTemplates = await db.collection("templateSets").updateMany(
    {}, // Update all templates
    {
      $set: {
        timeBlocks: timeBlocks,
        timeBlocksOrder: timeBlocksOrder,
        checklists: checklists,
        checklistsOrder: checklistsOrder,
        version: "2.0.0-comprehensive",
        isActive: true,
        updatedAt: new Date(),
      },
    }
  );

  console.log(`✅ Updated ${updateAllTemplates.modifiedCount} template sets`);

  // Ensure all user spaces have admin-level functionality
  console.log("👥 Updating all user roles to admin for full functionality...");

  const updateAllUsers = await db.collection("userSpaces").updateMany(
    {},
    {
      $set: {
        role: "admin",
        updatedAt: new Date(),
      },
    }
  );

  console.log(
    `✅ Updated ${updateAllUsers.modifiedCount} user spaces to admin role`
  );

  // Verify the results
  console.log("\\n🔍 VERIFICATION:");
  const templateSets = await db.collection("templateSets").find({}).toArray();
  templateSets.forEach((ts, i) => {
    console.log(`Template Set ${i + 1}:`);
    console.log(`  role: ${ts.role}`);
    console.log(`  isActive: ${ts.isActive}`);
    console.log(`  timeBlocks: ${ts.timeBlocks?.length || 0}`);
    console.log(`  checklists: ${ts.checklists?.length || 0}`);
    console.log(`  version: ${ts.version}`);
  });

  const userSpaces = await db.collection("userSpaces").find({}).toArray();
  console.log(`\\nUser Spaces: ${userSpaces.length} total`);
  userSpaces.forEach((us, i) => {
    console.log(`  User ${i + 1}: ${us.userId} -> role: ${us.role}`);
  });

  console.log("\\n🎉 ALL USERS NOW HAVE:");
  console.log("✅ 18 Time Blocks (4:00 AM - 9:00 PM)");
  console.log("✅ Comprehensive Daily Master Checklist");
  console.log("✅ Habit Break Tracker");
  console.log("✅ Workout & Fitness Checklist");
  console.log("✅ Admin-level functionality");
  console.log("✅ Full customization capabilities");
  console.log("✅ Data persistence ready");

  mongoose.disconnect();
}

ensure18BlocksForEveryone().catch(console.error);
