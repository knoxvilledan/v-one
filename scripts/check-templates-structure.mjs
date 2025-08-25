#!/usr/bin/env node

import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({ path: ".env.local" });

async function checkContentTemplates() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db("AmpTrack");

  console.log("🔍 CHECKING YOUR CONTENT_TEMPLATES IN AmpTrack DATABASE");

  const templates = await db.collection("content_templates").find({}).toArray();
  console.log(`\nFound ${templates.length} templates`);

  templates.forEach((template) => {
    console.log(`\n📋 ${template.userRole.toUpperCase()} Template:`);
    console.log(`  _id: ${template._id}`);
    console.log(`  userRole: ${template.userRole}`);
    console.log(`  type: ${template.type}`);
    console.log(`  Root keys: ${Object.keys(template).join(", ")}`);

    if (template.content) {
      console.log(
        `  content keys: ${Object.keys(template.content).join(", ")}`
      );
      console.log(
        `  masterChecklist: ${
          template.content.masterChecklist?.length || 0
        } items`
      );
      console.log(
        `  timeBlocks: ${template.content.timeBlocks?.length || 0} blocks`
      );

      // Show first master item
      if (template.content.masterChecklist?.length > 0) {
        const first = template.content.masterChecklist[0];
        console.log(`  First master: ${first.text} (id: ${first.id})`);
      }

      // Show first time block
      if (template.content.timeBlocks?.length > 0) {
        const first = template.content.timeBlocks[0];
        console.log(
          `  First block: ${first.time} - ${first.label} (id: ${first.id})`
        );
      }
    } else {
      console.log("  ❌ NO CONTENT OBJECT!");
    }

    // Check for old structure (direct on template)
    if (template.masterChecklist && !template.content) {
      console.log(
        `  ⚠️  OLD STRUCTURE: masterChecklist directly on template (${template.masterChecklist.length} items)`
      );
    }
  });

  await client.close();
}

checkContentTemplates().catch(console.error);
