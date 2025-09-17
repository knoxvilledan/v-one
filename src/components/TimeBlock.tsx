import { useState } from "react";
import { Block } from "../types";
import EditableTimeBlockLabel from "./EditableTimeBlockLabel";

type Props = {
  block: Block;
  index: number;
  toggleComplete: (blockId: string) => void;
  addNote: (blockId: string, note: string) => void;
  deleteNote: (blockId: string, noteIndex: number) => void;
  onLabelUpdate?: (blockId: string, newLabel: string) => void;
  onError?: (error: string) => void;
  isAdmin?: boolean;
};

export default function TimeBlock({
  block,
  index,
  toggleComplete,
  addNote,
  deleteNote,
  onLabelUpdate,
  onError,
  isAdmin = false,
}: Props) {
  const [input, setInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isHabitBreakNote = (note: string) => {
    // Check if the note starts with 🚫 (bad habit indicator)
    return note.startsWith("🚫 ");
  };

  const handleAddNote = async () => {
    const trimmedInput = input.trim();
    if (trimmedInput && trimmedInput.length > 0) {
      setIsSaving(true);
      try {
        await addNote(block.id, trimmedInput);
        setInput("");
      } catch (error) {
        console.error("Error adding note:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="mb-4 border border-gray-400 shadow-md p-4 rounded-lg bg-white dark:bg-gray-800 min-h-[150px]">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="text-sm text-gray-600 font-medium mb-1">
            {block.time}
          </div>
          <EditableTimeBlockLabel
            blockIndex={index}
            currentLabel={block.label}
            onLabelUpdate={(blockIndex, newLabel) =>
              onLabelUpdate?.(block.id, newLabel)
            }
            onError={onError}
            isAdmin={isAdmin}
          />
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            <svg
              className={`w-4 h-4 transition-transform ${
                isCollapsed ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <button
            onClick={() => toggleComplete(block.id)}
            className={`text-sm ${
              block.complete ? "text-green-400" : "text-gray-500"
            }`}
          >
            {block.complete ? "✓ Done" : "Mark Done"}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="mt-3">
          {/* Daily checklist items (above Add Note) */}
          <ul className="list-disc pl-5 mt-2 space-y-1">
            {block.notes
              .map((note, noteIndex) => ({ note, noteIndex }))
              .filter(({ note }) => !isHabitBreakNote(note))
              .map(({ note, noteIndex }) => (
                <li
                  key={`${noteIndex}-${note.substring(0, 20)}`}
                  className="flex justify-between items-center"
                >
                  <span className="flex-1 text-sm">{note}</span>
                  <button
                    onClick={() => deleteNote(block.id, noteIndex)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete note"
                  >
                    🗑️
                  </button>
                </li>
              ))}
          </ul>

          {/* Add Note Input */}
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add Note..."
              className="flex-1 border rounded px-2 py-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddNote();
              }}
              disabled={isSaving}
            />
            {input.trim() && (
              <button
                onClick={handleAddNote}
                disabled={isSaving}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm transition-all"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            )}
          </div>

          {/* Habit break items (below Add Note) */}
          {block.notes.some(isHabitBreakNote) && (
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {block.notes
                .map((note, noteIndex) => ({ note, noteIndex }))
                .filter(({ note }) => isHabitBreakNote(note))
                .map(({ note, noteIndex }) => (
                  <li
                    key={`habit-${noteIndex}-${note.substring(0, 20)}`}
                    className="flex justify-between items-center"
                  >
                    <span className="flex-1 font-bold text-red-600 text-sm">
                      {note}
                    </span>
                    <button
                      onClick={() => deleteNote(block.id, noteIndex)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete note"
                    >
                      🗑️
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
