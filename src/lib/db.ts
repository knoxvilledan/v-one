import { MongoClient } from "mongodb";
import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

const uri = process.env.MONGODB_URI;

// MongoDB Client for NextAuth adapter
const mongoOptions = {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000,
};

let mongoClient: MongoClient;
let mongoClientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable to preserve the connection
  const globalWithMongoDB = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongoDB._mongoClientPromise) {
    mongoClient = new MongoClient(uri, mongoOptions);
    globalWithMongoDB._mongoClientPromise = mongoClient.connect();
  }
  mongoClientPromise = globalWithMongoDB._mongoClientPromise;
} else {
  // In production mode, create a new client for each connection
  mongoClient = new MongoClient(uri, mongoOptions);
  mongoClientPromise = mongoClient.connect();
}

// Mongoose connection for models
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const mongooseCache: MongooseCache = global.mongoose || {
  conn: null,
  promise: null,
};

if (!global.mongoose) {
  global.mongoose = mongooseCache;
}

async function connectMongoose() {
  if (mongooseCache.conn) {
    return mongooseCache.conn;
  }

  if (!mongooseCache.promise) {
    const opts = {
      bufferCommands: false,
    };

    mongooseCache.promise = mongoose.connect(uri, opts);
  }

  try {
    mongooseCache.conn = await mongooseCache.promise;
  } catch (e) {
    mongooseCache.promise = null;
    throw e;
  }

  return mongooseCache.conn;
}

// Export both connections
export { mongoClientPromise, connectMongoose };
export default mongoClientPromise; // Default export for NextAuth compatibility
