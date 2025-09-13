"use client";
import { useState, useEffect } from "react";
import { ChecklistItem } from "../types";
import { useAppConfig } from "../hooks/useAppConfig";

interface MasterChecklistProps {
  items: ChecklistItem[];
  onCompleteItem: (itemId: string) => void;
  onUpdateItems: (items: ChecklistItem[]) => void;
}

interface ChecklistSection {
  title: string;
  category: ChecklistItem["category"] | "completed";
  items: ChecklistItem[];
  categoryData?: {
    value: string;
    label: string;
    emoji: string;
    color: string;
  };
}

export default function MasterChecklist({
  items,
  onCompleteItem,
  onUpdateItems,
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
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
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

  // Daily productivity categories with emojis and blue theme
  const dailyCategories = [
    {
      value: "morning",
      label: "🌅 Morning Routine",
      emoji: "🌅",
      color: "blue",
    },
    {
      value: "work",
      label: "💼 Work Tasks",
      emoji: "💼",
      color: "indigo",
    },
    {
      value: "tech",
      label: "💻 Tech & Development",
      emoji: "💻",
      color: "cyan",
    },
    {
      value: "house",
      label: "🏠 House & Family",
      emoji: "🏠",
      color: "teal",
    },
    {
      value: "wrapup",
      label: "🌙 Evening Wrap-up",
      emoji: "🌙",
      color: "purple",
    },
  ];

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
    setEditingText(item.text);
    setEditTargetBlock(item.targetBlock);
  };

  const saveEdit = () => {
    if (editingText.trim()) {
      const updatedItems = items.map((item) =>
        item.id === editingItemId
          ? { ...item, text: editingText.trim(), targetBlock: editTargetBlock }
          : item
      );
      onUpdateItems(updatedItems);
    }
    setEditingItemId(null);
    setEditingText("");
    setEditTargetBlock(undefined);
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditingText("");
    setEditTargetBlock(undefined);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
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

  const handleAddItem = (category: string) => {
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: "New task",
      completed: false,
      category: category as ChecklistItem["category"],
    };
    onUpdateItems([...items, newItem]);
  };

  const handleCategoryChange = (itemId: string, newCategory: string) => {
    const updatedItems = items.map((item) =>
      item.id === itemId
        ? { ...item, category: newCategory as ChecklistItem["category"] }
        : item
    );
    onUpdateItems(updatedItems);
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = items.filter((item) => item.id !== itemId);
    onUpdateItems(updatedItems);
  };

  const handleBlockAssignment = (itemId: string, blockIndex: number) => {
    const updatedItems = items.map((item) =>
      item.id === itemId
        ? { ...item, targetBlock: blockIndex === -1 ? undefined : blockIndex }
        : item
    );
    onUpdateItems(updatedItems);
  };

  // Group items by category using the new dailyCategories structure
  const sections: ChecklistSection[] = dailyCategories.map((category) => ({
    title: category.label,
    category: category.value as ChecklistItem["category"],
    items: items.filter(
      (item) => item.category === category.value && !item.completed
    ),
    categoryData: category, // Add category data for styling and emojis
  }));

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
                className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800/30"
                onClick={() => toggleSection(section.category)}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    {expandedSections[section.category] ? "▼" : "▶"}
                  </span>
                  <h3 className="font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1">
                    {section.title}
                    <span className="text-xs text-blue-500 dark:text-blue-400">
                      ({section.items.length})
                    </span>
                  </h3>
                </div>
                {section.categoryData && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddItem(section.categoryData!.value);
                    }}
                    className="text-xs px-2 py-1 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    + Add {section.categoryData!.label.split(" ")[1]}
                  </button>
                )}
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
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-blue-500 dark:text-white resize-none overflow-hidden"
                            onKeyDown={(e) => handleKeyPress(e)}
                            onBlur={() => saveEdit()}
                            autoFocus
                            style={{
                              minHeight: "28px",
                              maxHeight: "28px",
                              lineHeight: "1.2",
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                            }}
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
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-between">
                          <div className="flex-1">
                            <span
                              onClick={() => startEditing(item)}
                              className={`text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 ${
                                item.completed
                                  ? "line-through text-gray-500"
                                  : "text-gray-800 dark:text-gray-200"
                              }`}
                              title="Click to edit"
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

                          {/* Category dropdown - always visible for easy reassignment */}
                          <div className="flex items-center space-x-2 mr-2">
                            <select
                              value={item.category || ""}
                              onChange={(e) =>
                                handleCategoryChange(item.id, e.target.value)
                              }
                              className="px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-blue-300 dark:border-gray-600 hover:border-blue-500"
                              title="Change category"
                            >
                              <option value="" className="text-gray-500">
                                Select category...
                              </option>
                              {dailyCategories.map((cat) => (
                                <option
                                  key={cat.value}
                                  value={cat.value}
                                  className="dark:bg-gray-800 dark:text-white"
                                >
                                  {cat.emoji} {cat.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Time Block Assignment dropdown - always visible */}
                          <div className="flex items-center space-x-2 mr-2">
                            <select
                              value={item.targetBlock ?? ""}
                              onChange={(e) =>
                                handleBlockAssignment(
                                  item.id,
                                  e.target.value ? parseInt(e.target.value) : -1
                                )
                              }
                              className="px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-blue-300 dark:border-gray-600 hover:border-blue-500"
                              title="Assign to time block"
                            >
                              <option value="" className="text-gray-500">
                                Auto-assign
                              </option>
                              {Array.from(
                                { length: timeBlockCount },
                                (_, i) => (
                                  <option
                                    key={i}
                                    value={i}
                                    className="dark:bg-gray-800 dark:text-white"
                                  >
                                    Block {i}
                                  </option>
                                )
                              )}
                            </select>
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

                          {/* Delete Button - Always visible like WorkoutChecklist/TodoList */}
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Delete item"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>

                          {/* Edit buttons - Always visible like WorkoutChecklist/TodoList */}
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
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add new item for this section */}
                  {section.category !== "completed" && (
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
