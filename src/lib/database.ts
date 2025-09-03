import "server-only";
import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Unified database connection function
 * Uses Mongoose with singleton pattern and caching for dev/production
 */
export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Re-export all models from one place
export { default as User } from "../models/User";
export { UserData } from "../models/UserData";
export { ContentTemplate } from "../models/ContentTemplate";

// Export additional models as needed
export { UserSpace } from "../models/UserSpace";
export { TodoItem } from "../models/TodoItem";
export { TemplateSet } from "../models/TemplateSet";
export { DayEntry } from "../models/DayEntry";

// Export types for convenience
export type { IUser } from "../models/User";
export type { IUserData } from "../models/UserData";
export type { IContentTemplate } from "../models/ContentTemplate";
export type { IUserSpace } from "../models/UserSpace";
export type { ITodoItem } from "../models/TodoItem";
export type { ITemplateSet } from "../models/TemplateSet";
export type { IDayEntry } from "../models/DayEntry";
