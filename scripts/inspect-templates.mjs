#!/usr/bin/env node

import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

async function inspectYourTemplates() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db("AmpTrack");

    console.log("🔍 Inspecting your existing content_templates...");
    const templates = await db
      .collection("content_templates")
      .find({})
      .toArray();

    templates.forEach((template, index) => {
      console.log(`\nTemplate ${index + 1}:`);
      console.log("  ID:", template._id);
      console.log("  Name:", template.name || "No name");
      console.log("  Keys:", Object.keys(template));

      if (template.masterChecklist) {
        console.log(
          "  Master checklist:",
          template.masterChecklist.length,
          "items"
        );
        if (template.masterChecklist.length > 0) {
          console.log(
            "    Sample item:",
            JSON.stringify(template.masterChecklist[0], null, 4)
          );
        }
      }

      if (template.timeBlocks) {
        console.log("  Time blocks:", template.timeBlocks.length, "blocks");
        if (template.timeBlocks.length > 0) {
          console.log(
            "    Sample block:",
            JSON.stringify(template.timeBlocks[0], null, 4)
          );
        }
      }

      console.log("  ---");
    });
  } finally {
    await client.close();
  }
}

inspectYourTemplates().catch(console.error);
