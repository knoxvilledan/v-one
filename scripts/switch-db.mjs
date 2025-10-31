#!/usr/bin/env node

/**
 * Simple script to switch between development and production databases
 * Usage: node scripts/switch-db.mjs dev|prod
 */

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const targetEnv = args[0];

if (!targetEnv || !["dev", "prod"].includes(targetEnv)) {
  console.log("❌ Usage: node scripts/switch-db.mjs [dev|prod]");
  console.log("");
  console.log("Examples:");
  console.log(
    "  node scripts/switch-db.mjs dev   # Switch to development database"
  );
  console.log(
    "  node scripts/switch-db.mjs prod  # Switch to production database"
  );
  process.exit(1);
}

const envPath = path.join(process.cwd(), ".env.local");

try {
  // Read current .env.local
  let envContent = fs.readFileSync(envPath, "utf8");

  // Update DATABASE_ENV
  envContent = envContent.replace(
    /DATABASE_ENV=.*/,
    `DATABASE_ENV=${targetEnv}`
  );

  // Update active MONGODB_URI based on target
  const uriPattern = /MONGODB_URI=mongodb\+srv:\/\/.*$/m;

  if (targetEnv === "dev") {
    envContent = envContent.replace(
      uriPattern,
      "MONGODB_URI=mongodb+srv://knoxvilledan2:AAAWWW333mmm@cluster1.fc7watg.mongodb.net/AmpTrack_dev?retryWrites=true&w=majority&appName=Cluster1"
    );
  } else {
    envContent = envContent.replace(
      uriPattern,
      "MONGODB_URI=mongodb+srv://knoxvilledan2:AAAWWW333mmm@cluster1.fc7watg.mongodb.net/AmpTrack?retryWrites=true&w=majority&appName=Cluster1"
    );
  }

  // Write back to file
  fs.writeFileSync(envPath, envContent);

  const dbName = targetEnv === "dev" ? "AmpTrack_dev" : "AmpTrack";
  console.log(`✅ Switched to ${targetEnv.toUpperCase()} database: ${dbName}`);
  console.log("");
  console.log("🔄 Please restart your dev server for changes to take effect:");
  console.log("   Ctrl+C to stop current server, then npm run dev");
} catch (error) {
  console.error("❌ Error updating .env.local:", error.message);
  process.exit(1);
}
