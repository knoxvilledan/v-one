import { useState } from "react";

interface EditableTimeBlockLabelProps {
  blockIndex: number;
  currentLabel: string;
  onLabelUpdate?: (blockIndex: number, newLabel: string) => void;
  onError?: (error: string) => void;
  isAdmin?: boolean;
}

export default function EditableTimeBlockLabel({
  blockIndex,
  currentLabel,
  onLabelUpdate,
  onError,
  isAdmin = false,
}: EditableTimeBlockLabelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(currentLabel);
  const [isSaving, setIsSaving] = useState(false);
  const [showTemplateOptions, setShowTemplateOptions] = useState(false);

  const handleSave = async () => {
    const trimmedText = editText.trim();

    if (trimmedText === currentLabel) {
      setIsEditing(false);
      return;
    }

    if (trimmedText.length === 0) {
      onError?.("Label cannot be empty");
      setEditText(currentLabel);
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    try {
      // Use the parent's onLabelUpdate callback instead of API call
      // The parent component will handle saving via server actions
      onLabelUpdate?.(blockIndex, trimmedText);
      setIsEditing(false);
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : "Failed to update label"
      );
      setEditText(currentLabel);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditText(currentLabel);
    setIsEditing(false);
    setShowTemplateOptions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const updateTemplate = async () => {
    if (!isAdmin) return;

    setIsSaving(true);
    try {
      // TODO: Implement template update with server actions
      // For now, just update the label since user editing should work
      onLabelUpdate?.(blockIndex, editText.trim());
      setShowTemplateOptions(false);
      setIsEditing(false);
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : "Failed to update template"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            disabled={isSaving}
          />
          <button
            onClick={handleSave}
            disabled={isSaving || editText.trim().length === 0}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            {isSaving ? "..." : "✓"}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            ✕
          </button>
        </div>

        {/* Admin Template Update Options */}
        {isAdmin && (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setShowTemplateOptions(!showTemplateOptions)}
              className="text-xs text-blue-600 hover:text-blue-800 text-left"
              disabled={isSaving}
            >
              🔧 Update Template
            </button>

            {showTemplateOptions && (
              <div className="flex gap-2 items-center text-xs">
                <span className="text-gray-600">Update:</span>
                <button
                  onClick={() => updateTemplate()}
                  disabled={isSaving}
                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                >
                  Public Template
                </button>
                <button
                  onClick={() => updateTemplate()}
                  disabled={isSaving}
                  className="px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300"
                >
                  Admin Template
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
      onClick={() => setIsEditing(true)}
    >
      <span className="flex-1 font-semibold text-sm">{currentLabel}</span>
      <span className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
        ✏️ Click to edit
      </span>
    </div>
  );
}
