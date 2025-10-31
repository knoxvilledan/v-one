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

  const toggleSection = (category: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleCompleteItem = (item: ChecklistItem) => {
    // Call the parent handler which will handle BOTH:
    // 1. Injecting into TimeBlock as a note
    // 2. Updating the habitBreakChecklist state
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

  const reassignCompletedItem = (
    item: ChecklistItem,
    newTargetBlock: number | undefined
  ) => {
    try {
      console.log("Reassigning habit break item:", {
        itemId: item.id,
        itemText: item.text,
        oldTargetBlock: item.targetBlock,
        newTargetBlock: newTargetBlock,
      });

      const updatedItems = items.map((i) =>
        i.id === item.id
          ? {
              ...i,
              targetBlock: newTargetBlock,
            }
          : i
      );
      onUpdateItems(updatedItems);
    } catch (error) {
      console.error("Error reassigning completed habit break item:", error);
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
      title: "Make this the Biggest Habit to Break",
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

  // Calculate counts based on items with actual content (non-empty text)
  const itemsWithContent = items.filter((item) => item.text.trim() !== "");
  const completedToday = itemsWithContent.filter(
    (item) => item.completed
  ).length;
  const userTargetCount = itemsWithContent.length; // User's customized list size
  const remainingCount = userTargetCount - completedToday;

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
            {completedToday} broken today • {remainingCount} to avoid
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
                            {Array.from({ length: 16 }, (_, index) => (
                              <option key={index} value={index}>
                                Block {index}
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

                          {/* Reassignment dropdown for completed items */}
                          {item.completed && (
                            <div className="flex items-center space-x-2 mr-2">
                              <select
                                value={item.targetBlock || ""}
                                onChange={(e) =>
                                  reassignCompletedItem(
                                    item,
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined
                                  )
                                }
                                className="px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-800 text-white border-gray-600"
                              >
                                <option
                                  value=""
                                  className="bg-gray-800 text-white"
                                >
                                  Auto-assign
                                </option>
                                {Array.from({ length: 16 }, (_, index) => (
                                  <option
                                    key={index}
                                    value={index}
                                    className="bg-gray-800 text-white"
                                  >
                                    Block {index}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

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
