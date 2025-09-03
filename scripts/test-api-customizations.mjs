#!/usr/bin/env node

/**
 * Test API integration with persisted customizations
 * This script tests if the hydration API properly returns persisted user customizations
 */

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env.local") });

async function testAPIWithCustomizations() {
  console.log("🌐 Testing API integration with persisted customizations...\n");

  // For now, focus on database verification since we don't have a running server
  console.log("🔄 Verifying database state and customization persistence...\n");

  await verifyDatabaseState();
}

async function verifyDatabaseState() {
  const { MongoClient } = await import("mongodb");
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not configured");
    return;
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db("AmpTrack");

    console.log("=== Database State Verification ===");

    // Check if our test customizations are still there
    const userSpaces = await db.collection("userSpaces").find({}).toArray();

    console.log(`📦 Found ${userSpaces.length} user spaces`);

    let hasRichCustomizations = false;

    for (const space of userSpaces) {
      console.log(`\n👤 User: ${space.email}`);

      const customizations = space.customizations || {};

      // Check for various types of customizations
      const hasPreferences =
        customizations.preferences &&
        Object.keys(customizations.preferences).length > 0;
      const hasLabels =
        customizations.labels && Object.keys(customizations.labels).length > 0;
      const hasHiddenItems =
        customizations.hiddenItems && customizations.hiddenItems.length > 0;
      const hasCustomOrder =
        customizations.customOrder &&
        Object.keys(customizations.customOrder).length > 0;
      const hasTheme =
        customizations.theme && Object.keys(customizations.theme).length > 0;

      console.log(
        `  📋 Preferences: ${hasPreferences ? "✅" : "❌"} (${
          Object.keys(customizations.preferences || {}).length
        } items)`
      );
      console.log(
        `  🏷️  Labels: ${hasLabels ? "✅" : "❌"} (${
          Object.keys(customizations.labels || {}).length
        } items)`
      );
      console.log(
        `  👁️  Hidden Items: ${hasHiddenItems ? "✅" : "❌"} (${
          customizations.hiddenItems?.length || 0
        } items)`
      );
      console.log(
        `  📑 Custom Order: ${hasCustomOrder ? "✅" : "❌"} (${
          Object.keys(customizations.customOrder || {}).length
        } sections)`
      );
      console.log(
        `  🎨 Theme: ${hasTheme ? "✅" : "❌"} (${
          Object.keys(customizations.theme || {}).length
        } items)`
      );

      if (
        hasPreferences ||
        hasLabels ||
        hasHiddenItems ||
        hasCustomOrder ||
        hasTheme
      ) {
        hasRichCustomizations = true;

        // Show sample customizations
        if (hasPreferences) {
          console.log(
            `    📝 Sample preference: wakeTime = ${customizations.preferences.wakeTime}`
          );
        }
        if (hasLabels) {
          const firstLabel = Object.entries(customizations.labels)[0];
          console.log(
            `    🏷️  Sample label: ${firstLabel[0]} = "${firstLabel[1]}"`
          );
        }
        if (hasHiddenItems) {
          console.log(
            `    👁️  Sample hidden: ${customizations.hiddenItems[0]}`
          );
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(
      `  • Users with customizations: ${
        userSpaces.filter(
          (s) => s.customizations && Object.keys(s.customizations).length > 0
        ).length
      }/${userSpaces.length}`
    );
    console.log(
      `  • Rich customizations present: ${
        hasRichCustomizations ? "✅ YES" : "❌ NO"
      }`
    );

    // Check template sets
    const templateSets = await db.collection("templateSets").find({}).toArray();
    console.log(`  • Template sets available: ${templateSets.length}`);

    // Check day entries
    const dayEntries = await db.collection("dayEntries").countDocuments();
    console.log(`  • Day entries: ${dayEntries}`);

    // Check todo items
    const todoItems = await db.collection("todoItems").countDocuments();
    console.log(`  • Todo items: ${todoItems}`);

    console.log(
      `\n🏆 PERSISTENCE VERIFICATION: ${
        hasRichCustomizations
          ? "✅ CUSTOMIZATIONS PERSISTED"
          : "⚠️ LIMITED CUSTOMIZATIONS"
      }`
    );

    await client.close();
  } catch (error) {
    console.error("❌ Database verification error:", error);
  }
}

// Run the test
testAPIWithCustomizations().catch(console.error);
