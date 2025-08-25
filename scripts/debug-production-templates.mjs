#!/usr/bin/env node

/**
 * DEBUG: Check Production Template Issues
 *
 * Checks exactly what templates exist and their structure
 */

import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

async function debugProductionTemplates() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("AmpTrack");

    // Check exact structure
    console.log(
      "\n🔍 CHECKING TEMPLATE STRUCTURE FOR PRODUCTION COMPATIBILITY..."
    );

    const templates = await db
      .collection("content_templates")
      .find({})
      .toArray();

    console.log(`\n📋 Found ${templates.length} templates`);

    for (const template of templates) {
      console.log(`\n🏷️  ${template.userRole.toUpperCase()} Template:`);
      console.log(`   _id: ${template._id}`);
      console.log(`   userRole: ${template.userRole}`);
      console.log(`   type: ${template.type}`);
      console.log(`   Root keys: ${Object.keys(template).join(", ")}`);

      if (template.content) {
        console.log(
          `   content keys: ${Object.keys(template.content).join(", ")}`
        );
        console.log(
          `   masterChecklist: ${
            template.content.masterChecklist?.length || 0
          } items`
        );
        console.log(
          `   timeBlocks: ${template.content.timeBlocks?.length || 0} blocks`
        );
        console.log(
          `   habitBreakChecklist: ${
            template.content.habitBreakChecklist?.length || 0
          } items`
        );
        console.log(
          `   workoutChecklist: ${
            template.content.workoutChecklist?.length || 0
          } items`
        );

        // Check first items structure
        if (template.content.masterChecklist?.length > 0) {
          const first = template.content.masterChecklist[0];
          console.log(`   📋 First master item: ${JSON.stringify(first)}`);
        }

        if (template.content.timeBlocks?.length > 0) {
          const first = template.content.timeBlocks[0];
          console.log(`   🕐 First time block: ${JSON.stringify(first)}`);
        }
      } else {
        console.log(`   ❌ NO CONTENT OBJECT FOUND!`);
      }
    }

    // Check if there are any other template collections
    console.log("\n🔍 CHECKING FOR OTHER TEMPLATE COLLECTIONS...");
    const collections = await db.listCollections().toArray();
    const templateCollections = collections.filter(
      (c) => c.name.includes("template") || c.name.includes("Template")
    );

    console.log("Template-related collections:");
    templateCollections.forEach((c) => {
      console.log(`   - ${c.name}`);
    });

    console.log("\n🔍 CHECKING CONTENT TEMPLATE MODEL COMPATIBILITY...");

    // Check if templates match the expected Mongoose model structure
    for (const template of templates) {
      console.log(`\n${template.userRole} template compatibility:`);

      const hasUserRole = !!template.userRole;
      const hasType = !!template.type;
      const hasContent = !!template.content;
      const hasNestedArrays =
        template.content &&
        Array.isArray(template.content.masterChecklist) &&
        Array.isArray(template.content.timeBlocks);

      console.log(`   ✅ userRole: ${hasUserRole}`);
      console.log(`   ✅ type: ${hasType}`);
      console.log(`   ✅ content: ${hasContent}`);
      console.log(`   ✅ nested arrays: ${hasNestedArrays}`);

      const isCompatible =
        hasUserRole && hasType && hasContent && hasNestedArrays;
      console.log(
        `   ${
          isCompatible ? "✅" : "❌"
        } MONGOOSE MODEL COMPATIBLE: ${isCompatible}`
      );
    }

    await client.close();
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

debugProductionTemplates();
