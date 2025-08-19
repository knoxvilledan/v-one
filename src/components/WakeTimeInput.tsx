import { useState } from "react";
import { isValidWakeTime } from "../lib/time-block-calculator";

interface WakeTimeInputProps {
  currentWakeTime: string;
  onWakeTimeChange: (wakeTime: string) => void;
  date: string;
}

export default function WakeTimeInput({
  currentWakeTime,
  onWakeTimeChange,
  date,
}: WakeTimeInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempWakeTime, setTempWakeTime] = useState(currentWakeTime);
  const [error, setError] = useState<string>("");

  const handleSave = () => {
    if (!tempWakeTime.trim()) {
      // Allow clearing the wake time
      onWakeTimeChange("");
      setIsEditing(false);
      setError("");
      return;
    }

    if (!isValidWakeTime(tempWakeTime)) {
      setError("Please enter a valid time in HH:MM format (24-hour)");
      return;
    }

    onWakeTimeChange(tempWakeTime);
    setIsEditing(false);
    setError("");
  };

  const handleCancel = () => {
    setTempWakeTime(currentWakeTime);
    setIsEditing(false);
    setError("");
  };

  const formatDisplayTime = (time: string) => {
    if (!time) return "Not set";

    try {
      const [hours, minutes] = time.split(":");
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? "PM" : "AM";
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-blue-900 mb-1">
            Wake Time for {new Date(date).toLocaleDateString()}
          </h3>
          {!isEditing ? (
            <div className="flex items-center gap-2">
              <span className="text-blue-700">
                {formatDisplayTime(currentWakeTime)}
              </span>
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                {currentWakeTime ? "Change" : "Set"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tempWakeTime}
                onChange={(e) => setTempWakeTime(e.target.value)}
                placeholder="HH:MM (24-hour format, e.g., 03:30)"
                className="px-2 py-1 border border-blue-300 rounded text-sm w-40"
                autoFocus
              />
              <button
                onClick={handleSave}
                className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-2 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {currentWakeTime && (
          <div className="text-xs text-blue-600">
            <p>
              Early-morning completions ({formatDisplayTime(currentWakeTime)} -
              4:59 AM)
            </p>
            <p>will go to the 4:00 a.m. block</p>
          </div>
        )}
      </div>

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}

      {!currentWakeTime && !isEditing && (
        <div className="mt-2 text-xs text-blue-600">
          Set a wake time to enable early-morning special assignment rules
        </div>
      )}
    </div>
  );
}
