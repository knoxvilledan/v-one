import mongoose from "mongoose";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Load env from .env.local if present, else .env
const envPath = [".env.local", ".env"]
  .map((f) => resolve(process.cwd(), f))
  .find((p) => existsSync(p));
config(envPath ? { path: envPath } : undefined);

async function checkTemplates() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI not set");
    await mongoose.connect(uri);

    const db = mongoose.connection.db;
    const contentTemplates = await db
      .collection("content_templates")
      .find({})
      .toArray();

    console.log(`Found ${contentTemplates.length} content templates`);

    for (const template of contentTemplates) {
      console.log("\n=== TEMPLATE ===");
      console.log("Role:", template.userRole);
      console.log("Type:", template.type);

      if (template.content?.masterChecklist) {
        console.log(
          "\nMaster Checklist Items:",
          template.content.masterChecklist.length
        );
        template.content.masterChecklist.slice(0, 5).forEach((item, i) => {
          console.log(`  ${i + 1}. ${item.text} (category: ${item.category})`);
        });
      }

      if (template.content?.habitBreakChecklist) {
        console.log(
          "\nHabit Break Checklist Items:",
          template.content.habitBreakChecklist.length
        );
        template.content.habitBreakChecklist.slice(0, 3).forEach((item, i) => {
          console.log(`  ${i + 1}. ${item.text} (category: ${item.category})`);
        });
      }

      if (template.content?.workoutChecklist) {
        console.log(
          "\nWorkout Checklist Items:",
          template.content.workoutChecklist.length
        );
        template.content.workoutChecklist.slice(0, 3).forEach((item, i) => {
          console.log(`  ${i + 1}. ${item.text} (category: ${item.category})`);
        });
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkTemplates();
