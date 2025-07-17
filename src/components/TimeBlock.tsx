"use client";
import { useState } from "react";
import { Block } from "../types";

type Props = {
  block: Block;
  index: number;
  toggleComplete: (index: number) => void;
  addNote: (index: number, note: string) => void;
  deleteNote: (blockIndex: number, noteIndex: number) => void;
};

export default function TimeBlock({
  block,
  index,
  toggleComplete,
  addNote,
  deleteNote,
}: Props) {
  const [input, setInput] = useState("");

  const isHabitBreakNote = (note: string) => {
    // Check if the note starts with 🚫 (bad habit indicator)
    return note.startsWith("🚫 ");
  };

  const handleAddNote = () => {
    const trimmedInput = input.trim();
    if (trimmedInput && trimmedInput.length > 0) {
      addNote(index, trimmedInput);
      setInput("");
    }
  };

  return (
    <div className="mb-4 border border-gray-400 shadow-md p-4 rounded-lg bg-white dark:bg-gray-800 min-h-[150px]">
      <div className="flex justify-between">
        <h2 className="font-semibold">
          {block.time} – {block.label}
        </h2>
        <button
          onClick={() => toggleComplete(index)}
          className={`text-sm ${
            block.complete ? "text-green-400" : "text-gray-500"
          }`}
        >
          {block.complete ? "✓ Done" : "Mark Done"}
        </button>
      </div>

      {/* Daily checklist items (above Add Note) */}
      <ul className="list-disc pl-5 mt-2 space-y-1">
        {block.notes
          .filter((note) => !isHabitBreakNote(note))
          .map((note, index) => {
            // Use actual array index from filtered array
            const filteredIndex = index;
            // Find the actual index in the full notes array
            const actualIndex = block.notes.findIndex(
              (n, i) =>
                n === note &&
                !isHabitBreakNote(n) &&
                block.notes.slice(0, i).filter((n) => !isHabitBreakNote(n))
                  .length === filteredIndex
            );

            return (
              <li
                key={`${actualIndex}-${note.substring(0, 20)}`}
                className="flex justify-between items-center"
              >
                <span className="flex-1 text-sm">{note}</span>
                <button
                  onClick={() => deleteNote(index, actualIndex)}
                  className="text-red-500 hover:text-red-700"
                  title="Delete note"
                >
                  🗑️
                </button>
              </li>
            );
          })}
      </ul>

      {/* Add Note Input */}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Add Note..."
        className="mt-2 w-full border rounded px-2 py-1"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAddNote();
        }}
      />

      {/* Habit break items (below Add Note) */}
      {block.notes.some(isHabitBreakNote) && (
        <ul className="list-disc pl-5 mt-2 space-y-1">
          {block.notes.filter(isHabitBreakNote).map((note, index) => {
            // Use actual array index from filtered array
            const filteredIndex = index;
            // Find the actual index in the full notes array
            const actualIndex = block.notes.findIndex(
              (n, i) =>
                n === note &&
                isHabitBreakNote(n) &&
                block.notes.slice(0, i).filter((n) => isHabitBreakNote(n))
                  .length === filteredIndex
            );

            return (
              <li
                key={`habit-${actualIndex}-${note.substring(0, 20)}`}
                className="flex justify-between items-center"
              >
                <span className="flex-1 font-bold text-red-600 text-sm">
                  {note}
                </span>
                <button
                  onClick={() => deleteNote(index, actualIndex)}
                  className="text-red-500 hover:text-red-700"
                  title="Delete note"
                >
                  🗑️
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
