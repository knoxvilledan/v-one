import mongoose from "mongoose";

let initialized = false;

export async function ensureIndexes() {
  if (initialized) return;
  const db = mongoose.connection.db;
  if (!db) return;
  try {
    await Promise.all([
      db.collection("user_data").createIndex(
        { userId: 1, date: 1 },
        {
          name: "user_data_userId_date_unique",
          unique: true,
          partialFilterExpression: { userId: { $type: "string" } },
        }
      ),
      db
        .collection("users")
        .createIndex(
          { email: 1 },
          { name: "users_email_unique", unique: true }
        ),
      db
        .collection("content_templates")
        .createIndex(
          { userRole: 1 },
          { name: "content_templates_userRole_unique", unique: true }
        ),
    ]);
  } catch (e) {
    console.error("Index creation error", e);
  }
  initialized = true;
}
