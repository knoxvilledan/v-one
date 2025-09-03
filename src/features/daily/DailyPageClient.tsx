"use client";
import { useParams, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { getTodayStorageDate } from "../../lib/date-utils";
import { exportCSVByDate } from "../../lib/storage";
import { useContent } from "../../hooks/useContent";
import { DailyDataProvider, useDailyData } from "./context/DailyDataContext";
import DateNavigation from "../../components/DateNavigation";
import TimeBlock from "../../components/TimeBlock";
import ScoreBar from "../../components/ScoreBar";
import MasterChecklist from "../../components/MasterChecklist";
import HabitBreakChecklist from "../../components/HabitBreakChecklist";
import TodoList from "../../components/TodoList";
import WorkoutChecklist from "../../components/WorkoutChecklist";
import Footer from "../../components/Footer";
import WakeTimeInput from "../../components/WakeTimeInput";
import AdminViewToggle from "../../components/AdminViewToggle";

function DailyPageContent() {
  const params = useParams();
  const router = useRouter();
  const date = params?.date as string;
  const { data: session } = useSession();
  const { contentData } = useContent();

  // Get all state and handlers from context
  const {
    wakeTime,
    setWakeTime,
    isLoading,
    todoListVisible,
    todoList,
    resetTodoPosition,
    blocks,
    masterChecklist,
    habitBreakChecklist,
    workoutChecklist,
    workoutListVisible,
    resetWorkoutPosition,
    dailyWakeTime,
    timeBlocksCollapsed,
    setTimeBlocksCollapsed,
    score,
    handleCompleteChecklistItem,
    handleCompleteHabitBreakItem,
    handleCompleteTodoItem,
    toggleComplete,
    addNote,
    deleteNote,
    updateMasterChecklist,
    updateHabitBreakChecklist,
    updateTodoList,
    updateWorkoutChecklist,
    handleCompleteWorkoutItem,
    handleDailyWakeTimeChange,
    resetDay,
    handleTodoButtonClick,
    handleTodoPositionReset,
    handleWorkoutButtonClick,
    handleWorkoutPositionReset,
    onLabelUpdate,
    setDailyWakeTime,
  } = useDailyData();

  // Redirect to today's date if no date is provided or invalid
  useEffect(() => {
    if (!date || date === "undefined") {
      const today = getTodayStorageDate();
      router.replace(`/${today}`);
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      const today = getTodayStorageDate();
      router.replace(`/${today}`);
      return;
    }
  }, [date, router]);

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading day data...</div>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="max-w-7xl mx-auto px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Please sign in to view your data</div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4">
      {/* Header with App Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AMP Tracker</h1>
      </div>

      {/* Date Navigation, Wake Time, and Welcome Message - responsive layout */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <DateNavigation currentDate={date} />
          <div className="flex items-center gap-2">
            <label
              htmlFor="wake-time"
              className="text-sm font-medium whitespace-nowrap"
            >
              Wake Time:
            </label>
            <input
              id="wake-time"
              type="time"
              value={wakeTime}
              onChange={(e) => {
                const newWakeTime = e.target.value;
                setWakeTime(newWakeTime);
                // Sync with dailyWakeTime for time block calculations
                if (newWakeTime) {
                  setDailyWakeTime(newWakeTime);
                }
              }}
              className="border rounded-md px-4 py-2 text-sm"
              placeholder="Enter wake time"
            />
          </div>
          <div className="flex items-center">
            <button
              onClick={handleTodoButtonClick}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                todoListVisible
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
              title={todoListVisible ? "Close To-Do List" : "Open To-Do List"}
            >
              📝 To-Do
            </button>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleWorkoutButtonClick}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                workoutListVisible
                  ? "bg-purple-500 text-white hover:bg-purple-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
              title={
                workoutListVisible ? "Close P90X Workout" : "Open P90X Workout"
              }
            >
              💪 P90X
            </button>
          </div>

          {/* Admin View Toggle - only visible to admin users */}
          <AdminViewToggle />
        </div>
        <div className="flex items-center">
          <span className="text-base lg:text-lg font-medium">
            Welcome, {session?.user?.name || "User"}
          </span>
        </div>
      </div>

      {/* Daily Wake Time Input for Time Block Assignment - only show if no wake time is set */}
      {!wakeTime && !dailyWakeTime && (
        <WakeTimeInput
          currentWakeTime={dailyWakeTime}
          onWakeTimeChange={handleDailyWakeTimeChange}
          date={date}
        />
      )}

      <ScoreBar score={score} />
      <MasterChecklist
        items={masterChecklist}
        onCompleteItem={handleCompleteChecklistItem}
        onUpdateItems={updateMasterChecklist}
      />

      {/* Todo List - Responsive positioning for desktop */}
      <div className="relative hidden md:block">
        <TodoList
          items={todoList}
          onCompleteItem={handleCompleteTodoItem}
          onUpdateItems={updateTodoList}
          isVisible={todoListVisible}
          isMobile={false}
          currentDate={date}
          resetPosition={resetTodoPosition}
          onPositionReset={handleTodoPositionReset}
        />
      </div>

      {/* Workout Checklist - Responsive positioning for desktop */}
      <div className="relative hidden md:block">
        <WorkoutChecklist
          items={workoutChecklist}
          onCompleteItem={handleCompleteWorkoutItem}
          onUpdateItems={updateWorkoutChecklist}
          isVisible={workoutListVisible}
          isMobile={false}
          currentDate={date}
          resetPosition={resetWorkoutPosition}
          onPositionReset={handleWorkoutPositionReset}
        />
      </div>

      {/* Time Blocks Section with Collapse */}
      <div className="mb-8">
        {/* Time Blocks Header */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Time Blocks ({blocks.length})
          </h2>
          <button
            onClick={() => setTimeBlocksCollapsed(!timeBlocksCollapsed)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
            title={
              timeBlocksCollapsed
                ? "Expand Time Blocks"
                : "Collapse Time Blocks"
            }
          >
            <span>{timeBlocksCollapsed ? "Expand" : "Collapse"}</span>
            <svg
              className={`w-4 h-4 transition-transform ${
                timeBlocksCollapsed ? "rotate-180" : ""
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

        {/* Time Blocks Grid */}
        {!timeBlocksCollapsed && (
          <div className="columns-1 md:columns-2 xl:columns-3 gap-12">
            {blocks.map((block, i) => (
              <div
                key={block.id || `block-${i}`}
                className="break-inside-avoid mb-4"
              >
                <TimeBlock
                  block={block}
                  index={i}
                  date={date}
                  toggleComplete={toggleComplete}
                  addNote={addNote}
                  deleteNote={deleteNote}
                  onLabelUpdate={onLabelUpdate}
                  onError={(error) => {
                    console.error("TimeBlock error:", error);
                    // You could add a toast notification here
                  }}
                  isAdmin={contentData?.userRole === "admin"}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-8">
        {/* Todo List for mobile - appears above HabitBreakChecklist */}
        <div className="block md:hidden mb-6">
          <TodoList
            items={todoList}
            onCompleteItem={handleCompleteTodoItem}
            onUpdateItems={updateTodoList}
            isVisible={todoListVisible}
            isMobile={true}
            currentDate={date}
            resetPosition={resetTodoPosition}
            onPositionReset={handleTodoPositionReset}
          />
        </div>

        {/* Workout Checklist for mobile - appears above HabitBreakChecklist */}
        <div className="block md:hidden mb-6">
          <WorkoutChecklist
            items={workoutChecklist}
            onCompleteItem={handleCompleteWorkoutItem}
            onUpdateItems={updateWorkoutChecklist}
            isVisible={workoutListVisible}
            isMobile={true}
            currentDate={date}
            resetPosition={resetWorkoutPosition}
            onPositionReset={handleWorkoutPositionReset}
          />
        </div>

        <HabitBreakChecklist
          items={habitBreakChecklist}
          onCompleteItem={handleCompleteHabitBreakItem}
          onUpdateItems={updateHabitBreakChecklist}
        />
      </div>
      <Footer
        onExport={() => exportCSVByDate(date, blocks)}
        onSignOut={() => signOut({ callbackUrl: "/auth/signin" })}
        onResetDay={resetDay} // Add reset day function to footer
      />
    </main>
  );
}

export default function DailyPageClient() {
  const params = useParams();
  const date = params?.date as string;

  return (
    <DailyDataProvider date={date}>
      <DailyPageContent />
    </DailyDataProvider>
  );
}
