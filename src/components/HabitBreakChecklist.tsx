"use client";
import { useState, useEffect } from "react";
import { ChecklistItem } from "../types";
import { useAppConfig } from "../hooks/useAppConfig";
import { calculateSimpleCompletionBlock } from "../lib/simple-time-blocks";

interface HabitBreakChecklistProps {
  items: ChecklistItem[];
  onCompleteItem: (itemId: string) => void;
  onUpdateItems: (items: ChecklistItem[]) => void;
}

interface HabitBreakSection {
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

export default function HabitBreakChecklist({
  items,
  onCompleteItem,
  onUpdateItems,
}: HabitBreakChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed like MasterChecklist
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    lsd: true,
    financial: true,
    youtube: true,
    time: true,
    entertainment: true,
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
  >("lsd");
  const [timeBlockCount, setTimeBlockCount] = useState(24); // Dynamic from config (simple time blocks = 24 hours)
  const { getTimeBlockCount } = useAppConfig();

  useEffect(() => {
    // Load dynamic time block count
    const count = getTimeBlockCount();
    setTimeBlockCount(count);
  }, [getTimeBlockCount]);

  // Get current time block based on actual time using simple time blocks (24-hour system)
  const getCurrentTimeBlock = (): number => {
    const now = new Date();
    return calculateSimpleCompletionBlock(now);
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

  const handleAddItem = (category: string) => {
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: `New ${category} habit to break`,
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

  const handleBlockAssignment = (itemId: string, blockIndex: number) => {
    const updatedItems = items.map((item) =>
      item.id === itemId
        ? { ...item, targetBlock: blockIndex === -1 ? undefined : blockIndex }
        : item
    );
    onUpdateItems(updatedItems);
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = items.filter((item) => item.id !== itemId);
    onUpdateItems(updatedItems);
  };

  // Define daily categories for HabitBreakChecklist
  const dailyCategories = [
    {
      value: "lsd",
      label: "🎯 Make this the Biggest Habit to Break",
      emoji: "🎯",
      color: "red",
    },
    {
      value: "financial",
      label: "💰 Financial Waste",
      emoji: "💰",
      color: "red",
    },
    { value: "youtube", label: "📱 Youtube Shorts", emoji: "📱", color: "red" },
    { value: "time", label: "⏰ Time Wasted", emoji: "⏰", color: "red" },
    {
      value: "entertainment",
      label: "🎮 Wasteful Entertainment",
      emoji: "🎮",
      color: "red",
    },
  ];

  const undoCompletion = (item: ChecklistItem) => {
    try {
      console.log("Undoing completion for habit break item:", {
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

  // Group items by category using the new dailyCategories structure
  const sections: HabitBreakSection[] = dailyCategories.map((category) => ({
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
                  <h3 className="font-medium text-red-700 dark:text-red-300 flex items-center gap-1">
                    {section.title}
                    <span className="text-xs text-red-500 dark:text-red-400">
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
                    className="text-xs px-2 py-1 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
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
                        className="mr-3 h-4 w-4 text-red-600 rounded focus:ring-red-500"
                      />

                      {editingItemId === item.id ? (
                        <div className="flex-1 flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="flex-1 px-2 py-1 border border-red-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-600 dark:border-red-500 dark:text-white resize-none overflow-hidden"
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
                            className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-800 text-white border-gray-600"
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
                              className={`text-sm cursor-pointer hover:text-red-600 dark:hover:text-red-400 ${
                                item.completed
                                  ? "line-through text-red-500"
                                  : "text-red-800 dark:text-red-200"
                              }`}
                              title="Click to edit"
                            >
                              {item.text}
                            </span>
                            {item.targetBlock !== undefined && (
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

                          {/* Category dropdown - always visible for easy reassignment */}
                          <div className="flex items-center space-x-2 mr-2">
                            <select
                              value={item.category || ""}
                              onChange={(e) =>
                                handleCategoryChange(item.id, e.target.value)
                              }
                              className="px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-800 text-red-800 dark:text-white border-red-300 dark:border-gray-600 hover:border-red-500"
                              title="Change category"
                            >
                              <option value="" className="text-red-500">
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
                              className="px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-800 text-red-800 dark:text-white border-red-300 dark:border-gray-600 hover:border-red-500"
                              title="Assign to time block"
                            >
                              <option value="" className="text-red-500">
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
                                className="px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-800 text-white border-gray-600"
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
                              className="text-red-600 hover:text-red-800 p-1"
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
