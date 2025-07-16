import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatDisplayDate,
  formatStorageDate,
  parseStorageDate,
  addDays,
  getTodayStorageDate,
  getRelativeDateDescription,
} from "../lib/date-utils";

interface DateNavigationProps {
  currentDate: string; // YYYY-MM-DD format
}

export default function DateNavigation({ currentDate }: DateNavigationProps) {
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const currentDateObj = parseStorageDate(currentDate);
  const displayDate = formatDisplayDate(currentDateObj);
  const relativeDate = getRelativeDateDescription(currentDate);

  const navigateToDate = (date: Date) => {
    const dateString = formatStorageDate(date);
    router.push(`/${dateString}`);
  };

  const goToPrevious = () => {
    const previousDate = addDays(currentDateObj, -1);
    navigateToDate(previousDate);
  };

  const goToNext = () => {
    const nextDate = addDays(currentDateObj, 1);
    navigateToDate(nextDate);
  };

  const goToToday = () => {
    const today = new Date();
    navigateToDate(today);
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    navigateToDate(selectedDate);
    setShowDatePicker(false);
  };

  const isToday = currentDate === getTodayStorageDate();

  return (
    <div className="mb-4 border border-gray-400 shadow-md px-3 py-2 rounded-lg bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Previous Day Button */}
          <button
            onClick={goToPrevious}
            className="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
            title="Previous day"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Date Display */}
          <div className="flex flex-col items-center -space-y-0.5">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="text-base font-semibold hover:text-blue-600 cursor-pointer leading-tight"
              title="Click to change date"
            >
              {displayDate}
            </button>
            <span className="text-xs text-gray-600 leading-tight">
              {relativeDate}
            </span>
          </div>

          {/* Next Day Button */}
          <button
            onClick={goToNext}
            className="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
            title="Next day"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Today Button */}
        {!isToday && (
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Today
          </button>
        )}

        {/* Date Picker */}
        {showDatePicker && (
          <div className="absolute z-10 mt-2 bg-white border rounded-lg shadow-lg p-4">
            <input
              type="date"
              value={currentDate}
              onChange={handleDatePickerChange}
              className="border rounded px-3 py-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}
