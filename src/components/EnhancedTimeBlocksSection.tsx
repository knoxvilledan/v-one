"use client";
import { useState, useEffect } from "react";
import { Block } from "../types";

interface TimeBlocksSectionProps {
  blocks: Block[];
  onToggleBlock: (blockId: string) => void;
  onAddNote: (blockId: string, note: string) => void;
  onDeleteNote: (blockId: string, noteIndex: number) => void;
  onUpdateLabel: (blockId: string, newLabel: string) => void;
  isAdmin?: boolean;
  date: string;
}

export default function TimeBlocksSection({
  blocks,
  onToggleBlock,
  onAddNote,
  onDeleteNote,
  onUpdateLabel,
  isAdmin = false,
  date,
}: TimeBlocksSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const completedBlocks = blocks.filter((block) => block.complete).length;
  const totalBlocks = blocks.length;
  const completionPercentage =
    totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;

  const handleAddNote = (blockId: string) => {
    const note = noteInputs[blockId]?.trim();
    if (note) {
      onAddNote(blockId, note);
      setNoteInputs((prev) => ({ ...prev, [blockId]: "" }));
    }
  };

  const handleNoteInputChange = (blockId: string, value: string) => {
    setNoteInputs((prev) => ({ ...prev, [blockId]: value }));
  };

  const formatCompletionTime = (completedAt?: Date) => {
    if (!completedAt) return "";
    return completedAt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isCompletedItemNote = (
    note: string
  ): { type: string; emoji: string } | null => {
    if (note.startsWith("✓ ")) return { type: "daily", emoji: "✓" };
    if (note.startsWith("🚫 ")) return { type: "habit", emoji: "🚫" };
    if (note.startsWith("💪 ")) return { type: "workout", emoji: "💪" };
    return null;
  };

  // Determine grid columns based on screen size
  const getGridClass = () => {
    if (isMobile) return "grid-cols-1";
    if (blocks.length <= 6) return "md:grid-cols-2 xl:grid-cols-3";
    return "md:grid-cols-2 xl:grid-cols-3";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          <span>{isExpanded ? "▼" : "▶"}</span>
          <span>⏰ Time Blocks (18-hour system: 4:00 AM - 9:00 PM)</span>
        </button>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {completedBlocks}/{totalBlocks} ({completionPercentage}%)
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {/* Time Blocks Grid */}
          <div className={`grid gap-4 ${getGridClass()}`}>
            {blocks.map((block, index) => (
              <div
                key={block.id}
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  block.complete
                    ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                    : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {/* Block Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={block.complete}
                      onChange={() => onToggleBlock(block.id)}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {block.time}
                    </h3>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Block {index + 1}
                  </span>
                </div>

                {/* Block Label */}
                <div className="mb-3">
                  {isAdmin ? (
                    <input
                      type="text"
                      value={block.label}
                      onChange={(e) => onUpdateLabel(block.id, e.target.value)}
                      className="w-full p-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700"
                      placeholder="Block label..."
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {block.label}
                    </p>
                  )}
                </div>

                {/* Notes Section */}
                {block.notes && block.notes.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {block.notes.map((note, noteIndex) => {
                      const completedItemInfo = isCompletedItemNote(note);
                      return (
                        <div
                          key={noteIndex}
                          className={`flex items-start justify-between group p-2 rounded text-sm ${
                            completedItemInfo
                              ? completedItemInfo.type === "habit"
                                ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                                : completedItemInfo.type === "workout"
                                ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                                : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                              : "bg-gray-50 dark:bg-gray-700"
                          }`}
                        >
                          <div className="flex-1 break-words">
                            {completedItemInfo ? (
                              <span className="font-medium">
                                {completedItemInfo.emoji} {note.substring(2)}
                              </span>
                            ) : (
                              note
                            )}
                          </div>
                          <button
                            onClick={() => onDeleteNote(block.id, noteIndex)}
                            className="ml-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete note"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Note Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteInputs[block.id] || ""}
                    onChange={(e) =>
                      handleNoteInputChange(block.id, e.target.value)
                    }
                    placeholder="Add note..."
                    className="flex-1 px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddNote(block.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleAddNote(block.id)}
                    disabled={!noteInputs[block.id]?.trim()}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Block Duration Info */}
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Duration: {block.duration || 60} minutes
                  {block.complete && block.completedAt && (
                    <span className="ml-2">
                      • Completed: {formatCompletionTime(block.completedAt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Wake Time Configuration Note */}
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p>
              <strong>Auto-assignment rules:</strong>
            </p>
            <ul className="mt-1 space-y-1">
              <li>
                • Completed items between 00:01-04:59 → assigned to 4:00 AM
                block
              </li>
              <li>• Daily checklist items: ✓ [task] (timestamp)</li>
              <li>• Habit breaks: 🚫 [habit] (timestamp)</li>
              <li>• Todo items: ✓ [task] (timestamp)</li>
              <li>• Workouts: 💪 [workout] (timestamp)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
