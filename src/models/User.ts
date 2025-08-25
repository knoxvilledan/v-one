import "server-only";
import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  authUserId?: string; // maps to NextAuth user.id
  email: string;
  username?: string;
  passwordHash?: string; // bcrypt hash for email/password authentication
  isEmailVerified: boolean; // optional, for later email verification
  role: "admin" | "public" | "guest";
  wakeTime: string; // "HH:mm" or "--:--"
  resetToken?: string; // for password reset
  resetTokenExpiry?: Date; // expiry for reset token
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    authUserId: {
      type: String,
      unique: true,
      sparse: true, // allows null/undefined values to not conflict with uniqueness
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    username: {
      type: String,
    },
    passwordHash: {
      type: String, // bcrypt hash for email/password authentication
    },
    isEmailVerified: {
      type: Boolean,
      default: false, // optional, for later email verification
    },
    role: {
      type: String,
      enum: ["admin", "public", "guest"],
      default: "public",
    },
    wakeTime: {
      type: String,
      default: "--:--", // "HH:mm" or "--:--"
    },
    resetToken: {
      type: String,
    },
    resetTokenExpiry: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation during development
const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
