import { useState, useEffect, useCallback } from "react";
import { ApiService } from "../lib/api";
import { useAppConfig } from "../hooks/useAppConfig";

interface TimeBlockTemplate {
  id: string;
  time: string;
  label: string;
  order: number;
  duration?: number;
}

interface TimeBlockTemplateManagerProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function TimeBlockTemplateManager({
  isVisible,
  onClose,
}: TimeBlockTemplateManagerProps) {
  const [publicTemplates, setPublicTemplates] = useState<TimeBlockTemplate[]>(
    []
  );
  const [adminTemplates, setAdminTemplates] = useState<TimeBlockTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<"public" | "admin">("public");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editTime, setEditTime] = useState("");
  const [maxTimeBlocks, setMaxTimeBlocks] = useState(24); // Dynamic max from config
  const { getMaxCounts } = useAppConfig();

  const loadMaxCounts = useCallback(async () => {
    try {
      const maxCounts = getMaxCounts();
      setMaxTimeBlocks(maxCounts.timeBlocks);
    } catch (err) {
      console.error("Failed to load max counts:", err);
      // Fallback to default
      setMaxTimeBlocks(24);
    }
  }, [getMaxCounts]);

  useEffect(() => {
    if (isVisible) {
      loadTemplates();
      loadMaxCounts();
    }
  }, [isVisible, loadMaxCounts]);

  const loadTemplates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [publicResult, adminResult] = await Promise.all([
        ApiService.getTimeBlockTemplates("public"),
        ApiService.getTimeBlockTemplates("admin"),
      ]);

      setPublicTemplates(publicResult.timeBlocks || []);
      setAdminTemplates(adminResult.timeBlocks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (index: number, template: TimeBlockTemplate) => {
    setEditingIndex(index);
    setEditLabel(template.label);
    setEditTime(template.time);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditLabel("");
    setEditTime("");
  };

  const saveEdit = async () => {
    if (editingIndex === null) return;

    try {
      await ApiService.updateTimeBlockTemplate(
        editingIndex,
        editLabel,
        activeTab,
        editTime
      );

      // Update the local state
      const templates =
        activeTab === "public" ? publicTemplates : adminTemplates;
      const updatedTemplates = [...templates];
      updatedTemplates[editingIndex] = {
        ...updatedTemplates[editingIndex],
        label: editLabel,
        time: editTime,
      };

      if (activeTab === "public") {
        setPublicTemplates(updatedTemplates);
      } else {
        setAdminTemplates(updatedTemplates);
      }

      cancelEditing();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update template"
      );
    }
  };

  const addNewBlock = async () => {
    const defaultTime = "12:00 PM";
    const defaultLabel = `New Block ${
      (activeTab === "public" ? publicTemplates : adminTemplates).length + 1
    }`;

    try {
      await ApiService.addTimeBlockToTemplate(
        defaultLabel,
        defaultTime,
        activeTab
      );

      await loadTemplates(); // Reload to get the updated templates
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add new block");
    }
  };

  const removeBlock = async (index: number) => {
    if (!confirm("Are you sure you want to delete this time block?")) {
      return;
    }

    try {
      await ApiService.removeTimeBlockFromTemplate(index, activeTab);
      await loadTemplates(); // Reload to get the updated templates
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove block");
    }
  };

  const currentTemplates =
    activeTab === "public" ? publicTemplates : adminTemplates;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Time Block Template Manager</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab("public")}
              className={`px-4 py-2 rounded ${
                activeTab === "public"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Public Template ({publicTemplates.length} blocks)
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-4 py-2 rounded ${
                activeTab === "admin"
                  ? "bg-purple-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Admin Template ({adminTemplates.length} blocks)
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : (
            <div className="space-y-3">
              {currentTemplates.map((template, index) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 flex items-center gap-4"
                >
                  <div className="text-sm text-gray-500 w-8">#{index}</div>

                  {editingIndex === index ? (
                    <>
                      <input
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className="px-2 py-1 border rounded text-sm w-24"
                      />
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                        placeholder="Block label"
                      />
                      <button
                        onClick={saveEdit}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-24 text-sm font-mono">
                        {template.time}
                      </div>
                      <div className="flex-1 text-sm">{template.label}</div>
                      <button
                        onClick={() => startEditing(index, template)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeBlock(index)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        disabled={currentTemplates.length <= 1}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              onClick={addNewBlock}
              disabled={isLoading || currentTemplates.length >= maxTimeBlocks}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              + Add New Block
            </button>

            <div className="text-sm text-gray-600">
              {currentTemplates.length}/{maxTimeBlocks} blocks
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
