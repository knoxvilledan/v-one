#!/usr/bin/env node

const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

// MongoDB connection from environment
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://knoxvilledan:SSSDDDeee222@cluster1.fc7watg.mongodb.net/AmpTracker?retryWrites=true&w=majority&appName=Cluster1";

// Content templates for different user roles
const contentTemplates = [
  {
    userRole: "admin",
    type: "masterChecklist",
    content: {
      masterChecklist: [
        {
          id: "admin-1",
          text: "Review system metrics",
          category: "work",
          order: 1,
        },
        {
          id: "admin-2",
          text: "Check user feedback",
          category: "work",
          order: 2,
        },
        {
          id: "admin-3",
          text: "Update content templates",
          category: "tech",
          order: 3,
        },
        {
          id: "admin-4",
          text: "Monitor server performance",
          category: "tech",
          order: 4,
        },
        {
          id: "admin-5",
          text: "Morning workout",
          category: "morning",
          order: 5,
        },
      ],
      habitBreakChecklist: [
        {
          id: "admin-h1",
          text: "Avoided social media during work",
          category: "work",
          order: 1,
        },
        {
          id: "admin-h2",
          text: "No unnecessary coffee breaks",
          category: "work",
          order: 2,
        },
        {
          id: "admin-h3",
          text: "Stayed focused on priorities",
          category: "work",
          order: 3,
        },
      ],
      timeBlocks: [
        {
          id: "admin-t1",
          time: "4:00 AM",
          label: "Early Morning / Prep",
          order: 1,
        },
        { id: "admin-t2", time: "5:00 AM", label: "Morning Routine", order: 2 },
        { id: "admin-t3", time: "6:00 AM", label: "Workout", order: 3 },
        { id: "admin-t4", time: "7:00 AM", label: "Breakfast", order: 4 },
        {
          id: "admin-t5",
          time: "8:00 AM",
          label: "Deep Work Session",
          order: 5,
        },
        {
          id: "admin-t6",
          time: "9:00 AM - 5:00 PM",
          label: "Admin Tasks",
          order: 6,
        },
        {
          id: "admin-t7",
          time: "5:00 PM",
          label: "Review & Planning",
          order: 7,
        },
        { id: "admin-t8", time: "6:00 PM", label: "Personal Time", order: 8 },
        { id: "admin-t9", time: "8:00 PM", label: "Wind Down", order: 9 },
        { id: "admin-t10", time: "9:00 PM", label: "Rest", order: 10 },
      ],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userRole: "public",
    type: "masterChecklist",
    content: {
      masterChecklist: [
        {
          id: "pub-1",
          text: "You can customize this checklist",
          category: "morning",
          order: 1,
        },
        {
          id: "pub-2",
          text: "Add your daily goals here",
          category: "work",
          order: 2,
        },
        { id: "pub-3", text: "Track your habits", category: "house", order: 3 },
        {
          id: "pub-4",
          text: "Set personal milestones",
          category: "tech",
          order: 4,
        },
        {
          id: "pub-5",
          text: "Create your routine",
          category: "wrapup",
          order: 5,
        },
      ],
      habitBreakChecklist: [
        {
          id: "pub-h1",
          text: "You can change this text",
          category: "entertainment",
          order: 1,
        },
        {
          id: "pub-h2",
          text: "Track habits you want to break",
          category: "entertainment",
          order: 2,
        },
        {
          id: "pub-h3",
          text: "Customize for your needs",
          category: "entertainment",
          order: 3,
        },
      ],
      timeBlocks: [
        {
          id: "pub-t1",
          time: "4:00 AM",
          label: "You can edit this label",
          order: 1,
        },
        {
          id: "pub-t2",
          time: "5:00 AM",
          label: "Customize your schedule",
          order: 2,
        },
        {
          id: "pub-t3",
          time: "6:00 AM",
          label: "Add your activities",
          order: 3,
        },
        { id: "pub-t4", time: "7:00 AM", label: "Set your routine", order: 4 },
        { id: "pub-t5", time: "8:00 AM", label: "Plan your day", order: 5 },
        {
          id: "pub-t6",
          time: "9:00 AM - 5:00 PM",
          label: "Work/Study Time",
          order: 6,
        },
        {
          id: "pub-t7",
          time: "5:00 PM",
          label: "Personal activities",
          order: 7,
        },
        { id: "pub-t8", time: "6:00 PM", label: "Evening routine", order: 8 },
        { id: "pub-t9", time: "8:00 PM", label: "Relaxation time", order: 9 },
        { id: "pub-t10", time: "9:00 PM", label: "Rest & recovery", order: 10 },
      ],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function setupContentTemplates() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔗 Connecting to MongoDB...");
    await client.connect();

    const db = client.db("AmpTracker");
    const contentCollection = db.collection("content_templates");

    console.log("📝 Setting up content templates...");

    // Insert or update each content template
    for (const template of contentTemplates) {
      try {
        const result = await contentCollection.updateOne(
          { userRole: template.userRole, type: template.type },
          {
            $set: template,
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true }
        );

        if (result.upsertedCount > 0) {
          console.log(
            `✅ Created content template: ${template.userRole} - ${template.type}`
          );
        } else {
          console.log(
            `🔄 Updated content template: ${template.userRole} - ${template.type}`
          );
        }
      } catch (error) {
        console.error(
          `❌ Error with template ${template.userRole}-${template.type}:`,
          error.message
        );
      }
    }

    // Display all content templates
    console.log("\n📋 All content templates in database:");
    const allTemplates = await contentCollection.find({}).toArray();
    allTemplates.forEach((template) => {
      const itemCount = template.content?.masterChecklist?.length || 0;
      const habitCount = template.content?.habitBreakChecklist?.length || 0;
      const blockCount = template.content?.timeBlocks?.length || 0;
      console.log(
        `  - ${template.userRole} (${template.type}): ${itemCount} checklist items, ${habitCount} habit items, ${blockCount} time blocks`
      );
    });

    console.log(
      `\n🎉 Content setup complete! Total templates: ${allTemplates.length}`
    );
  } catch (error) {
    console.error("❌ Error setting up content templates:", error);
  } finally {
    await client.close();
    console.log("🔌 MongoDB connection closed");
  }
}

// Run the setup
setupContentTemplates();
