"use client";
import { useState, useCallback, useEffect } from "react";
import { signOut } from "next-auth/react";
import { DayData, ChecklistItem } from "../types";
import Header from "./Header";
import Footer from "./Footer";
import MasterChecklist from "./MasterChecklist";
import HabitBreakChecklist from "./HabitBreakChecklist";
import WorkoutChecklist from "./WorkoutChecklist";
import TodoList from "./TodoList";
import EnhancedTimeBlocksSection from "./EnhancedTimeBlocksSection";
import { exportDayData } from "../lib/export";

interface EnhancedDailyLayoutProps {
  dayData: DayData;
  onUpdateData: (data: Partial<DayData>) => void;
  onCompleteItem: (itemId: string, category: string) => void;
  onToggleTimeBlock: (blockId: string) => void;
  onAddBlockNote: (blockId: string, note: string) => void;
  onDeleteBlockNote: (blockId: string, noteIndex: number) => void;
  onUpdateBlockLabel: (blockId: string, newLabel: string) => void;
  isAdmin?: boolean;
}

export default function EnhancedDailyLayout({
  dayData,
  onUpdateData,
  onCompleteItem,
  onToggleTimeBlock,
  onAddBlockNote,
  onDeleteBlockNote,
  onUpdateBlockLabel,
  isAdmin = false,
}: EnhancedDailyLayoutProps) {
  const [isTodoVisible, setIsTodoVisible] = useState(false);
  const [isWorkoutVisible, setIsWorkoutVisible] = useState(false);

  // Auto-save debounced state
  const [lastSaved, setLastSaved] = useState(Date.now());

  const handleWakeTimeChange = useCallback(
    (wakeTime: string) => {
      onUpdateData({ wakeTime, dailyWakeTime: wakeTime });
    },
    [onUpdateData]
  );

  const handleMasterChecklistUpdate = useCallback(
    (items: ChecklistItem[]) => {
      onUpdateData({ masterChecklist: items });
    },
    [onUpdateData]
  );

  const handleHabitBreakUpdate = useCallback(
    (items: ChecklistItem[]) => {
      onUpdateData({ habitBreakChecklist: items });
    },
    [onUpdateData]
  );

  const handleWorkoutUpdate = useCallback(
    (items: ChecklistItem[]) => {
      onUpdateData({ workoutChecklist: items });
    },
    [onUpdateData]
  );

  const handleTodoUpdate = useCallback(
    (items: ChecklistItem[]) => {
      onUpdateData({ todoList: items });
    },
    [onUpdateData]
  );

  const handleCompleteItem = useCallback(
    (itemId: string) => {
      // Determine category based on which list contains the item
      const masterItem = dayData.masterChecklist?.find(
        (item) => item.itemId === itemId
      );
      const habitItem = dayData.habitBreakChecklist?.find(
        (item) => item.itemId === itemId
      );
      const workoutItem = dayData.workoutChecklist?.find(
        (item) => item.itemId === itemId
      );
      const todoItem = dayData.todoList?.find((item) => item.itemId === itemId);

      let category = "unknown";
      if (masterItem) category = "master";
      else if (habitItem) category = "habit";
      else if (workoutItem) category = "workout";
      else if (todoItem) category = "todo";

      onCompleteItem(itemId, category);
    },
    [dayData, onCompleteItem]
  );

  const handleExport = useCallback(() => {
    exportDayData(dayData);
  }, [dayData]);

  const handleSignOut = useCallback(async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      await signOut({ callbackUrl: "/" });
    }
  }, []);

  const handleResetDay = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to reset all completion data for this day? " +
          "This will clear all checked items and notes but preserve customizations. " +
          "This action cannot be undone."
      )
    ) {
      // Reset completion status but preserve customizations
      const resetData: Partial<DayData> = {
        masterChecklist: dayData.masterChecklist?.map((item) => ({
          ...item,
          completed: false,
          completedAt: undefined,
        })),
        habitBreakChecklist: dayData.habitBreakChecklist?.map((item) => ({
          ...item,
          completed: false,
          completedAt: undefined,
        })),
        workoutChecklist: dayData.workoutChecklist?.map((item) => ({
          ...item,
          completed: false,
          completedAt: undefined,
        })),
        // Don't reset todo list - it should carry forward
        blocks: dayData.blocks?.map((block) => ({
          ...block,
          complete: false,
          completedAt: undefined,
          notes: [], // Clear notes
        })),
        score: 0,
      };
      onUpdateData(resetData);
    }
  }, [dayData, onUpdateData]);

  // Auto-save indicator
  useEffect(() => {
    const timer = setTimeout(() => {
      setLastSaved(Date.now());
    }, 1000);

    return () => clearTimeout(timer);
  }, [dayData]);

  // Calculate completion statistics
  const totalItems =
    (dayData.masterChecklist?.length || 0) +
    (dayData.habitBreakChecklist?.length || 0) +
    (dayData.workoutChecklist?.length || 0) +
    (dayData.todoList?.length || 0);

  const completedItems =
    (dayData.masterChecklist?.filter((item) => item.completed).length || 0) +
    (dayData.habitBreakChecklist?.filter((item) => item.completed).length ||
      0) +
    (dayData.workoutChecklist?.filter((item) => item.completed).length || 0) +
    (dayData.todoList?.filter((item) => item.completed).length || 0);

  const completedBlocks =
    dayData.blocks?.filter((block) => block.complete).length || 0;
  const totalBlocks = dayData.blocks?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <Header
        date={dayData.date}
        wakeTime={dayData.wakeTime || dayData.dailyWakeTime || "06:00"}
        onWakeTimeChange={handleWakeTimeChange}
        onShowTodo={() => setIsTodoVisible(!isTodoVisible)}
        onShowWorkout={() => setIsWorkoutVisible(!isWorkoutVisible)}
        isTodoVisible={isTodoVisible}
        isWorkoutVisible={isWorkoutVisible}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Overall Progress Summary */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Daily Progress Overview
            </h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Auto-saved {Math.floor((Date.now() - lastSaved) / 1000)}s ago
              </div>
              <button
                onClick={handleResetDay}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                title="Reset all completions for today"
              >
                🔄 Reset Day
              </button>
            </div>
          </div>{" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Checklist Items</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {completedItems}/{totalItems}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      totalItems > 0 ? (completedItems / totalItems) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Time Blocks</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {completedBlocks}/{totalBlocks}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      totalBlocks > 0
                        ? (completedBlocks / totalBlocks) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Checklists Section */}
        <div className="space-y-6 mb-8">
          {/* Master Checklist - Starts Collapsed */}
          <MasterChecklist
            items={dayData.masterChecklist || []}
            onCompleteItem={handleCompleteItem}
            onUpdateItems={handleMasterChecklistUpdate}
          />

          {/* Habit Break Checklist - Starts Collapsed */}
          <HabitBreakChecklist
            items={dayData.habitBreakChecklist || []}
            onCompleteItem={handleCompleteItem}
            onUpdateItems={handleHabitBreakUpdate}
          />
        </div>

        {/* Time Blocks Section - Starts Expanded */}
        <EnhancedTimeBlocksSection
          blocks={dayData.blocks || []}
          onToggleBlock={onToggleTimeBlock}
          onAddNote={onAddBlockNote}
          onDeleteNote={onDeleteBlockNote}
          onUpdateLabel={onUpdateBlockLabel}
          isAdmin={isAdmin}
          date={dayData.date}
        />

        {/* Floating Todo List */}
        <TodoList
          items={dayData.todoList || []}
          onCompleteItem={handleCompleteItem}
          onUpdateItems={handleTodoUpdate}
          isVisible={isTodoVisible}
          onToggleVisibility={() => setIsTodoVisible(!isTodoVisible)}
          date={dayData.date}
        />

        {/* Floating Workout Checklist */}
        <WorkoutChecklist
          items={dayData.workoutChecklist || []}
          onCompleteItem={handleCompleteItem}
          onUpdateItems={handleWorkoutUpdate}
          isVisible={isWorkoutVisible}
          onToggleVisibility={() => setIsWorkoutVisible(!isWorkoutVisible)}
        />
      </main>

      {/* Footer */}
      <Footer
        onExport={handleExport}
        onSignOut={handleSignOut}
        onResetDay={handleResetDay}
      />

      {/* Real-time Sync Indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>Live Sync</span>
        </div>
      </div>
    </div>
  );
}
