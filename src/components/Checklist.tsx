"use client";

import { useState, useTransition } from "react";
import {
  completeChecklistItem,
  uncompleteChecklistItem,
  addChecklistNotes,
  type ChecklistData,
  type ChecklistItem,
} from "../lib/checklist-actions";

interface ChecklistProps {
  checklist: ChecklistData;
  completedItemIds?: string[];
  notes?: string;
  targetDate?: string; // YYYY-MM-DD format
  showNotes?: boolean;
  className?: string;
}

export default function Checklist({
  checklist,
  completedItemIds = [],
  notes = "",
  targetDate,
  showNotes = true,
  className = "",
}: ChecklistProps) {
  const [isPending, startTransition] = useTransition();
  const [localNotes, setLocalNotes] = useState(notes);
  const [notesError, setNotesError] = useState("");

  const handleItemToggle = async (
    item: ChecklistItem,
    isCompleted: boolean
  ) => {
    startTransition(async () => {
      try {
        if (isCompleted) {
          await uncompleteChecklistItem(
            checklist.checklistId,
            item.itemId,
            targetDate
          );
        } else {
          await completeChecklistItem(
            checklist.checklistId,
            item.itemId,
            item.text,
            targetDate
          );
        }
      } catch (error) {
        console.error("Error toggling checklist item:", error);
        // In a real app, you might want to show a toast notification here
      }
    });
  };

  const handleNotesSubmit = async () => {
    if (localNotes.trim() === notes.trim()) return; // No changes

    startTransition(async () => {
      try {
        await addChecklistNotes(checklist.checklistId, localNotes, targetDate);
        setNotesError("");
      } catch (error) {
        console.error("Error saving notes:", error);
        setNotesError("Failed to save notes. Please try again.");
      }
    });
  };

  const handleNotesKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleNotesSubmit();
    }
  };

  // Get ordered items based on itemsOrder
  const orderedItems = checklist.itemsOrder
    .map((itemId) => checklist.items.find((item) => item.itemId === itemId))
    .filter(Boolean) as ChecklistItem[];

  // Add any items not in the order array (fallback)
  const unorderedItems = checklist.items.filter(
    (item) => !checklist.itemsOrder.includes(item.itemId)
  );
  const allItems = [...orderedItems, ...unorderedItems];

  const completedCount = completedItemIds.length;
  const totalCount = allItems.length;
  const completionPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {checklist.title}
          {checklist.isCustom && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Custom
            </span>
          )}
        </h3>
        <div className="text-sm text-gray-500">
          {completedCount}/{totalCount} ({completionPercentage}%)
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Items */}
      <div className="space-y-2">
        {allItems.map((item) => {
          const isCompleted = completedItemIds.includes(item.itemId);

          return (
            <label
              key={item.itemId}
              className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors
                ${
                  isCompleted
                    ? "bg-green-50 hover:bg-green-100"
                    : "hover:bg-gray-50"
                }
                ${isPending ? "opacity-50 pointer-events-none" : ""}
              `}
            >
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={(e) => handleItemToggle(item, e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                disabled={isPending}
              />
              <span
                className={`flex-1 ${
                  isCompleted ? "text-green-700 line-through" : "text-gray-900"
                }`}
              >
                {item.text}
                {item.isCustom && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                    Custom
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      {/* Notes Section */}
      {showNotes && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={handleNotesSubmit}
            onKeyDown={handleNotesKeyDown}
            placeholder="Add notes about this checklist... (Ctrl+Enter to save)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            rows={3}
            disabled={isPending}
          />
          {notesError && (
            <p className="mt-1 text-sm text-red-600">{notesError}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Notes are automatically saved when you click outside or press
            Ctrl+Enter
          </p>
        </div>
      )}

      {/* Loading Indicator */}
      {isPending && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
        </div>
      )}
    </div>
  );
}
