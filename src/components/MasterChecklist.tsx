"use client";
import { useState, useEffect } from "react";
import { ChecklistItem } from "../types";
import { useAppConfig } from "../hooks/useAppConfig";

interface MasterChecklistProps {
  items: ChecklistItem[];
  onCompleteItem: (itemId: string) => void;
  onUpdateItems: (items: ChecklistItem[]) => void;
  onAddItem?: (text: string, category: string) => Promise<string>;
  onUpdateItem?: (
    itemId: string,
    text?: string,
    category?: string
  ) => Promise<void>;
  onDeleteItem?: (itemId: string) => Promise<void>;
}

interface ChecklistSection {
  title: string;
  category: ChecklistItem["category"] | "completed";
  items: ChecklistItem[];
}

export default function MasterChecklist({
  items,
  onCompleteItem,
  onUpdateItems,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: MasterChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed like HabitBreakChecklist
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    morning: true,
    work: true,
    tech: true,
    house: true,
    wrapup: true,
    completed: false,
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
  >("morning");
  const [timeBlockCount, setTimeBlockCount] = useState(18); // Dynamic from config
  const { getTimeBlockCount } = useAppConfig();

  useEffect(() => {
    // Load dynamic time block count
    const count = getTimeBlockCount();
    setTimeBlockCount(count);
  }, [getTimeBlockCount]);

  // Get current time block based on actual time (dynamic block system)
  const getCurrentTimeBlock = (): number => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    // Convert time to minutes since midnight
    const totalMinutes = hour * 60 + minute;

    // Assuming dynamic blocks of 80 minutes each starting at 4:00 AM (240 minutes)
    // Block 0: 4:00 AM (240 min)
    // Last block depends on timeBlockCount
    const startTime = 240; // 4:00 AM in minutes
    let adjustedMinutes = totalMinutes;

    // Handle time before 4:00 AM (next day's blocks)
    if (totalMinutes < startTime) {
      adjustedMinutes = totalMinutes + 1440; // Add 24 hours
    }

    const blockIndex = Math.floor((adjustedMinutes - startTime) / 90);

    // Ensure we stay within 0-(timeBlockCount-1) range
    return Math.max(0, Math.min(timeBlockCount - 1, blockIndex));
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
      // Uncompleting the item - restore it to the master checklist
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
      console.log("Undoing completion for item:", {
        itemId: item.id,
        itemText: item.text,
        targetBlock: item.targetBlock,
      });

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
      console.log("Reassigning item:", {
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
      console.error("Error reassigning completed item:", error);
    }
  };

  const addNewItem = async () => {
    if (newItemText.trim() && newItemCategory !== "completed") {
      try {
        if (onAddItem) {
          // Use server action to properly persist the item
          const itemId = await onAddItem(newItemText.trim(), newItemCategory);

          // Optimistically update local state
          const newItem: ChecklistItem = {
            id: itemId,
            itemId: itemId,
            text: newItemText.trim(),
            completed: false,
            category: newItemCategory as ChecklistItem["category"],
          };
          onUpdateItems([...items, newItem]);
        } else {
          // Fallback to old behavior if server action not available
          const newItem: ChecklistItem = {
            id: `temp-${Date.now()}`,
            itemId: `temp-${Date.now()}`,
            text: newItemText.trim(),
            completed: false,
            category: newItemCategory as ChecklistItem["category"],
          };
          onUpdateItems([...items, newItem]);
        }
        setNewItemText("");
      } catch (error) {
        console.error("Failed to add item:", error);
        // Show user-friendly error message
        alert("Failed to add item. Please try again.");
      }
    }
  };

  const deleteItem = (id: string) => {
    const updatedItems = items.filter((item) => item.id !== id);
    onUpdateItems(updatedItems);
  };

  // Group items by category
  const sections: ChecklistSection[] = [
    {
      title: "Morning Checklist",
      category: "morning",
      items: items.filter(
        (item) => item.category === "morning" && !item.completed
      ),
    },
    {
      title: "Work Checklist",
      category: "work",
      items: items.filter(
        (item) => item.category === "work" && !item.completed
      ),
    },
    {
      title: "Tech Checklist",
      category: "tech",
      items: items.filter(
        (item) => item.category === "tech" && !item.completed
      ),
    },
    {
      title: "House & Family",
      category: "house",
      items: items.filter(
        (item) => item.category === "house" && !item.completed
      ),
    },
    {
      title: "Wrap up Checklist",
      category: "wrapup",
      items: items.filter(
        (item) => item.category === "wrapup" && !item.completed
      ),
    },
  ];

  // Add completed items section if there are any
  if (items.some((item) => item.completed)) {
    sections.push({
      title: "Completed Items",
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
    <div className="mb-6 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 shadow-md">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg">{isExpanded ? "▼" : "▶"}</span>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Daily Checklist
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completedToday} completed • {remainingCount} remaining
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(!isEditing);
          }}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {isEditing ? "Done" : "Edit"}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-600">
          {sections.map((section) => (
            <div
              key={section.category}
              className="border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              {/* Section Header */}
              <div
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-white dark:hover:bg-gray-750"
                onClick={() => toggleSection(section.category)}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm">
                    {expandedSections[section.category] ? "▼" : "▶"}
                  </span>
                  <h3 className="font-medium text-gray-700 dark:text-gray-300">
                    {section.title}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
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
                        className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
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
                          <select
                            value={editTargetBlock || ""}
                            onChange={(e) =>
                              setEditTargetBlock(
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined
                              )
                            }
                            className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white border-gray-600"
                          >
                            <option value="" className="bg-gray-800 text-white">
                              Auto-assign
                            </option>
                            {Array.from({ length: timeBlockCount }, (_, i) => (
                              <option
                                key={i}
                                value={i}
                                className="bg-gray-800 text-white"
                              >
                                Block {i}
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
                                  ? "line-through text-gray-500"
                                  : "text-gray-800 dark:text-gray-200"
                              }`}
                            >
                              {item.text}
                            </span>
                            {item.targetBlock !== undefined && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Assigned to Block {item.targetBlock}
                              </div>
                            )}
                            {item.completed && item.completedAt && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                                className="px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white border-gray-600"
                              >
                                <option
                                  value=""
                                  className="bg-gray-800 text-white"
                                >
                                  Auto-assign
                                </option>
                                {Array.from(
                                  { length: timeBlockCount },
                                  (_, i) => (
                                    <option
                                      key={i}
                                      value={i}
                                      className="bg-gray-800 text-white"
                                    >
                                      Block {i}
                                    </option>
                                  )
                                )}
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

                  {/* Add new item for this section */}
                  {isEditing && section.category !== "completed" && (
                    <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
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
                        placeholder={`Add new ${section.title.toLowerCase()} item...`}
                        className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="text-blue-600 hover:text-blue-800 px-3 py-1 text-sm"
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
