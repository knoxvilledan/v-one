"use client";
import { useState, useEffect } from "react";
import { ChecklistItem } from "../types";
import { useAppConfig } from "../hooks/useAppConfig";

interface HabitBreakChecklistProps {
  items: ChecklistItem[];
  onCompleteItem: (itemId: string) => void;
  onUpdateItems: (items: ChecklistItem[]) => void;
}

interface ChecklistSection {
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
    lsd: true,
    financial: true,
    youtube: true,
    time: true,
    entertainment: true,
    completed: false,
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editTargetBlock, setEditTargetBlock] = useState<number | undefined>(
    undefined
  );
  const [newItemText, setNewItemText] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<
    ChecklistItem["category"] | "completed"
  >("lsd");
  const [timeBlockCount, setTimeBlockCount] = useState(18);
  const { getTimeBlockCount } = useAppConfig();

  useEffect(() => {
    const count = getTimeBlockCount();
    setTimeBlockCount(count);
  }, [getTimeBlockCount]);

  // Category definitions for habit breaks
  const categories = [
    { value: "lsd", label: "LSD (Limit Screen Distractions)", emoji: "📱" },
    { value: "financial", label: "Money Wasters", emoji: "💸" },
    { value: "youtube", label: "YouTube Attention Waster", emoji: "📺" },
    { value: "time", label: "Time Wasters", emoji: "⏰" },
    { value: "entertainment", label: "Entertainment", emoji: "🎮" },
  ] as const;

  const sections: ChecklistSection[] = categories.map((cat) => ({
    title: cat.label,
    category: cat.value as ChecklistItem["category"],
    items: items.filter(
      (item) => item.category === cat.value && !item.completed
    ),
  }));

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
    }
  };

  const handleSaveEdit = () => {
    if (editingItemId) {
      const updatedItems = items.map((item) =>
        item.itemId === editingItemId
          ? { ...item, text: editText, targetBlock: editTargetBlock }
          : item
      );
      onUpdateItems(updatedItems);
      setEditingItemId(null);
      setEditText("");
      setEditTargetBlock(undefined);
    }
  };

  const handleAddItem = () => {
    if (newItemText.trim()) {
      const newItem: ChecklistItem = {
        id: `temp-${Date.now()}`,
        itemId: `habit-${Date.now()}`,
        text: newItemText.trim(),
        completed: false,
        category: newItemCategory as ChecklistItem["category"],
      };
      onUpdateItems([...items, newItem]);
      setNewItemText("");
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

  const toggleSectionExpanded = (category: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
        >
          <span>{isExpanded ? "▼" : "▶"}</span>
          <span>🚫 Habit Break Checklist</span>
        </button>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {completedItems}/{totalItems} ({completionPercentage}%)
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
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
                placeholder="Add new habit break..."
                className="flex-1 px-2 py-1 border rounded text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
              />
              <button
                onClick={handleAddItem}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Add
              </button>
            </div>
          </div>

          {/* Sections */}
          {sections.map((section) => (
            <div key={section.category} className="border rounded-lg">
              <button
                onClick={() => toggleSectionExpanded(section.category)}
                className="w-full p-3 text-left flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded-t-lg hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <span className="font-medium">
                  {
                    categories.find((cat) => cat.value === section.category)
                      ?.emoji
                  }{" "}
                  {section.title}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {section.items.length}
                  </span>
                  <span>{expandedSections[section.category] ? "▼" : "▶"}</span>
                </div>
              </button>

              {expandedSections[section.category] && (
                <div className="p-3 space-y-2">
                  {section.items.map((item) => (
                    <div
                      key={item.itemId}
                      className="flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleCompleteItem(item.itemId)}
                          className="h-4 w-4 text-red-600 rounded"
                        />
                        {editingItemId === item.itemId ? (
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="flex-1 px-2 py-1 border rounded text-sm"
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleSaveEdit()
                              }
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
                        ) : (
                          <span
                            className={`flex-1 ${
                              item.completed ? "line-through text-gray-500" : ""
                            }`}
                          >
                            {item.text}
                          </span>
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
              className="w-full p-3 text-left flex justify-between items-center bg-red-50 dark:bg-red-900/20 rounded-t-lg hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              <span className="font-medium">🚫 Completed Items</span>
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
                        className="h-4 w-4 text-red-600 rounded"
                      />
                      <span className="flex-1 line-through text-gray-500">
                        {item.text}
                      </span>
                      {item.completedAt && (
                        <span className="text-xs text-gray-400">
                          {formatCompletionTime(item.completedAt)}
                        </span>
                      )}
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
  );
}
