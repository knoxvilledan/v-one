import { MongoClient } from "mongodb";
import { User, UserRole } from "../types/content";

const MONGODB_URI = process.env.MONGODB_URI!;
const client = new MongoClient(MONGODB_URI);

export class UserRoleService {
  private static async getDatabase() {
    await client.connect();
    return client.db("AmpTracker");
  }

  // Initialize user roles in the database
  static async initializeUserRoles() {
    try {
      const db = await this.getDatabase();
      const usersCollection = db.collection<User>("users");

      // Create an index on email for faster lookups
      await usersCollection.createIndex({ email: 1 }, { unique: true });

      // Set up your email as admin (replace with your actual email)
      const adminEmail = "knoxvilledan@yahoo.com";

      await usersCollection.updateOne(
        { email: adminEmail },
        {
          $set: {
            email: adminEmail,
            name: "Daniel Nelson", // Your name
            role: "admin" as UserRole,
            updatedAt: new Date(),
            isActive: true,
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      console.log(`✅ Admin user initialized: ${adminEmail}`);
      return true;
    } catch (error) {
      console.error("❌ Error initializing user roles:", error);
      return false;
    }
  }

  // Get user role by email
  static async getUserRole(email: string): Promise<UserRole> {
    try {
      const db = await this.getDatabase();
      const usersCollection = db.collection<User>("users");

      const user = await usersCollection.findOne({ email });

      if (user) {
        return user.role;
      }

      // Default to public for new users
      return "public";
    } catch (error) {
      console.error("❌ Error getting user role:", error);
      return "public"; // Default to public on error
    }
  }

  // Create or update user
  static async createOrUpdateUser(
    email: string,
    name?: string,
    role: UserRole = "public"
  ): Promise<User> {
    try {
      const db = await this.getDatabase();
      const usersCollection = db.collection<User>("users");

      const userProfile: Partial<User> = {
        email,
        name,
        role,
        updatedAt: new Date(),
        isActive: true,
      };

      const result = await usersCollection.findOneAndUpdate(
        { email },
        {
          $set: userProfile,
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true, returnDocument: "after" }
      );

      return result as User;
    } catch (error) {
      console.error("❌ Error creating/updating user:", error);
      throw error;
    }
  }

  // Check if user has admin access
  static async isAdmin(email: string): Promise<boolean> {
    const role = await this.getUserRole(email);
    return role === "admin";
  }

  // Get all users (admin only)
  static async getAllUsers(): Promise<User[]> {
    try {
      const db = await this.getDatabase();
      const usersCollection = db.collection<User>("users");

      return await usersCollection.find({}).toArray();
    } catch (error) {
      console.error("❌ Error getting all users:", error);
      return [];
    }
  }

  // Update user role (admin only)
  static async updateUserRole(
    email: string,
    newRole: UserRole,
    adminEmail: string
  ): Promise<boolean> {
    try {
      // Verify admin access
      const isAdminUser = await this.isAdmin(adminEmail);
      if (!isAdminUser) {
        throw new Error("Unauthorized: Only admins can update user roles");
      }

      const db = await this.getDatabase();
      const usersCollection = db.collection<User>("users");

      const result = await usersCollection.updateOne(
        { email },
        {
          $set: {
            role: newRole,
            updatedAt: new Date(),
          },
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error("❌ Error updating user role:", error);
      return false;
    }
  }
}
