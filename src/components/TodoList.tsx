"use client";
import { useState, useRef, useEffect } from "react";
import { ChecklistItem } from "../types";
import { useAppConfig } from "../hooks/useAppConfig";

interface TodoListProps {
  items: ChecklistItem[];
  onCompleteItem: (itemId: string) => void;
  onUpdateItems: (items: ChecklistItem[]) => void;
  isVisible: boolean;
  isMobile?: boolean;
  currentDate: string; // Current date in YYYY-MM-DD format
  resetPosition?: boolean; // New prop to trigger position reset
  onPositionReset?: () => void; // Callback when position is reset
}

export default function TodoList({
  items,
  onCompleteItem,
  onUpdateItems,
  isVisible,
  isMobile = false,
  currentDate,
  resetPosition = false,
  onPositionReset,
}: TodoListProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasBeenMoved, setHasBeenMoved] = useState(false);
  const [timeBlockCount, setTimeBlockCount] = useState(18); // Dynamic from config
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

  // Handle window resize to keep TodoList in bounds
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

  const handleAddItem = () => {
    const newItem: ChecklistItem = {
      id: `todo-${Date.now()}`,
      text: "New task",
      completed: false,
      category: "todo",
      dueDate: currentDate, // Set due date to current date by default
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

  const handleBlockAssignment = (itemId: string, blockIndex: number) => {
    const updatedItems = items.map((item) =>
      item.id === itemId
        ? { ...item, targetBlock: blockIndex === -1 ? undefined : blockIndex }
        : item
    );
    onUpdateItems(updatedItems);
  };

  const handleDateChange = (itemId: string, newDate: string) => {
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, dueDate: newDate } : item
    );
    onUpdateItems(updatedItems);
  };

  // Filter items to only show those for the current date or overdue
  const getCurrentDateItems = () => {
    const today = new Date(currentDate);
    return items.filter((item) => {
      if (!item.dueDate) return true; // Items without due date show on current day
      const itemDate = new Date(item.dueDate);
      return itemDate <= today; // Show items due today or overdue
    });
  };

  const filteredItems = getCurrentDateItems();
  const completedItems = filteredItems.filter((item) => item.completed);
  const pendingItems = filteredItems.filter((item) => !item.completed);

  return (
    <div
      ref={dragRef}
      className={`todo-list-container bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg ${
        isMobile
          ? "w-full relative"
          : "fixed z-[9999] w-[50%] md:w-[45%] xl:w-[35%]"
      }`}
      style={
        !isMobile
          ? {
              top: hasBeenMoved ? `${position.y}px` : "380px",
              left: hasBeenMoved ? `${position.x}px` : "50%",
              transform: hasBeenMoved ? "none" : "translateX(-50%)",
              cursor: isDragging ? "grabbing" : "default",
              minWidth: "400px",
              maxWidth: "700px",
            }
          : {}
      }
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 ${
          !isMobile ? "cursor-grab active:cursor-grabbing select-none" : ""
        } ${isDragging ? "cursor-grabbing" : ""}`}
        onMouseDown={handleMouseDown}
        style={{ userSelect: "none" }}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">To-Do List</h3>
          {!isMobile && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              (drag to move)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            <svg
              className={`w-4 h-4 transition-transform ${
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
        <div className="p-3 max-h-[500px] overflow-y-auto">
          {/* Pending Items */}
          <div className="space-y-2 mb-4">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => onCompleteItem(item.id)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  {editingItemId === item.id ? (
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={() => handleEditSave(item.id)}
                      onKeyDown={(e) => handleKeyPress(e, item.id)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      autoFocus
                    />
                  ) : (
                    <div>
                      <span
                        onClick={() => handleEditStart(item)}
                        className="cursor-pointer text-sm hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {item.text}
                      </span>
                      {item.dueDate && item.dueDate !== currentDate && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Due: {new Date(item.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Date Picker - Made smaller */}
                <input
                  type="date"
                  value={item.dueDate || currentDate}
                  onChange={(e) => handleDateChange(item.id, e.target.value)}
                  className="px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white w-24 flex-shrink-0"
                  title="Due date"
                />

                {/* Block Assignment Dropdown - Made smaller */}
                <select
                  value={item.targetBlock ?? ""}
                  onChange={(e) =>
                    handleBlockAssignment(
                      item.id,
                      e.target.value ? parseInt(e.target.value) : -1
                    )
                  }
                  className="px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white w-20 flex-shrink-0"
                >
                  <option value="">Auto</option>
                  {Array.from({ length: timeBlockCount }, (_, i) => (
                    <option key={i} value={i}>
                      Block {i}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0"
                  title="Delete task"
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
            ))}
          </div>

          {/* Completed Items */}
          {completedItems.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Completed ({completedItems.length})
              </h4>
              <div className="space-y-1">
                {completedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => onCompleteItem(item.id)}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="flex-1 text-sm text-gray-600 dark:text-gray-400 line-through">
                      {item.text}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {item.completedAt?.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Item Button */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleAddItem}
              className="w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              + Add New Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
