"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import AdminPanel from "../../components/AdminPanel";

export default function AdminPage() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
          <p>Please sign in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          AMP Tracker - Admin Panel
        </h1>

        <AdminPanel />

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to AMP Tracker
          </Link>
        </div>
      </div>
    </div>
  );
}
