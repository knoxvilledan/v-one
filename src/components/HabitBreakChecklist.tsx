"use client";
import { useState } from "react";
import { ChecklistItem } from "../types";

interface HabitBreakChecklistProps {
  items: ChecklistItem[];
  onCompleteItem: (itemId: string) => void;
  onUpdateItems: (items: ChecklistItem[]) => void;
}

interface HabitBreakSection {
  title: string;
  category: ChecklistItem["category"] | "completed";
  items: ChecklistItem[];
}

export default function HabitBreakChecklist({
  items,
  onCompleteItem,
  onUpdateItems,
}: HabitBreakChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    lsd: false,
    financial: false,
    youtube: false,
    time: false,
    entertainment: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editTargetBlock, setEditTargetBlock] = useState<number | undefined>(
    undefined
  );
  const [newItemText, setNewItemText] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<
    ChecklistItem["category"] | "completed"
  >("lsd");

  // Get current time block based on actual time
  const getCurrentTimeBlock = (): number => {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 4 && hour < 5) return 0; // 4:00 AM
    if (hour >= 5 && hour < 6) return 1; // 5:00 AM
    if (hour >= 6 && hour < 7) return 2; // 6:00 AM
    if (hour >= 7 && hour < 8) return 3; // 7:00 AM
    if (hour >= 8 && hour < 9) return 4; // 8:00 AM
    if (hour >= 9 && hour < 17) return 5; // 9:00 AM - 5:00 PM (Work)
    if (hour >= 17 && hour < 18) return 6; // 5:00 PM
    if (hour >= 18 && hour < 20) return 7; // 6:00 PM
    if (hour >= 20 && hour < 21) return 8; // 8:00 PM
    if (hour >= 21 || hour < 4) return 9; // 9:00 PM - 4:00 AM

    return 5; // Default to work block
  };

  const toggleSection = (category: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleCompleteItem = (item: ChecklistItem) => {
    const updatedItem = {
      ...item,
      completed: true,
      completedAt: new Date(),
      targetBlock: getCurrentTimeBlock(),
    };

    const updatedItems = items.map((i) => (i.id === item.id ? updatedItem : i));
    onUpdateItems(updatedItems);
    onCompleteItem(item.id);
  };

  const handleToggleItem = (item: ChecklistItem) => {
    if (item.completed) {
      // Uncompleting the item - restore it to the habit break checklist
      const updatedItem = {
        ...item,
        completed: false,
        completedAt: undefined,
        targetBlock: undefined,
      };
      const updatedItems = items.map((i) =>
        i.id === item.id ? updatedItem : i
      );
      onUpdateItems(updatedItems);
    } else {
      // Completing the item - add it to a time block
      handleCompleteItem(item);
    }
  };

  const startEditing = (item: ChecklistItem) => {
    setEditingItemId(item.id);
    setEditText(item.text);
    setEditTargetBlock(item.targetBlock);
  };

  const saveEdit = () => {
    if (editText.trim()) {
      const updatedItems = items.map((item) =>
        item.id === editingItemId
          ? { ...item, text: editText.trim(), targetBlock: editTargetBlock }
          : item
      );
      onUpdateItems(updatedItems);
    }
    setEditingItemId(null);
    setEditText("");
    setEditTargetBlock(undefined);
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditText("");
    setEditTargetBlock(undefined);
  };

  const undoCompletion = (item: ChecklistItem) => {
    try {
      const updatedItems = items.map((i) =>
        i.id === item.id
          ? {
              ...i,
              completed: false,
              completedAt: undefined,
              targetBlock: undefined,
            }
          : i
      );
      onUpdateItems(updatedItems);
    } catch (error) {
      console.error("Error undoing completion:", error);
    }
  };

  const addNewItem = () => {
    if (newItemText.trim() && newItemCategory !== "completed") {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: newItemText.trim(),
        completed: false,
        category: newItemCategory as ChecklistItem["category"],
      };
      onUpdateItems([...items, newItem]);
      setNewItemText("");
    }
  };

  const deleteItem = (id: string) => {
    const updatedItems = items.filter((item) => item.id !== id);
    onUpdateItems(updatedItems);
  };

  // Group items by category for habit breaking
  const sections: HabitBreakSection[] = [
    {
      title: "LSD Energy",
      category: "lsd",
      items: items.filter((item) => item.category === "lsd" && !item.completed),
    },
    {
      title: "Financial Waste",
      category: "financial",
      items: items.filter(
        (item) => item.category === "financial" && !item.completed
      ),
    },
    {
      title: "Youtube Shorts",
      category: "youtube",
      items: items.filter(
        (item) => item.category === "youtube" && !item.completed
      ),
    },
    {
      title: "Time Wasted",
      category: "time",
      items: items.filter(
        (item) => item.category === "time" && !item.completed
      ),
    },
    {
      title: "Wasteful Entertainment",
      category: "entertainment",
      items: items.filter(
        (item) => item.category === "entertainment" && !item.completed
      ),
    },
  ];

  // Add completed items section if there are any
  if (items.some((item) => item.completed)) {
    sections.push({
      title: "Completed Bad Habits",
      category: "completed" as ChecklistItem["category"],
      items: items.filter((item) => item.completed),
    });
  }

  const totalIncompleteItems = items.filter((item) => !item.completed).length;
  const completedToday = items.filter((item) => item.completed).length;

  return (
    <div className="mb-6 border border-red-300 dark:border-red-600 rounded-lg bg-red-50 dark:bg-red-900/20 shadow-md">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-red-100 dark:hover:bg-red-800/30"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg text-red-600 dark:text-red-400">
            {isExpanded ? "▼" : "▶"}
          </span>
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
            🚫 Habit Break Checklist
          </h2>
          <span className="text-sm text-red-600 dark:text-red-400">
            {completedToday} broken today • {totalIncompleteItems} to avoid
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(!isEditing);
          }}
          className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
        >
          {isEditing ? "Done" : "Edit"}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-red-200 dark:border-red-700">
          {sections.map((section) => (
            <div
              key={section.category}
              className="border-b border-red-100 dark:border-red-800 last:border-b-0"
            >
              {/* Section Header */}
              <div
                className="flex items-center justify-between p-3 bg-red-100 dark:bg-red-800/30 cursor-pointer hover:bg-red-200 dark:hover:bg-red-700/40"
                onClick={() => toggleSection(section.category)}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-red-600 dark:text-red-400">
                    {expandedSections[section.category] ? "▼" : "▶"}
                  </span>
                  <h3 className="font-medium text-red-700 dark:text-red-300">
                    {section.title}
                  </h3>
                  <span className="text-xs text-red-600 dark:text-red-400">
                    ({section.items.length})
                  </span>
                </div>
              </div>

              {/* Section Items */}
              {expandedSections[section.category] && (
                <div className="p-3 space-y-2">
                  {section.items.map((item) => (
                    <div key={item.id} className="flex items-center group">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleItem(item)}
                        className="mr-3 h-4 w-4 text-red-600 rounded focus:ring-red-500"
                      />

                      {editingItemId === item.id ? (
                        <div className="flex-1 flex items-center space-x-2">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="flex-1 px-2 py-1 border border-red-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") cancelEdit();
                            }}
                            autoFocus
                          />
                          <select
                            value={editTargetBlock || ""}
                            onChange={(e) =>
                              setEditTargetBlock(
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined
                              )
                            }
                            className="px-2 py-1 border border-red-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            <option value="">Auto-assign</option>
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((block) => (
                              <option key={block} value={block}>
                                Block {block}
                              </option>
                            ))}
                          </select>
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
                          <div className="flex-1">
                            <span
                              className={`text-sm ${
                                item.completed
                                  ? "line-through text-red-400"
                                  : "text-red-800 dark:text-red-200"
                              }`}
                            >
                              {item.text}
                            </span>
                            {item.targetBlock && (
                              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                Assigned to Block {item.targetBlock}
                              </div>
                            )}
                            {item.completed && item.completedAt && (
                              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                Completed at{" "}
                                {new Date(
                                  item.completedAt
                                ).toLocaleTimeString()}
                              </div>
                            )}
                          </div>

                          {isEditing && (
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.completed && (
                                <button
                                  onClick={() => undoCompletion(item)}
                                  className="text-orange-600 hover:text-orange-800 p-1"
                                  title="Undo completion"
                                >
                                  ↶
                                </button>
                              )}
                              <button
                                onClick={() => startEditing(item)}
                                className="text-red-600 hover:text-red-800 p-1"
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

                  {/* Add new item for this section */}
                  {isEditing && section.category !== "completed" && (
                    <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-red-200 dark:border-red-700">
                      <input
                        type="text"
                        value={
                          newItemCategory === section.category
                            ? newItemText
                            : ""
                        }
                        onChange={(e) => {
                          setNewItemText(e.target.value);
                          setNewItemCategory(section.category);
                        }}
                        placeholder={`Add new ${section.title.toLowerCase()} habit to break...`}
                        className="flex-1 px-2 py-1 border border-red-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            newItemCategory === section.category
                          ) {
                            addNewItem();
                          }
                        }}
                      />
                      {newItemCategory === section.category && newItemText && (
                        <button
                          onClick={addNewItem}
                          className="text-red-600 hover:text-red-800 px-3 py-1 text-sm"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
