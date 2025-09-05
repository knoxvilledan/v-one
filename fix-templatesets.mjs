import mongoose from "mongoose";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = [".env.local", ".env"]
  .map((f) => resolve(process.cwd(), f))
  .find((p) => existsSync(p));
config(envPath ? { path: envPath } : undefined);

async function fixTemplateSets() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    console.log("=== CHECKING TEMPLATE SETS ===");
    const templateSets = await db.collection("templateSets").find({}).toArray();
    console.log(`Found ${templateSets.length} template sets`);

    for (const ts of templateSets) {
      console.log(
        `Role: ${ts.role}, Version: ${ts.version}, IsActive: ${ts.isActive}`
      );

      // If not active, make it active
      if (!ts.isActive) {
        console.log(`Activating template set for role: ${ts.role}`);
        await db
          .collection("templateSets")
          .updateOne({ _id: ts._id }, { $set: { isActive: true } });
        console.log(`✅ Activated template set for role: ${ts.role}`);
      }
    }

    console.log("\n=== CHECKING USERS ===");
    const users = await db.collection("users").find({}).toArray();
    for (const user of users) {
      console.log(`User: ${user.email}, Role: ${user.role}`);

      // If user role is undefined, set it to public
      if (!user.role) {
        console.log(`Setting role to 'public' for user: ${user.email}`);
        await db
          .collection("users")
          .updateOne({ _id: user._id }, { $set: { role: "public" } });
        console.log(`✅ Set role to 'public' for user: ${user.email}`);
      }
    }

    console.log("\n=== FINAL STATE ===");
    const finalTemplateSets = await db
      .collection("templateSets")
      .find({})
      .toArray();
    const finalUsers = await db.collection("users").find({}).toArray();

    console.log("Template Sets:");
    finalTemplateSets.forEach((ts) => {
      console.log(
        `  ${ts.role}: version ${ts.version}, active: ${ts.isActive}`
      );
    });

    console.log("Users:");
    finalUsers.forEach((user) => {
      console.log(`  ${user.email}: role ${user.role}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

fixTemplateSets();
