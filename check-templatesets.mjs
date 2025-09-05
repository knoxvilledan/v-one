import mongoose from "mongoose";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Load env from .env.local if present, else .env
const envPath = [".env.local", ".env"]
  .map((f) => resolve(process.cwd(), f))
  .find((p) => existsSync(p));
config(envPath ? { path: envPath } : undefined);

async function checkTemplateSets() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI not set");
    await mongoose.connect(uri);

    const db = mongoose.connection.db;
    const templateSets = await db.collection("templateSets").find({}).toArray();

    console.log(`Found ${templateSets.length} template sets`);

    for (const templateSet of templateSets) {
      console.log("\n=== TEMPLATE SET ===");
      console.log("Role:", templateSet.role);
      console.log("Version:", templateSet.version);
      console.log("Name:", templateSet.name);
      console.log("Active:", templateSet.isActive);

      if (templateSet.checklists) {
        console.log("\nChecklists:", templateSet.checklists.length);
        templateSet.checklists.forEach((checklist, i) => {
          console.log(
            `  ${i + 1}. ${checklist.title} (${
              checklist.items?.length || 0
            } items)`
          );
          if (checklist.items) {
            checklist.items.slice(0, 3).forEach((item, j) => {
              console.log(`     - ${item.text}`);
            });
          }
        });
      }

      if (templateSet.timeBlocks) {
        console.log("\nTime Blocks:", templateSet.timeBlocks.length);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkTemplateSets();
