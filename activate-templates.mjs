import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function activateTemplates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    const templateSets = await db.collection("templateSets").find({}).toArray();
    console.log("=== TEMPLATE SETS STATUS ===");
    templateSets.forEach((ts, i) => {
      console.log(
        `${i + 1}. role: ${ts.role}, isActive: ${ts.isActive}, version: ${
          ts.version
        }`
      );
    });

    // Activate templateSets if needed
    const activeCount = await db
      .collection("templateSets")
      .countDocuments({ isActive: true });
    if (activeCount === 0) {
      console.log("\nNo active templateSets found. Activating...");
      await db
        .collection("templateSets")
        .updateMany({}, { $set: { isActive: true } });
      console.log("✅ All templateSets activated");
    } else {
      console.log(`\n✅ ${activeCount} active templateSets found`);
    }

    mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

activateTemplates();
