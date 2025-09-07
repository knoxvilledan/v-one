"use client";
import { useState, useEffect } from "react";
import { ChecklistItem } from "../types";
import { useAppConfig } from "../hooks/useAppConfig";

interface TodoListProps {
  items: ChecklistItem[];
  onCompleteItem: (itemId: string) => void;
  onUpdateItems: (items: ChecklistItem[]) => void;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  date: string; // Current date for due date tracking
}

interface ChecklistSection {
  title: string;
  category: ChecklistItem["category"] | "completed" | "overdue";
  items: ChecklistItem[];
}

export default function TodoList({
  items,
  onCompleteItem,
  onUpdateItems,
  isVisible = false,
  onToggleVisibility,
  date,
}: TodoListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    general: true,
    family: true,
    household: true,
    financial: true,
    budget: true,
    overdue: true,
    completed: false,
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editTargetBlock, setEditTargetBlock] = useState<number | undefined>(
    undefined
  );
  const [editDueDate, setEditDueDate] = useState("");
  const [newItemText, setNewItemText] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<
    ChecklistItem["category"] | "completed"
  >("general");
  const [newItemDueDate, setNewItemDueDate] = useState("");
  const [timeBlockCount, setTimeBlockCount] = useState(18);
  const [position, setPosition] = useState({ x: 200, y: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { getTimeBlockCount } = useAppConfig();

  useEffect(() => {
    const count = getTimeBlockCount();
    setTimeBlockCount(count);

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, [getTimeBlockCount]);

  // Category definitions for todo items
  const categories = [
    { value: "general", label: "General", emoji: "📝" },
    { value: "family", label: "Family", emoji: "👨‍👩‍👧‍👦" },
    { value: "household", label: "Household", emoji: "🏠" },
    { value: "financial", label: "Financial", emoji: "💰" },
    { value: "budget", label: "Budget", emoji: "📊" },
  ] as const;

  // Helper function to check if item is overdue
  const isOverdue = (item: ChecklistItem): boolean => {
    if (!item.dueDate || item.completed) return false;
    return new Date(item.dueDate) < new Date(date);
  };

  // Filter items by category and status
  const overdueItems = items.filter((item) => isOverdue(item));

  const sections: ChecklistSection[] = categories.map((cat) => ({
    title: cat.label,
    category: cat.value as ChecklistItem["category"],
    items: items.filter(
      (item) =>
        item.category === cat.value && !item.completed && !isOverdue(item)
    ),
  }));

  // Add overdue section if there are overdue items
  if (overdueItems.length > 0) {
    sections.unshift({
      title: "Overdue Items",
      category: "overdue",
      items: overdueItems,
    });
  }

  const completedSection: ChecklistSection = {
    title: "Completed Items",
    category: "completed",
    items: items.filter((item) => item.completed),
  };

  const pendingItems = sections.reduce(
    (acc, section) => acc + section.items.length,
    0
  );
  const completedItems = completedSection.items.length;
  const totalItems = pendingItems + completedItems;
  const completionPercentage =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const handleCompleteItem = (itemId: string) => {
    const item = items.find((i) => i.itemId === itemId);
    if (item) {
      const now = new Date();
      const updatedItems = items.map((i) =>
        i.itemId === itemId
          ? {
              ...i,
              completed: !i.completed,
              completedAt: !i.completed ? now : undefined,
              completionTimezone: !i.completed
                ? Intl.DateTimeFormat().resolvedOptions().timeZone
                : undefined,
            }
          : i
      );
      onUpdateItems(updatedItems);
      onCompleteItem(itemId);
    }
  };

  const handleEditItem = (itemId: string) => {
    const item = items.find((i) => i.itemId === itemId);
    if (item) {
      setEditingItemId(itemId);
      setEditText(item.text);
      setEditTargetBlock(item.targetBlock);
      setEditDueDate(item.dueDate || "");
    }
  };

  const handleSaveEdit = () => {
    if (editingItemId) {
      const updatedItems = items.map((item) =>
        item.itemId === editingItemId
          ? {
              ...item,
              text: editText,
              targetBlock: editTargetBlock,
              dueDate: editDueDate || undefined,
            }
          : item
      );
      onUpdateItems(updatedItems);
      setEditingItemId(null);
      setEditText("");
      setEditTargetBlock(undefined);
      setEditDueDate("");
    }
  };

  const handleAddItem = () => {
    if (newItemText.trim()) {
      const newItem: ChecklistItem = {
        id: `temp-${Date.now()}`,
        itemId: `todo-${Date.now()}`,
        text: newItemText.trim(),
        completed: false,
        category: newItemCategory as ChecklistItem["category"],
        dueDate: newItemDueDate || undefined,
      };
      onUpdateItems([...items, newItem]);
      setNewItemText("");
      setNewItemDueDate("");
    }
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = items.filter((item) => item.itemId !== itemId);
    onUpdateItems(updatedItems);
  };

  const formatCompletionTime = (completedAt?: Date) => {
    if (!completedAt) return "";
    return completedAt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return "";
    const due = new Date(dueDate);
    const today = new Date(date);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    return `${diffDays} days`;
  };

  const toggleSectionExpanded = (category: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMobile) {
      setIsDragging(true);
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      const handleMouseMove = (e: MouseEvent) => {
        setPosition({
          x: e.clientX - offsetX,
          y: e.clientY - offsetY,
        });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
  };

  if (!isVisible) {
    return null;
  }

  const containerClass = isMobile
    ? "w-full mb-6"
    : "fixed bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg resize overflow-auto min-w-96 max-w-2xl min-h-96 max-h-screen z-50";

  const containerStyle = isMobile
    ? {}
    : {
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "grab",
      };

  return (
    <div className={containerClass} style={containerStyle}>
      {!isMobile && (
        <div
          className="bg-gray-100 dark:bg-gray-700 p-2 cursor-grab flex justify-between items-center rounded-t-lg"
          onMouseDown={handleMouseDown}
        >
          <span className="font-medium">📝 Todo List</span>
          <button
            onClick={onToggleVisibility}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      )}

      <div className="p-4">
        {isMobile && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">📝 Todo List</h2>
            {onToggleVisibility && (
              <button
                onClick={onToggleVisibility}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            )}
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <span>{isExpanded ? "▼" : "▶"}</span>
            <span>Todo List</span>
          </button>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {completedItems}/{totalItems} ({completionPercentage}%)
            {overdueItems.length > 0 && (
              <span className="ml-2 text-red-500">
                {overdueItems.length} overdue
              </span>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            {/* Add New Item */}
            <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
              <div className="flex gap-2 mb-2">
                <select
                  value={newItemCategory}
                  onChange={(e) =>
                    setNewItemCategory(
                      e.target.value as ChecklistItem["category"]
                    )
                  }
                  className="px-2 py-1 border rounded text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Add new todo..."
                  className="flex-1 px-2 py-1 border rounded text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                />
                <input
                  type="date"
                  value={newItemDueDate}
                  onChange={(e) => setNewItemDueDate(e.target.value)}
                  className="px-2 py-1 border rounded text-sm"
                />
                <button
                  onClick={handleAddItem}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Sections */}
            {sections.map((section) => (
              <div
                key={section.category}
                className={`border rounded-lg ${
                  section.category === "overdue"
                    ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                    : ""
                }`}
              >
                <button
                  onClick={() => toggleSectionExpanded(section.category)}
                  className={`w-full p-3 text-left flex justify-between items-center rounded-t-lg hover:bg-gray-100 dark:hover:bg-gray-600 ${
                    section.category === "overdue"
                      ? "bg-red-100 dark:bg-red-900/40"
                      : "bg-gray-50 dark:bg-gray-700"
                  }`}
                >
                  <span className="font-medium">
                    {section.category === "overdue"
                      ? "⚠️"
                      : categories.find((cat) => cat.value === section.category)
                          ?.emoji}{" "}
                    {section.title}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {section.items.length}
                    </span>
                    <span>
                      {expandedSections[section.category] ? "▼" : "▶"}
                    </span>
                  </div>
                </button>

                {expandedSections[section.category] && (
                  <div className="p-3 space-y-2">
                    {section.items.map((item) => (
                      <div
                        key={item.itemId}
                        className="flex items-start justify-between group"
                      >
                        <div className="flex items-start space-x-2 flex-1">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleCompleteItem(item.itemId)}
                            className="h-4 w-4 text-blue-600 rounded mt-1"
                          />
                          {editingItemId === item.itemId ? (
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm"
                                onKeyDown={(e) =>
                                  e.key === "Enter" && handleSaveEdit()
                                }
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <input
                                  type="date"
                                  value={editDueDate}
                                  onChange={(e) =>
                                    setEditDueDate(e.target.value)
                                  }
                                  className="px-2 py-1 border rounded text-sm"
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
                                  className="px-2 py-1 border rounded text-sm"
                                >
                                  <option value="">No block</option>
                                  {Array.from(
                                    { length: timeBlockCount },
                                    (_, i) => (
                                      <option key={i} value={i}>
                                        Block {i + 1}
                                      </option>
                                    )
                                  )}
                                </select>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSaveEdit}
                                  className="px-2 py-1 bg-green-500 text-white rounded text-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingItemId(null)}
                                  className="px-2 py-1 bg-gray-500 text-white rounded text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1">
                              <div
                                className={`${
                                  item.completed
                                    ? "line-through text-gray-500"
                                    : ""
                                } ${
                                  isOverdue(item)
                                    ? "text-red-600 font-medium"
                                    : ""
                                }`}
                              >
                                {item.text}
                              </div>
                              {item.dueDate && (
                                <div
                                  className={`text-xs mt-1 ${
                                    isOverdue(item)
                                      ? "text-red-500"
                                      : "text-gray-500"
                                  }`}
                                >
                                  Due: {formatDueDate(item.dueDate)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditItem(item.itemId)}
                            className="text-blue-500 hover:text-blue-700 text-sm"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.itemId)}
                            className="text-red-500 hover:text-red-700 text-sm"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Completed Items Section */}
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSectionExpanded("completed")}
                className="w-full p-3 text-left flex justify-between items-center bg-green-50 dark:bg-green-900/20 rounded-t-lg hover:bg-green-100 dark:hover:bg-green-900/40"
              >
                <span className="font-medium">✅ Completed Items</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {completedSection.items.length}
                  </span>
                  <span>{expandedSections.completed ? "▼" : "▶"}</span>
                </div>
              </button>

              {expandedSections.completed && (
                <div className="p-3 space-y-2">
                  {completedSection.items.map((item) => (
                    <div
                      key={item.itemId}
                      className="flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleCompleteItem(item.itemId)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <div className="flex-1">
                          <span className="line-through text-gray-500">
                            {item.text}
                          </span>
                          {item.completedAt && (
                            <span className="text-xs text-gray-400 ml-2">
                              {formatCompletionTime(item.completedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.itemId)}
                        className="text-red-500 hover:text-red-700 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
