"use client";
import { useState } from "react";
import { Block } from "../types";

type Props = {
  block: Block;
  index: number;
  toggleComplete: (index: number) => void;
  addNote: (index: number, note: string) => void;
  deleteNote: (blockIndex: number, noteIndex: number) => void;
  editNote: (blockIndex: number, noteIndex: number, newNote: string) => void;
};

export default function TimeBlock({
  block,
  index,
  toggleComplete,
  addNote,
  deleteNote,
  editNote,
}: Props) {
  const [input, setInput] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

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

  const startEditing = (noteIndex: number, currentNote: string) => {
    setEditingIndex(noteIndex);
    setEditValue(currentNote);
  };

  const saveEdit = (noteIndex: number) => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue.length > 0) {
      editNote(index, noteIndex, trimmedValue);
      setEditingIndex(null);
      setEditValue("");
    } else {
      // If empty, just cancel the edit
      cancelEdit();
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
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
          .map((note) => {
            const originalIndex = block.notes.indexOf(note);
            return (
              <li
                key={originalIndex}
                className="flex justify-between items-center"
              >
                {editingIndex === originalIndex ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(originalIndex);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => saveEdit(originalIndex)}
                      className="text-green-500 hover:text-green-700"
                    >
                      ✓
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <span
                      onClick={() => startEditing(originalIndex, note)}
                      className="cursor-pointer hover:bg-gray-100 px-1 rounded flex-1"
                      title="Click to edit"
                    >
                      {note}
                    </span>
                    <button
                      onClick={() => deleteNote(index, originalIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      🗑️
                    </button>
                  </>
                )}
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
          {block.notes.filter(isHabitBreakNote).map((note) => {
            const originalIndex = block.notes.indexOf(note);
            return (
              <li
                key={originalIndex}
                className="flex justify-between items-center"
              >
                {editingIndex === originalIndex ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(originalIndex);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => saveEdit(originalIndex)}
                      className="text-green-500 hover:text-green-700"
                    >
                      ✓
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <span
                      onClick={() => startEditing(originalIndex, note)}
                      className="cursor-pointer hover:bg-gray-100 px-1 rounded flex-1 font-bold text-red-600"
                      title="Click to edit"
                    >
                      {note}
                    </span>
                    <button
                      onClick={() => deleteNote(index, originalIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      🗑️
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
