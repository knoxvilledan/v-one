"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface AdminViewToggleProps {
  onViewModeChange?: (newMode: "admin" | "public") => void;
}

export default function AdminViewToggle({
  onViewModeChange,
}: AdminViewToggleProps) {
  const { data: session } = useSession();
  const [viewMode, setViewMode] = useState<"admin" | "public">("admin");
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      fetchViewMode();
    }
  }, [session]);

  const fetchViewMode = async () => {
    try {
      const response = await fetch("/api/admin/toggle-view");
      if (response.ok) {
        const data = await response.json();
        setViewMode(data.viewMode || "admin");
        setIsAdmin(data.isAdmin || false);
      }
    } catch (error) {
      console.error("Error fetching view mode:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleViewMode = async () => {
    const newMode = viewMode === "admin" ? "public" : "admin";

    setIsToggling(true);
    try {
      const response = await fetch("/api/admin/toggle-view", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ viewMode: newMode }),
      });

      if (response.ok) {
        const data = await response.json();
        setViewMode(data.viewMode);

        // Notify parent component
        onViewModeChange?.(data.viewMode);

        // Show user feedback
        const action =
          data.viewMode === "admin" ? "personalized" : "public demo";
        alert(`Switched to ${action} view! Refreshing to load content...`);

        // Refresh the page to reload content with new view mode
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to toggle view: ${error.error}`);
      }
    } catch (error) {
      console.error("Error toggling view mode:", error);
      alert("Failed to toggle view mode");
    } finally {
      setIsToggling(false);
    }
  };

  // Don't render if not an admin or still loading
  if (isLoading || !isAdmin) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-600">View:</span>
      <div className="flex bg-gray-200 rounded-lg p-1">
        <button
          onClick={toggleViewMode}
          disabled={isToggling}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
            viewMode === "admin"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-gray-700 hover:text-gray-900 hover:bg-gray-300"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          👑 My Content
        </button>
        <button
          onClick={toggleViewMode}
          disabled={isToggling}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
            viewMode === "public"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-700 hover:text-gray-900 hover:bg-gray-300"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          👥 Public View
        </button>
      </div>

      {isToggling && (
        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
      )}
    </div>
  );
}
