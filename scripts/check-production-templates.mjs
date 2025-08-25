#!/usr/bin/env node

/**
 * Check Production Content Templates
 *
 * Verifies that the content templates are properly structured
 * and match what the production API expects
 */

import { MongoClient } from "mongodb";

// Use the PRODUCTION MongoDB URI
const MONGODB_URI =
  "mongodb+srv://knoxvilledan2:AAAWWW333mmm@cluster1.fc7watg.mongodb.net/AmpTrack?retryWrites=true&w=majority&appName=Cluster1";

async function checkProductionTemplates() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to PRODUCTION MongoDB (AmpTrack)");

    const db = client.db("AmpTrack");

    // Check content_templates collection
    console.log("\n🔍 Checking content_templates collection...");
    const templates = await db
      .collection("content_templates")
      .find({})
      .toArray();

    console.log(`📋 Found ${templates.length} templates in production`);

    if (templates.length === 0) {
      console.log("❌ NO TEMPLATES FOUND! This is the problem.");
      console.log("🔧 Production needs template initialization");
      return;
    }

    // Check each template structure
    for (const template of templates) {
      console.log(`\n📋 ${template.userRole.toUpperCase()} Template:`);
      console.log(`  🔧 Type: ${template.type || "MISSING"}`);
      console.log(`  📁 Keys: ${Object.keys(template).join(", ")}`);

      if (template.content) {
        console.log(`  📊 Content structure:`);
        console.log(
          `    - masterChecklist: ${
            template.content.masterChecklist?.length || 0
          } items`
        );
        console.log(
          `    - timeBlocks: ${template.content.timeBlocks?.length || 0} blocks`
        );
        console.log(
          `    - habitBreakChecklist: ${
            template.content.habitBreakChecklist?.length || 0
          } items`
        );
        console.log(
          `    - placeholderText: ${
            template.content.placeholderText ? "PRESENT" : "MISSING"
          }`
        );

        // Check API compatibility
        const isApiCompatible =
          template.type === "placeholderText" &&
          template.content &&
          Array.isArray(template.content.masterChecklist) &&
          Array.isArray(template.content.timeBlocks);

        console.log(
          `  ${isApiCompatible ? "✅" : "❌"} API Compatible: ${
            isApiCompatible ? "YES" : "NO"
          }`
        );

        if (!isApiCompatible) {
          console.log(
            `  🔧 Template needs restructuring for API compatibility`
          );
        }

        // Check time blocks format
        if (template.content.timeBlocks?.length > 0) {
          const sampleBlock = template.content.timeBlocks[0];
          const hasCorrectFormat = sampleBlock.time && sampleBlock.label;
          console.log(
            `  ${hasCorrectFormat ? "✅" : "❌"} Time block format: ${
              hasCorrectFormat ? "CORRECT" : "INCORRECT"
            }`
          );

          if (!hasCorrectFormat) {
            console.log(`    📋 Sample block: ${JSON.stringify(sampleBlock)}`);
          }
        }
      } else {
        console.log(`  ❌ NO CONTENT FOUND - Template is empty!`);
      }
    }

    // Check for old template collections that might interfere
    console.log("\n🧹 Checking for conflicting collections...");
    const collections = await db.listCollections().toArray();
    const templateCollections = collections.filter(
      (c) => c.name.includes("template") || c.name.includes("Template")
    );

    console.log(
      `📁 Template-related collections:`,
      templateCollections.map((c) => c.name)
    );

    console.log("\n🎯 DIAGNOSIS:");
    if (templates.length === 0) {
      console.log("❌ PROBLEM: No templates found in production database");
      console.log("🔧 SOLUTION: Run template initialization for production");
    } else {
      console.log("✅ Templates exist in production database");
      console.log("🔧 Check if templates have correct API structure");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

checkProductionTemplates();
