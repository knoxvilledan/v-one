"use client";
import { useState, useRef, useEffect } from "react";
import { ChecklistItem } from "../types";
import { useAppConfig } from "../hooks/useAppConfig";
import { generateOptimizedId } from "../lib/id-generation";

interface WorkoutChecklistProps {
  items: ChecklistItem[];
  onCompleteItem: (itemId: string) => void;
  onUpdateItems: (items: ChecklistItem[]) => void;
  isVisible: boolean;
  isMobile?: boolean;
  currentDate: string; // Current date in YYYY-MM-DD format
  resetPosition?: boolean; // New prop to trigger position reset
  onPositionReset?: () => void; // Callback when position is reset
}

export default function WorkoutChecklist({
  items,
  onCompleteItem,
  onUpdateItems,
  isVisible,
  isMobile = false,
  currentDate, // eslint-disable-line @typescript-eslint/no-unused-vars
  resetPosition = false,
  onPositionReset,
}: WorkoutChecklistProps) {
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasBeenMoved, setHasBeenMoved] = useState(false);
  const [timeBlockCount, setTimeBlockCount] = useState(24); // Dynamic from config (simple time blocks = 24 hours)
  const dragRef = useRef<HTMLDivElement>(null);
  const { getTimeBlockCount } = useAppConfig();

  // Load dynamic time block count
  useEffect(() => {
    const count = getTimeBlockCount();
    setTimeBlockCount(count);
  }, [getTimeBlockCount]);

  // Reset position when resetPosition prop changes
  useEffect(() => {
    if (resetPosition && !isMobile) {
      setPosition({ x: 0, y: 0 });
      setHasBeenMoved(false);
      onPositionReset?.();
    }
  }, [resetPosition, isMobile, onPositionReset]);

  // Handle responsive behavior - reset position when switching to mobile
  useEffect(() => {
    if (isMobile) {
      setPosition({ x: 0, y: 0 });
      setHasBeenMoved(false);
    }
  }, [isMobile]);

  // Handle window resize to keep WorkoutChecklist in bounds
  useEffect(() => {
    const handleResize = () => {
      if (isMobile || !hasBeenMoved) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const elementWidth = dragRef.current?.offsetWidth || 0;
      const elementHeight = dragRef.current?.offsetHeight || 0;

      setPosition((prev) => ({
        x: Math.max(0, Math.min(prev.x, viewportWidth - elementWidth)),
        y: Math.max(0, Math.min(prev.y, viewportHeight - elementHeight)),
      }));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile, hasBeenMoved]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return; // Disable dragging on mobile

    e.preventDefault(); // Prevent text selection
    e.stopPropagation(); // Prevent event bubbling

    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      const currentX = hasBeenMoved ? position.x : rect.left;
      const currentY = hasBeenMoved ? position.y : rect.top;

      setDragOffset({
        x: e.clientX - currentX,
        y: e.clientY - currentY,
      });
      setIsDragging(true);
    }
  };

  // Add event listeners for mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || isMobile) return;

      e.preventDefault(); // Prevent text selection during drag

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Constrain position to viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const elementWidth = dragRef.current?.offsetWidth || 0;
      const elementHeight = dragRef.current?.offsetHeight || 0;

      const constrainedX = Math.max(
        0,
        Math.min(newX, viewportWidth - elementWidth)
      );
      const constrainedY = Math.max(
        0,
        Math.min(newY, viewportHeight - elementHeight)
      );

      setPosition({
        x: constrainedX,
        y: constrainedY,
      });
      setHasBeenMoved(true);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none"; // Prevent text selection during drag
      document.body.style.cursor = "grabbing"; // Global cursor during drag

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.userSelect = ""; // Restore text selection
        document.body.style.cursor = ""; // Restore cursor
      };
    }
  }, [isDragging, dragOffset, isMobile]);

  if (!isVisible) return null;

  const handleAddItem = (category?: string) => {
    // Generate unique ID with enhanced collision resistance
    const existingIds = items.map((item) => item.id);
    const newItem: ChecklistItem = {
      id: generateOptimizedId.workout(existingIds, items.length),
      text: "New workout",
      completed: false,
      category: (category || "cardio") as ChecklistItem["category"], // Default category
    };
    const updatedItems = [...items, newItem];
    onUpdateItems(updatedItems);
    setEditingItemId(newItem.id);
    setEditingText(newItem.text);
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = items.filter((item) => item.id !== itemId);
    onUpdateItems(updatedItems);
  };

  const handleEditStart = (item: ChecklistItem) => {
    setEditingItemId(item.id);
    setEditingText(item.text);
  };

  const handleEditSave = (itemId: string) => {
    if (editingText.trim()) {
      const updatedItems = items.map((item) =>
        item.id === itemId ? { ...item, text: editingText.trim() } : item
      );
      onUpdateItems(updatedItems);
    }
    setEditingItemId(null);
    setEditingText("");
  };

  const handleEditCancel = () => {
    setEditingItemId(null);
    setEditingText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === "Enter") {
      handleEditSave(itemId);
    } else if (e.key === "Escape") {
      handleEditCancel();
    }
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

  // P90X Category definitions based on P90X program structure
  const workoutCategories = [
    {
      value: "strength",
      label: "💪 Strength Training",
      emoji: "💪",
      color: "red",
    },
    {
      value: "cardio",
      label: "❤️ Cardio & Plyometrics",
      emoji: "❤️",
      color: "blue",
    },
    {
      value: "yoga",
      label: "🧘 Yoga & Flexibility",
      emoji: "🧘",
      color: "green",
    },
    {
      value: "stretching",
      label: "🤸 Stretching & Recovery",
      emoji: "🤸",
      color: "purple",
    },
    {
      value: "sports",
      label: "⚽ Sports & Activities",
      emoji: "⚽",
      color: "orange",
    },
    {
      value: "walking",
      label: "🚶 Walking & Light Activity",
      emoji: "🚶",
      color: "gray",
    },
  ];

  // Group items by category for P90X style display
  const groupedItems = workoutCategories.reduce((acc, category) => {
    acc[category.value] = items.filter(
      (item) => item.category === category.value
    );
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;

  return (
    <div
      ref={dragRef}
      className={`workout-checklist-container bg-white dark:bg-gray-800 border border-green-300 dark:border-green-600 rounded-lg shadow-lg ${
        isMobile
          ? "w-full relative"
          : "fixed z-[9998] w-[50%] md:w-[45%] xl:w-[35%]"
      }`}
      style={
        !isMobile
          ? {
              top: hasBeenMoved ? `${position.y}px` : "480px",
              right: hasBeenMoved ? "auto" : "20px",
              left: hasBeenMoved ? `${position.x}px` : "auto",
              transform: hasBeenMoved ? "none" : "none",
              cursor: isDragging ? "grabbing" : "default",
              minWidth: "400px",
              maxWidth: "700px",
            }
          : {}
      }
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-3 border-b border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 ${
          !isMobile ? "cursor-grab active:cursor-grabbing select-none" : ""
        } ${isDragging ? "cursor-grabbing" : ""}`}
        onMouseDown={handleMouseDown}
        style={{ userSelect: "none" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💪</span>
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
            P90X Workout Tracker
          </h3>
          {!isMobile && (
            <span className="text-xs text-green-600 dark:text-green-400">
              (drag to move)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-green-600 dark:text-green-400">
            {completedCount}/{totalCount}
          </span>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-800"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            <svg
              className={`w-4 h-4 transition-transform text-green-600 dark:text-green-400 ${
                isCollapsed ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-3 max-h-[600px] overflow-y-auto">
          {/* P90X Workout Categories */}
          {workoutCategories.map((category) => {
            const categoryItems = groupedItems[category.value] || [];
            const completedCategoryItems = categoryItems.filter(
              (item) => item.completed
            );
            const pendingCategoryItems = categoryItems.filter(
              (item) => !item.completed
            );

            return (
              <div key={category.value} className="mb-4">
                {/* Category Header */}
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    {category.label}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({completedCategoryItems.length}/{categoryItems.length})
                    </span>
                  </h4>
                  <button
                    onClick={() => handleAddItem(category.value)}
                    className="text-xs px-2 py-1 text-green-600 dark:text-green-400 border border-green-300 dark:border-green-600 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  >
                    + Add {category.label.split(" ")[1]}
                  </button>
                </div>

                {/* Pending Items for this category */}
                <div className="space-y-1 mb-2">
                  {pendingCategoryItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2 border-l-4 border-${category.color}-400 bg-gray-50 dark:bg-gray-700 rounded`}
                    >
                      {/* First row - Checkbox, emoji, and editable text */}
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => onCompleteItem(item.id)}
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 flex-shrink-0"
                        />

                        <span className="text-lg flex-shrink-0">
                          {category.emoji}
                        </span>

                        <div className="flex-1 min-w-0 overflow-hidden">
                          {editingItemId === item.id ? (
                            <input
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onBlur={() => handleEditSave(item.id)}
                              onKeyDown={(e) => handleKeyPress(e, item.id)}
                              className="w-full px-2 py-1 text-sm border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-600 dark:border-green-500 dark:text-white resize-none overflow-hidden"
                              autoFocus
                              style={{
                                minHeight: "28px",
                                maxHeight: "28px",
                                lineHeight: "1.2",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                              }}
                            />
                          ) : (
                            <span
                              onClick={() => handleEditStart(item)}
                              className="cursor-pointer text-sm hover:text-green-600 dark:hover:text-green-400 block truncate"
                              title={item.text}
                            >
                              {item.text}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Second row - Controls in mobile-friendly layout */}
                      <div
                        className={`flex gap-2 ${
                          isMobile ? "flex-col space-y-2" : "items-center"
                        }`}
                      >
                        {/* Category Dropdown */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-600 dark:text-gray-400 min-w-0">
                            Type:
                          </label>
                          <select
                            value={item.category || "cardio"}
                            onChange={(e) =>
                              handleCategoryChange(item.id, e.target.value)
                            }
                            className={`px-2 py-1 text-xs border border-green-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-600 dark:border-green-500 dark:text-white ${
                              isMobile ? "flex-1" : "w-28"
                            }`}
                          >
                            {workoutCategories.map((cat) => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label.split(" ")[1]}{" "}
                                {/* Remove emoji for dropdown */}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Block Assignment Dropdown */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-600 dark:text-gray-400 min-w-0">
                            Block:
                          </label>
                          <select
                            value={item.targetBlock ?? ""}
                            onChange={(e) =>
                              handleBlockAssignment(
                                item.id,
                                e.target.value ? parseInt(e.target.value) : -1
                              )
                            }
                            className={`px-2 py-1 text-xs border border-green-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-600 dark:border-green-500 dark:text-white ${
                              isMobile ? "flex-1" : "w-20"
                            }`}
                          >
                            <option value="">Auto</option>
                            {Array.from({ length: timeBlockCount }, (_, i) => (
                              <option key={i} value={i}>
                                Block {i}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Delete Button */}
                        <div
                          className={`flex ${
                            isMobile ? "justify-center" : "justify-end"
                          }`}
                        >
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete workout"
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
                      </div>
                    </div>
                  ))}
                </div>

                {/* Completed Items for this category */}
                {completedCategoryItems.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {completedCategoryItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded opacity-75"
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => onCompleteItem(item.id)}
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="text-lg">{category.emoji}</span>
                        <span className="flex-1 text-sm text-green-600 dark:text-green-400 line-through">
                          {item.text}
                        </span>
                        <span className="text-xs text-green-500 dark:text-green-500">
                          {item.completedAt?.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Overall Progress */}
          {totalCount > 0 && (
            <div className="mt-4 pt-3 border-t border-green-200 dark:border-green-700">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">P90X Progress:</span>
                <span className="font-bold text-lg">
                  {completedCount}/{totalCount} (
                  {Math.round((completedCount / totalCount) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
