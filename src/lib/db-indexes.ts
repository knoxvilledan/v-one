import mongoose from "mongoose";

let initialized = false;

export async function ensureIndexes() {
  if (initialized) return;
  const db = mongoose.connection.db;
  if (!db) return;
  try {
    await Promise.all([
      db.collection("user_data").createIndex({ userId: 1, date: 1 }, { unique: true }),
      db.collection("users").createIndex({ email: 1 }, { unique: true }),
      db.collection("content_templates").createIndex({ userRole: 1 }, { unique: true }),
    ]);
  } catch (e) {
    console.error("Index creation error", e);
  }
  initialized = true;
}
