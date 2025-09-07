"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import DateNavigation from "./DateNavigation";
import WakeTimeInput from "./WakeTimeInput";

interface HeaderProps {
  date: string;
  wakeTime: string;
  onWakeTimeChange: (wakeTime: string) => void;
  onShowTodo: () => void;
  onShowWorkout: () => void;
  isTodoVisible: boolean;
  isWorkoutVisible: boolean;
}

export default function Header({
  date,
  wakeTime,
  onWakeTimeChange,
  onShowTodo,
  onShowWorkout,
  isTodoVisible,
  isWorkoutVisible,
}: HeaderProps) {
  const { data: session } = useSession();
  const [isWakeTimeEditing, setIsWakeTimeEditing] = useState(false);

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "numeric",
      day: "numeric",
      year: "2-digit",
    });
  };

  const getUserDisplayName = () => {
    if (!session?.user) return "Guest";
    return session.user.name || session.user.email?.split("@")[0] || "User";
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section: Date Navigation */}
          <div className="flex items-center space-x-4">
            <DateNavigation currentDate={date} />
          </div>

          {/* Center Section: Date Display and Wake Time */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatDisplayDate(date)}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Daily Tracker
              </p>
            </div>

            {/* Wake Time Tracker */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                ⏰ Wake:
              </span>
              {isWakeTimeEditing ? (
                <WakeTimeInput
                  currentWakeTime={wakeTime}
                  onWakeTimeChange={(newTime) => {
                    onWakeTimeChange(newTime);
                    setIsWakeTimeEditing(false);
                  }}
                  date={date}
                />
              ) : (
                <button
                  onClick={() => setIsWakeTimeEditing(true)}
                  className="text-sm font-mono text-blue-800 dark:text-blue-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {wakeTime}
                </button>
              )}
            </div>
          </div>

          {/* Right Section: Action Buttons and Welcome */}
          <div className="flex items-center space-x-4">
            {/* Todo Button */}
            <button
              onClick={onShowTodo}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isTodoVisible
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
              }`}
            >
              <span>📝</span>
              <span className="hidden sm:inline">Todo</span>
            </button>

            {/* Workout Button */}
            <button
              onClick={onShowWorkout}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isWorkoutVisible
                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
              }`}
            >
              <span>💪</span>
              <span className="hidden sm:inline">Workout</span>
            </button>

            {/* Welcome Message */}
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome,
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {getUserDisplayName()}
              </span>
            </div>

            {/* User Avatar (Mobile) */}
            <div className="md:hidden">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {getUserDisplayName().charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Wake Time and Welcome (when space is limited) */}
        <div className="md:hidden pb-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  ⏰
                </span>
                <span className="text-xs font-mono text-blue-800 dark:text-blue-200">
                  {wakeTime}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Welcome,{" "}
              <span className="font-medium">{getUserDisplayName()}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
