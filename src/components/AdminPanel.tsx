"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface User {
  email: string;
  name?: string;
  role: "admin" | "public";
  adminViewMode?: "admin" | "public";
}

export default function AdminPanel() {
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      fetchUser();
    }
  }, [session]);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (newRole: "admin" | "public") => {
    try {
      setUpdating(true);
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        alert(
          `Role updated to ${newRole}! You may need to refresh the page to see changes.`
        );
      }
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role");
    } finally {
      setUpdating(false);
    }
  };

  if (!session) {
    return (
      <div className="p-4">
        <p>Please sign in to access the admin panel.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <p>Loading user information...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>

      {user && (
        <div className="space-y-4">
          <div>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Name:</strong> {user.name || "Not set"}
            </p>
            <p>
              <strong>Current Role:</strong>
              <span
                className={`ml-2 px-2 py-1 rounded text-sm ${
                  user.role === "admin"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {user.role}
              </span>
            </p>
            {user.role === "admin" && (
              <p>
                <strong>Current View Mode:</strong>
                <span
                  className={`ml-2 px-2 py-1 rounded text-sm ${
                    user.adminViewMode === "admin"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {user.adminViewMode === "admin"
                    ? "👑 Personal Content"
                    : "👥 Public Demo"}
                </span>
              </p>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Change Role:</h3>
            <div className="space-x-2">
              <button
                onClick={() => updateRole("admin")}
                disabled={updating || user.role === "admin"}
                className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "Updating..." : "Set as Admin"}
              </button>
              <button
                onClick={() => updateRole("public")}
                disabled={updating || user.role === "public"}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "Updating..." : "Set as Public"}
              </button>
            </div>
          </div>

          <div className="border-t pt-4 text-sm text-gray-600">
            <h4 className="font-semibold">Role & View Mode Info:</h4>
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li>
                <strong>Admin Role:</strong> Access to personalized content and
                public demo mode
              </li>
              <li>
                <strong>Public Role:</strong> Sees generic placeholder content
                only
              </li>
              <li>
                <strong>Admin View Toggle:</strong> Use the toggle in the
                top-right corner to switch between your personal content and
                public demo
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
