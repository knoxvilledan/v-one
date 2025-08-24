/* eslint-disable @typescript-eslint/no-explicit-any */
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./mongodb";
import dbConnect from "./dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise, { databaseName: "AmpTrack" }),
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await dbConnect();
          const user = await User.findOne({
            email: credentials.email.toLowerCase(),
          });

          if (!user?.passwordHash) {
            return null; // User doesn't exist or doesn't have password (OAuth-only user)
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.username || user.email,
          };
        } catch (error) {
          console.error("Credentials auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const, // Use JWT for credentials, database for OAuth
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signin", // Redirect to signin page after signout
  },
  events: {
    async createUser({ user }: { user: any }) {
      // Create app-level user record when NextAuth creates a user (OAuth flow)
      try {
        await dbConnect();
        await User.updateOne(
          { email: user.email },
          {
            $setOnInsert: {
              authUserId: user.id,
              role: "public",
              wakeTime: "--:--",
              isEmailVerified: true, // OAuth users are pre-verified
            },
          },
          { upsert: true }
        );
        console.log(`Created/updated app-level user for ${user.email}`);
      } catch (error) {
        console.error("Error creating app-level user:", error);
      }
    },
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      // For credentials provider
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({
      session,
      user,
      token,
    }: {
      session: any;
      user?: any;
      token?: any;
    }) {
      // Handle both database sessions (OAuth) and JWT sessions (credentials)
      if (user) {
        // Database session (OAuth)
        session.user.id = user.id;
      } else if (token) {
        // JWT session (credentials)
        session.user.id = token.id;
      }
      return session;
    },
  },
  debug: false,
};
