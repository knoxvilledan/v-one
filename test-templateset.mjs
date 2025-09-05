import mongoose from "mongoose";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = [".env.local", ".env"]
  .map((f) => resolve(process.cwd(), f))
  .find((p) => existsSync(p));
config(envPath ? { path: envPath } : undefined);

async function testTemplateSetQuery() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);

    // Test direct MongoDB query
    const db = mongoose.connection.db;
    const direct = await db.collection("templateSets").findOne({
      role: "public",
      isActive: true,
    });
    console.log("Direct MongoDB query result:", !!direct);
    if (direct) {
      console.log("Found template set:", {
        role: direct.role,
        version: direct.version,
        isActive: direct.isActive,
        hasTimeBlocks: !!direct.timeBlocks,
        hasChecklists: !!direct.checklists,
      });
    }

    // Test via Mongoose model
    try {
      const TemplateSetSchema = new mongoose.Schema(
        {
          role: { type: String, required: true },
          version: { type: String, required: true },
          isActive: { type: Boolean, default: true },
          timeBlocks: [mongoose.Schema.Types.Mixed],
          checklists: mongoose.Schema.Types.Mixed,
        },
        { collection: "templateSets" }
      );

      const TemplateSet =
        mongoose.models.TemplateSet ||
        mongoose.model("TemplateSet", TemplateSetSchema);

      const viaMongoose = await TemplateSet.findOne({
        role: "public",
        isActive: true,
      }).lean();

      console.log("Via Mongoose query result:", !!viaMongoose);
      if (viaMongoose) {
        console.log("Found via mongoose:", {
          role: viaMongoose.role,
          version: viaMongoose.version,
          isActive: viaMongoose.isActive,
        });
      }
    } catch (mongooseError) {
      console.error("Mongoose query error:", mongooseError.message);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

testTemplateSetQuery();
