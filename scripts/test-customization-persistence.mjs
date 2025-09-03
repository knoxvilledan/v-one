#!/usr/bin/env node

/**
 * Test user customization persistence
 * This script tests if user customizations persist properly across sessions
 */

import { MongoClient } from "mongodb";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is not set");
  process.exit(1);
}

async function testCustomizationPersistence() {
  console.log("🧪 Testing user customization persistence...\n");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db("AmpTrack");

    // Get a test user
    const testUser = await db.collection("users").findOne({ role: "public" });
    if (!testUser) {
      console.error("❌ No public user found for testing");
      return;
    }

    console.log(`🧑‍💻 Testing with user: ${testUser.email}\n`);

    // === PHASE 1: Create Custom Settings ===
    console.log("=== PHASE 1: Creating Custom Settings ===");

    const customizations = {
      preferences: {
        wakeTime: "06:30",
        timezone: "America/New_York",
        defaultView: "timeblocks",
        autoSave: true,
      },
      labels: {
        "timeblock-1": "My Morning Routine",
        "timeblock-2": "Deep Work Session",
        "checklist-item-1": "My Custom Task",
      },
      hiddenItems: ["timeblock-5", "checklist-item-3"],
      customOrder: {
        timeBlocks: ["timeblock-1", "timeblock-3", "timeblock-2"],
        masterChecklist: ["item-1", "item-3", "item-2"],
      },
      theme: {
        primaryColor: "#007acc",
        fontSize: "medium",
        compactMode: false,
      },
    };

    // Update user space with customizations
    const updateResult = await db.collection("userSpaces").updateOne(
      { userId: testUser._id.toString() },
      {
        $set: {
          customizations,
          lastActiveAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    console.log(
      `📝 Updated user space: ${updateResult.modifiedCount > 0 ? "✅" : "❌"}`
    );

    // === PHASE 2: Verify Immediate Persistence ===
    console.log("\n=== PHASE 2: Verifying Immediate Persistence ===");

    const savedUserSpace = await db.collection("userSpaces").findOne({
      userId: testUser._id.toString(),
    });

    if (!savedUserSpace) {
      console.error("❌ User space not found after save");
      return;
    }

    console.log("✅ User space found");
    console.log("📋 Saved customizations:");
    console.log(
      `  • Preferences: ${
        Object.keys(savedUserSpace.customizations.preferences || {}).length
      } items`
    );
    console.log(
      `  • Custom Labels: ${
        Object.keys(savedUserSpace.customizations.labels || {}).length
      } items`
    );
    console.log(
      `  • Hidden Items: ${
        savedUserSpace.customizations.hiddenItems?.length || 0
      } items`
    );
    console.log(
      `  • Custom Order: ${
        Object.keys(savedUserSpace.customizations.customOrder || {}).length
      } sections`
    );
    console.log(
      `  • Theme Settings: ${
        Object.keys(savedUserSpace.customizations.theme || {}).length
      } items`
    );

    // Verify specific values
    const prefs = savedUserSpace.customizations.preferences;
    const labels = savedUserSpace.customizations.labels;
    const hidden = savedUserSpace.customizations.hiddenItems;

    console.log("\n🔍 Detailed Verification:");
    console.log(
      `  Wake Time: ${prefs?.wakeTime} ${
        prefs?.wakeTime === "06:30" ? "✅" : "❌"
      }`
    );
    console.log(
      `  Timezone: ${prefs?.timezone} ${
        prefs?.timezone === "America/New_York" ? "✅" : "❌"
      }`
    );
    console.log(
      `  Custom Label: ${labels?.["timeblock-1"]} ${
        labels?.["timeblock-1"] === "My Morning Routine" ? "✅" : "❌"
      }`
    );
    console.log(
      `  Hidden Items Count: ${hidden?.length} ${
        hidden?.length === 2 ? "✅" : "❌"
      }`
    );

    // === PHASE 3: Simulate Session End and Restart ===
    console.log("\n=== PHASE 3: Simulating Session Restart ===");
    console.log(
      "🔄 Disconnecting and reconnecting to simulate session restart..."
    );

    await client.close();
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Brief delay

    const newClient = new MongoClient(MONGODB_URI);
    await newClient.connect();
    const newDb = newClient.db("AmpTrack");

    console.log("✅ Reconnected to database");

    // === PHASE 4: Verify Persistence After Restart ===
    console.log("\n=== PHASE 4: Verifying Persistence After Restart ===");

    const persistedUserSpace = await newDb.collection("userSpaces").findOne({
      userId: testUser._id.toString(),
    });

    if (!persistedUserSpace) {
      console.error(
        "❌ User space not found after restart - PERSISTENCE FAILED"
      );
      return;
    }

    console.log("✅ User space persisted across restart");

    // Deep comparison of customizations
    const persistedCustomizations = persistedUserSpace.customizations;
    let allPersisted = true;

    console.log("\n🔍 Persistence Verification:");

    // Check preferences
    const persistedPrefs = persistedCustomizations.preferences;
    const prefsPersisted =
      persistedPrefs?.wakeTime === "06:30" &&
      persistedPrefs?.timezone === "America/New_York" &&
      persistedPrefs?.defaultView === "timeblocks" &&
      persistedPrefs?.autoSave === true;

    console.log(
      `  Preferences: ${prefsPersisted ? "✅ PERSISTED" : "❌ LOST"}`
    );
    if (!prefsPersisted) allPersisted = false;

    // Check labels
    const persistedLabels = persistedCustomizations.labels;
    const labelsPersisted =
      persistedLabels?.["timeblock-1"] === "My Morning Routine" &&
      persistedLabels?.["timeblock-2"] === "Deep Work Session" &&
      persistedLabels?.["checklist-item-1"] === "My Custom Task";

    console.log(
      `  Custom Labels: ${labelsPersisted ? "✅ PERSISTED" : "❌ LOST"}`
    );
    if (!labelsPersisted) allPersisted = false;

    // Check hidden items
    const persistedHidden = persistedCustomizations.hiddenItems;
    const hiddenPersisted =
      persistedHidden?.length === 2 &&
      persistedHidden.includes("timeblock-5") &&
      persistedHidden.includes("checklist-item-3");

    console.log(
      `  Hidden Items: ${hiddenPersisted ? "✅ PERSISTED" : "❌ LOST"}`
    );
    if (!hiddenPersisted) allPersisted = false;

    // Check custom order
    const persistedOrder = persistedCustomizations.customOrder;
    const orderPersisted =
      persistedOrder?.timeBlocks?.length === 3 &&
      persistedOrder?.masterChecklist?.length === 3;

    console.log(
      `  Custom Order: ${orderPersisted ? "✅ PERSISTED" : "❌ LOST"}`
    );
    if (!orderPersisted) allPersisted = false;

    // Check theme
    const persistedTheme = persistedCustomizations.theme;
    const themePersisted =
      persistedTheme?.primaryColor === "#007acc" &&
      persistedTheme?.fontSize === "medium" &&
      persistedTheme?.compactMode === false;

    console.log(
      `  Theme Settings: ${themePersisted ? "✅ PERSISTED" : "❌ LOST"}`
    );
    if (!themePersisted) allPersisted = false;

    // === PHASE 5: Test Incremental Updates ===
    console.log("\n=== PHASE 5: Testing Incremental Updates ===");

    // Make a small update to existing customizations
    const incrementalUpdate = await newDb.collection("userSpaces").updateOne(
      { userId: testUser._id.toString() },
      {
        $set: {
          "customizations.preferences.wakeTime": "07:00",
          "customizations.labels.timeblock-4": "Afternoon Focus",
          "customizations.theme.fontSize": "large",
          updatedAt: new Date(),
        },
      }
    );

    console.log(
      `📝 Incremental update: ${
        incrementalUpdate.modifiedCount > 0 ? "✅" : "❌"
      }`
    );

    // Verify incremental update preserved other settings
    const finalUserSpace = await newDb.collection("userSpaces").findOne({
      userId: testUser._id.toString(),
    });

    const finalCustomizations = finalUserSpace.customizations;
    const incrementalSuccess =
      finalCustomizations.preferences.wakeTime === "07:00" && // Updated
      finalCustomizations.preferences.timezone === "America/New_York" && // Preserved
      finalCustomizations.labels["timeblock-1"] === "My Morning Routine" && // Preserved
      finalCustomizations.labels["timeblock-4"] === "Afternoon Focus" && // Added
      finalCustomizations.hiddenItems.length === 2 && // Preserved
      finalCustomizations.theme.fontSize === "large" && // Updated
      finalCustomizations.theme.primaryColor === "#007acc"; // Preserved

    console.log(
      `🔄 Incremental Update Test: ${
        incrementalSuccess ? "✅ SUCCESS" : "❌ FAILED"
      }`
    );

    // === FINAL RESULTS ===
    console.log("\n=== FINAL RESULTS ===");
    console.log(`\n📊 Customization Persistence Test Results:`);
    console.log(`  • Initial Save: ✅ SUCCESS`);
    console.log(`  • Session Restart: ✅ SUCCESS`);
    console.log(
      `  • Full Persistence: ${allPersisted ? "✅ SUCCESS" : "❌ FAILED"}`
    );
    console.log(
      `  • Incremental Updates: ${
        incrementalSuccess ? "✅ SUCCESS" : "❌ FAILED"
      }`
    );

    const overallSuccess = allPersisted && incrementalSuccess;
    console.log(
      `\n🏆 OVERALL RESULT: ${
        overallSuccess
          ? "✅ CUSTOMIZATIONS PERSIST PROPERLY"
          : "❌ PERSISTENCE ISSUES DETECTED"
      }`
    );

    if (overallSuccess) {
      console.log(
        "\n🎉 User customizations are fully persistent and reliable!"
      );
      console.log(
        "   Users can safely make changes knowing they will be saved."
      );
    } else {
      console.log(
        "\n⚠️ Some persistence issues detected. Investigation needed."
      );
    }

    await newClient.close();
  } catch (error) {
    console.error("❌ Error testing customization persistence:", error);
    process.exit(1);
  } finally {
    console.log("\n🔌 Test completed");
  }
}

// Run the test
testCustomizationPersistence().catch(console.error);
