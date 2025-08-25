#!/usr/bin/env node

import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({ path: ".env.local" });

async function cleanDuplicateFields() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db("AmpTrack");

  console.log("🧹 CLEANING DUPLICATE FIELDS FROM CONTENT_TEMPLATES");

  const templates = await db.collection("content_templates").find({}).toArray();

  for (const template of templates) {
    console.log(`\n🔧 Cleaning ${template.userRole} template...`);

    // Remove the duplicate fields that are outside of content
    const cleanedTemplate = {
      _id: template._id,
      userRole: template.userRole,
      type: template.type,
      content: template.content, // Keep only the content structure
      createdAt: template.createdAt,
      updatedAt: new Date(),
    };

    // Replace the entire document to remove duplicates
    await db
      .collection("content_templates")
      .replaceOne({ _id: template._id }, cleanedTemplate);

    console.log(
      `  ✅ Cleaned ${template.userRole} template - removed duplicate fields`
    );
  }

  // Verify the cleanup
  console.log("\n🔍 VERIFICATION AFTER CLEANUP:");
  const cleanedTemplates = await db
    .collection("content_templates")
    .find({})
    .toArray();

  cleanedTemplates.forEach((template) => {
    console.log(`\n📋 ${template.userRole.toUpperCase()}:`);
    console.log(`  Root keys: ${Object.keys(template).join(", ")}`);
    console.log(`  Content keys: ${Object.keys(template.content).join(", ")}`);
    console.log(
      `  Master items: ${template.content.masterChecklist?.length || 0}`
    );
    console.log(`  Time blocks: ${template.content.timeBlocks?.length || 0}`);
  });

  console.log("\n🎉 CLEANUP COMPLETE!");
  console.log("✅ Templates now have clean structure");
  console.log("📱 Your production site should work now!");

  await client.close();
}

cleanDuplicateFields().catch(console.error);
