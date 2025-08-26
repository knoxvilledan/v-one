#!/usr/bin/env node

/**
 * Check User Admin View Mode
 *
 * Checks what adminViewMode is set for your user account
 */

import { config } from "dotenv";
import { MongoClient } from "mongodb";

// Load environment variables
config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkUserAdminMode() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("AmpTrack");

    // Check your user record
    const user = await db.collection("users").findOne({
      email: "knoxvilledan@yahoo.com",
    });

    if (!user) {
      console.log("❌ User not found!");
      return;
    }

    console.log("\n🔍 USER RECORD:");
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Admin View Mode: ${user.adminViewMode || "NOT SET"}`);

    if (!user.adminViewMode) {
      console.log("\n🚨 ISSUE FOUND: adminViewMode is not set!");
      console.log(
        "This means the code defaults to 'admin' but maybe there's an issue with the logic."
      );
    } else {
      console.log(`\n✅ Admin View Mode is set to: ${user.adminViewMode}`);
    }

    // Check what template this would load
    const effectiveRole =
      user.role === "admin" ? user.adminViewMode || "admin" : user.role;
    console.log(`\n📋 Effective role for template loading: ${effectiveRole}`);

    const template = await db.collection("content_templates").findOne({
      userRole: effectiveRole,
    });

    if (template) {
      console.log(`✅ Template found for role '${effectiveRole}'`);
      console.log(
        `   Master checklist items: ${
          template.content?.masterChecklist?.length || 0
        }`
      );
      console.log(
        `   Time blocks: ${template.content?.timeBlocks?.length || 0}`
      );

      if (template.content?.masterChecklist?.length > 0) {
        const first = template.content.masterChecklist[0];
        console.log(`   First master item: "${first.text}" (id: ${first.id})`);
      }
    } else {
      console.log(`❌ No template found for role '${effectiveRole}'`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

checkUserAdminMode().catch(console.error);
