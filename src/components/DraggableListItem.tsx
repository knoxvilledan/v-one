"use client";
import { useState } from "react";
import { ChecklistItem } from "../types";

interface DraggableListItemProps {
  item: ChecklistItem;
  index: number;
  onCompleteItem: (itemId: string) => void;
  onEditItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isEditing: boolean;
  editText: string;
  editTargetBlock?: number;
  editDueDate?: string;
  onEditTextChange: (text: string) => void;
  onEditTargetBlockChange: (block?: number) => void;
  onEditDueDateChange?: (date: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  timeBlockCount: number;
  showDueDate?: boolean;
  formatDueDate?: (dueDate?: string) => string;
  formatCompletionTime?: (completedAt?: Date) => string;
}

export default function DraggableListItem({
  item,
  index,
  onCompleteItem,
  onEditItem,
  onDeleteItem,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isEditing,
  editText,
  editTargetBlock,
  editDueDate,
  onEditTextChange,
  onEditTargetBlockChange,
  onEditDueDateChange,
  onSaveEdit,
  onCancelEdit,
  timeBlockCount,
  showDueDate = false,
  formatDueDate,
  formatCompletionTime,
}: DraggableListItemProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    onDragStart(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!dragOver) {
      setDragOver(true);
      onDragOver(index);
    }
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    onDragEnd();
  };

  const handleDragEnd = () => {
    setDragOver(false);
    onDragEnd();
  };

  return (
    <div
      draggable={!isEditing}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      className={`
        flex items-start justify-between group transition-all duration-200
        ${isDragging ? "opacity-50 scale-95" : ""}
        ${dragOver ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300" : ""}
        ${!isEditing ? "cursor-move" : ""}
        border-l-2 border-transparent hover:border-blue-300 pl-2 py-1
      `}
    >
      <div className="flex items-start space-x-2 flex-1">
        {/* Drag Handle */}
        {!isEditing && (
          <div className="text-gray-400 hover:text-gray-600 cursor-move mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            ⋮⋮
          </div>
        )}

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={item.completed}
          onChange={() => onCompleteItem(item.itemId)}
          className="h-4 w-4 text-blue-600 rounded mt-1 flex-shrink-0"
        />

        {/* Content */}
        {isEditing ? (
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={editText}
              onChange={(e) => onEditTextChange(e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveEdit();
                if (e.key === "Escape") onCancelEdit();
              }}
              autoFocus
            />
            <div className="flex gap-2">
              {showDueDate && onEditDueDateChange && (
                <input
                  type="date"
                  value={editDueDate || ""}
                  onChange={(e) => onEditDueDateChange(e.target.value)}
                  className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
              <select
                value={editTargetBlock || ""}
                onChange={(e) =>
                  onEditTargetBlockChange(
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No block</option>
                {Array.from({ length: timeBlockCount }, (_, i) => (
                  <option key={i} value={i}>
                    Block {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onSaveEdit}
                className="px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                Save
              </button>
              <button
                onClick={onCancelEdit}
                className="px-2 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
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
                  : "text-gray-800 dark:text-gray-200"
              }`}
            >
              {item.text}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
              {item.targetBlock !== undefined && (
                <span>Block {item.targetBlock}</span>
              )}
              {showDueDate && item.dueDate && formatDueDate && (
                <span>Due: {formatDueDate(item.dueDate)}</span>
              )}
              {item.completed && item.completedAt && formatCompletionTime && (
                <span>✓ {formatCompletionTime(item.completedAt)}</span>
              )}
              {item.completionTimezone && (
                <span>{item.completionTimezone}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEditItem(item.itemId)}
          className="text-blue-500 hover:text-blue-700 text-sm p-1"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => onDeleteItem(item.itemId)}
          className="text-red-500 hover:text-red-700 text-sm p-1"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
