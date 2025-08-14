import mongoose from "mongoose";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Load env from .env.local if present, else .env
const envPath = [".env.local", ".env"]
  .map((f) => resolve(process.cwd(), f))
  .find((p) => existsSync(p));
config(envPath ? { path: envPath } : undefined);

let User;
try {
  // Prefer compiled model if present (after next build)
  User = (await import("../dist/src/models/User.js")).default;
} catch {
  User = null;
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(uri);

  // Admin seed (placeholder)
  const adminEmail = "admin@example.com";
  const now = new Date();
  if (User) {
    await User.updateOne(
      { email: adminEmail },
      {
        $setOnInsert: {
          email: adminEmail,
          role: "admin",
          isEmailVerified: true,
          wakeTime: "--:--",
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true }
    );
  } else {
    // Fallback: use raw collection when compiled model isn't available
    await mongoose.connection.db.collection("users").updateOne(
      { email: adminEmail },
      {
        $setOnInsert: {
          email: adminEmail,
          role: "admin",
          isEmailVerified: true,
          wakeTime: "--:--",
          createdAt: now,
          updatedAt: now,
          isActive: true,
        },
      },
      { upsert: true }
    );
  }

  // Content templates seed (idempotent)
  const db = mongoose.connection.db;
  await db.collection("content_templates").updateOne(
    { userRole: "public" },
    {
      $setOnInsert: {
        userRole: "public",
        type: "placeholderText",
        content: {
          masterChecklist: [],
          habitBreakChecklist: [],
          timeBlocks: [],
        },
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true }
  );
  await db.collection("content_templates").updateOne(
    { userRole: "admin" },
    {
      $setOnInsert: {
        userRole: "admin",
        type: "placeholderText",
        content: {
          masterChecklist: [],
          habitBreakChecklist: [],
          timeBlocks: [],
        },
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true }
  );

  await mongoose.connection.close();
  console.log("SEED_OK");
}

run().catch((e) => {
  console.error("SEED_FAIL", e);
  process.exit(1);
});
