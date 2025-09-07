#!/usr/bin/env node

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

async function fixTemplateSets() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;

    console.log("🔧 Fixing TemplateSet active status...");

    // Make sure there are active template sets for each role
    const publicResult = await db
      .collection("templateSets")
      .updateOne({ role: "public" }, { $set: { isActive: true } });

    const adminResult = await db
      .collection("templateSets")
      .updateOne({ role: "admin" }, { $set: { isActive: true } });

    console.log("✅ Updated public templateSet:", publicResult.modifiedCount);
    console.log("✅ Updated admin templateSet:", adminResult.modifiedCount);

    // Verify
    const templateSets = await db.collection("templateSets").find({}).toArray();
    templateSets.forEach((ts) => {
      console.log(
        `${ts.role} template: isActive=${ts.isActive}, version=${ts.version}`
      );
    });

    console.log("\n🎉 TemplateSet fix completed!");
  } catch (error) {
    console.error("❌ Error fixing templateSets:", error);
  } finally {
    await mongoose.disconnect();
  }
}

fixTemplateSets();
