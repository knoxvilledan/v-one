"use client";
import { useState } from "react";

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface EditableChecklistProps {
  items: ChecklistItem[];
  onUpdateItems: (items: ChecklistItem[]) => void;
  title?: string;
}

export default function EditableChecklist({
  items,
  onUpdateItems,
  title = "Checklist",
}: EditableChecklistProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [newItemText, setNewItemText] = useState("");

  const toggleComplete = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    onUpdateItems(updated);
  };

  const startEditing = (item: ChecklistItem) => {
    setEditingItemId(item.id);
    setEditText(item.text);
  };

  const saveEdit = () => {
    if (editText.trim()) {
      const updated = items.map((item) =>
        item.id === editingItemId ? { ...item, text: editText.trim() } : item
      );
      onUpdateItems(updated);
    }
    setEditingItemId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditText("");
  };

  const addNewItem = () => {
    if (newItemText.trim()) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: newItemText.trim(),
        completed: false,
      };
      onUpdateItems([...items, newItem]);
      setNewItemText("");
    }
  };

  const deleteItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    onUpdateItems(updated);
  };

  const moveItem = (id: string, direction: "up" | "down") => {
    const currentIndex = items.findIndex((item) => item.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const updated = [...items];
    const [movedItem] = updated.splice(currentIndex, 1);
    updated.splice(newIndex, 0, movedItem);
    onUpdateItems(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300">
          {title}
        </h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {isEditing ? "Done" : "Edit"}
        </button>
      </div>

      <div className="space-y-1">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center group">
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggleComplete(item.id)}
              className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />

            {editingItemId === item.id ? (
              <div className="flex-1 flex items-center space-x-2">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  autoFocus
                />
                <button
                  onClick={saveEdit}
                  className="text-green-600 hover:text-green-800 text-sm px-2 py-1"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="text-gray-600 hover:text-gray-800 text-sm px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-between">
                <span
                  className={`text-sm ${
                    item.completed
                      ? "line-through text-gray-500"
                      : "text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {item.text}
                </span>

                {isEditing && (
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveItem(item.id, "up")}
                      disabled={index === 0}
                      className="text-gray-500 hover:text-gray-700 disabled:opacity-30 p-1"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveItem(item.id, "down")}
                      disabled={index === items.length - 1}
                      className="text-gray-500 hover:text-gray-700 disabled:opacity-30 p-1"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => startEditing(item)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="flex items-center space-x-2 mt-3 pt-2 border-t">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add new checklist item..."
            className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") addNewItem();
            }}
          />
          <button
            onClick={addNewItem}
            className="text-blue-600 hover:text-blue-800 px-3 py-1 text-sm"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
