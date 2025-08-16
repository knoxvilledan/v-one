import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

const envPath = [".env.local", ".env"].map((f) => resolve(process.cwd(), f)).find((p) => existsSync(p));
config(envPath ? { path: envPath } : undefined);

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI not set");

// Support CLI args: --email foo --password bar
const args = process.argv.slice(2);
const emailArgIdx = args.indexOf("--email");
const passArgIdx = args.indexOf("--password");
const email = (emailArgIdx >= 0 ? args[emailArgIdx + 1] : process.env.ADMIN_EMAIL) || "admin@example.com";
const password = (passArgIdx >= 0 ? args[passArgIdx + 1] : process.env.ADMIN_PASSWORD) || "ChangeMe!123";

async function run() {
  await mongoose.connect(uri);
  const hash = await bcrypt.hash(password, 10);
  const now = new Date();
  const res = await mongoose.connection.db.collection("users").updateOne(
    { email: email.toLowerCase() },
    {
      $set: {
        email: email.toLowerCase(),
        passwordHash: hash,
        role: "admin",
        isEmailVerified: true,
        wakeTime: "--:--",
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );
  await mongoose.connection.close();
  console.log("CREATE_ADMIN_OK", res.upsertedId ? "created" : "updated");
}

run().catch((e) => {
  console.error("CREATE_ADMIN_FAIL", e);
  process.exit(1);
});
