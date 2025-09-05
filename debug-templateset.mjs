import { connectDB } from "./src/lib/database.js";
import { TemplateSet } from "./src/models/TemplateSet.js";

async function testHydration() {
  try {
    console.log("Connecting to database...");
    await connectDB();
    console.log("Database connected successfully");

    console.log("Testing TemplateSet model...");

    const templateSet = await TemplateSet.findOne({
      role: "public",
      isActive: true,
    });

    console.log("TemplateSet query result:", !!templateSet);
    if (templateSet) {
      console.log("Found active public template set:", {
        role: templateSet.role,
        version: templateSet.version,
        isActive: templateSet.isActive,
        hasTimeBlocks: !!templateSet.timeBlocks,
        hasChecklists: !!templateSet.checklists,
        createdAt: templateSet.createdAt,
      });
    } else {
      console.log("No active public template set found");

      // Check what template sets exist
      console.log("\nChecking all template sets in database:");
      const allSets = await TemplateSet.find({});
      console.log(`Found ${allSets.length} template sets total`);

      allSets.forEach((ts, index) => {
        console.log(
          `  ${index + 1}. Role: ${ts.role}, Active: ${ts.isActive}, Version: ${
            ts.version
          }, Created: ${ts.createdAt}`
        );
      });

      // Check for any public templates
      const publicSets = await TemplateSet.find({ role: "public" });
      console.log(`\nFound ${publicSets.length} public template sets`);

      // Check for any active templates
      const activeSets = await TemplateSet.find({ isActive: true });
      console.log(`Found ${activeSets.length} active template sets`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error testing TemplateSet:", error);
    process.exit(1);
  }
}

testHydration();
