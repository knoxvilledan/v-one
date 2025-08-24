#!/usr/bin/env node

/**
 * Combined script to update both existing user data and content templates
 * with enhanced TodoList and WorkoutChecklist formatting
 */

import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runFormattingUpdates() {
  console.log("🚀 Starting Complete Formatting Update Process...");
  console.log("=".repeat(60));

  try {
    // Step 1: Update existing user data
    console.log("\n📋 Step 1: Updating existing user data formatting...");
    console.log("-".repeat(50));
    execSync(`node ${join(__dirname, "backfill-component-formatting.mjs")}`, {
      stdio: "inherit",
      cwd: __dirname,
    });

    // Step 2: Update content templates
    console.log("\n🎨 Step 2: Updating content templates...");
    console.log("-".repeat(50));
    execSync(`node ${join(__dirname, "update-content-templates.mjs")}`, {
      stdio: "inherit",
      cwd: __dirname,
    });

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Complete Formatting Update Process Finished!");
    console.log("✅ Existing users: Component formatting updated");
    console.log("✅ New users: Enhanced templates ready");
    console.log("🚀 TodoList and WorkoutChecklist enhancements deployed!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Error during formatting update process:", error);
    process.exit(1);
  }
}

runFormattingUpdates();
