import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { getDay } from "../../server/queries/daily";
import {
  toggleChecklistItem,
  toggleTimeBlock,
  updateWakeTimeAction,
  addBlockNote,
  addTodoItem,
} from "../../server/actions/daily";
import { getTodayStorageDate } from "../../lib/date-utils";
import { calculateScore } from "../../lib/scoring";

// Force dynamic rendering and no caching for this page
export const revalidate = 0;

interface PageProps {
  params: Promise<{ date: string }>;
}

export default async function DailyPage({ params }: PageProps) {
  // Get session server-side
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  // Await params in Next.js 15
  const { date } = await params;

  // Validate and handle date
  if (!date || date === "undefined") {
    const today = getTodayStorageDate();
    redirect(`/${today}`);
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    const today = getTodayStorageDate();
    redirect(`/${today}`);
  }

  // Get all data server-side
  const day = await getDay(date, session.user.email);
  const score = calculateScore(day.blocks);

  return (
    <main className="max-w-7xl mx-auto px-4">
      {/* Header with App Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AMP Tracker</h1>
      </div>

      {/* Date Navigation and Welcome Message */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          {/* TODO: Convert DateNavigation to server component */}
          <div className="text-lg font-medium">Date: {date}</div>

          {/* Wake time form with server action */}
          <form
            action={updateWakeTimeAction}
            className="flex items-center gap-2"
          >
            <label className="text-sm font-medium whitespace-nowrap">
              Wake Time:
            </label>
            <input type="hidden" name="date" value={date} />
            <input
              type="time"
              name="wakeTime"
              defaultValue={day.wakeTime}
              className="border rounded-md px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </form>
        </div>

        <div className="flex items-center">
          <span className="text-base lg:text-lg font-medium">
            Welcome, {session?.user?.name || "User"}
          </span>
        </div>
      </div>

      {/* Score Display */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="text-lg font-medium">
          Daily Score:{" "}
          <span className="text-blue-600 dark:text-blue-400">{score}</span>
        </div>
      </div>

      {/* Master Checklist Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Daily Tasks</h2>
        <div className="space-y-2">
          {day.masterChecklist.map((item) => (
            <form
              key={item.id}
              action={async () => {
                "use server";
                await toggleChecklistItem(date, item.id, "masterChecklist");
              }}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                item.completed
                  ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                  : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              }`}
            >
              <button
                type="submit"
                className="flex items-center gap-2 flex-1 text-left"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  readOnly
                  className="h-4 w-4 text-blue-600 rounded pointer-events-none"
                />
                <span
                  className={
                    item.completed
                      ? "line-through text-gray-500 dark:text-gray-400"
                      : "text-gray-900 dark:text-gray-100"
                  }
                >
                  {item.text}
                </span>
              </button>
            </form>
          ))}
        </div>
      </div>

      {/* Time Blocks Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">
          Time Blocks ({day.blocks.length})
        </h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {day.blocks.map((block, i) => (
            <div
              key={block.id || `block-${i}`}
              className={`p-4 rounded-lg border ${
                block.complete
                  ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                  : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{block.time}</h3>
                <form
                  action={async () => {
                    "use server";
                    await toggleTimeBlock(date, block.id);
                  }}
                >
                  <button type="submit">
                    <input
                      type="checkbox"
                      checked={block.complete}
                      readOnly
                      className="h-4 w-4 text-blue-600 rounded pointer-events-none"
                    />
                  </button>
                </form>
              </div>
              <p className="text-sm font-medium mb-2">{block.label}</p>
              {block.notes && block.notes.length > 0 && (
                <div className="space-y-1 mb-2">
                  {block.notes.map((note, noteIndex) => (
                    <div
                      key={noteIndex}
                      className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded"
                    >
                      {note}
                    </div>
                  ))}
                </div>
              )}
              {/* Add note form */}
              <form
                action={async (formData: FormData) => {
                  "use server";
                  const note = formData.get("note") as string;
                  if (note?.trim()) {
                    await addBlockNote(date, block.id, note.trim());
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  name="note"
                  placeholder="Add note..."
                  className="flex-1 text-xs border rounded px-2 py-1"
                />
                <button
                  type="submit"
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>

      {/* Habit Break Checklist Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Habit Breaks</h2>
        <div className="space-y-2">
          {day.habitBreakChecklist.map((item) => (
            <form
              key={item.id}
              action={async () => {
                "use server";
                await toggleChecklistItem(date, item.id, "habitBreakChecklist");
              }}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                item.completed
                  ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                  : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              }`}
            >
              <button
                type="submit"
                className="flex items-center gap-2 flex-1 text-left"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  readOnly
                  className="h-4 w-4 text-red-600 rounded pointer-events-none"
                />
                <span
                  className={
                    item.completed
                      ? "line-through text-gray-500 dark:text-gray-400"
                      : "text-gray-900 dark:text-gray-100"
                  }
                >
                  {item.text}
                </span>
              </button>
            </form>
          ))}
        </div>
      </div>

      {/* TODO: Add workout checklist and todo list sections */}

      {/* Workout Checklist Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Workout Checklist</h2>
        <div className="space-y-2">
          {day.workoutChecklist.map((item) => (
            <form
              key={item.id}
              action={async () => {
                "use server";
                await toggleChecklistItem(date, item.id, "workoutChecklist");
              }}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                item.completed
                  ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
                  : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              }`}
            >
              <button
                type="submit"
                className="flex items-center gap-2 flex-1 text-left"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  readOnly
                  className="h-4 w-4 text-orange-600 rounded pointer-events-none"
                />
                <span
                  className={
                    item.completed
                      ? "line-through text-gray-500 dark:text-gray-400"
                      : "text-gray-900 dark:text-gray-100"
                  }
                >
                  {item.text}
                </span>
              </button>
            </form>
          ))}
        </div>
      </div>

      {/* Todo List Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Todo List</h2>

        {/* Add new todo form */}
        <form
          action={async (formData: FormData) => {
            "use server";
            const text = formData.get("todoText") as string;
            if (text?.trim()) {
              await addTodoItem(date, text.trim());
            }
          }}
          className="mb-4 flex gap-2"
        >
          <input
            type="text"
            name="todoText"
            placeholder="Add new todo..."
            className="flex-1 border rounded-md px-3 py-2"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Todo
          </button>
        </form>

        {/* Todo list items */}
        <div className="space-y-2">
          {day.todoList.map((item) => (
            <form
              key={item.id}
              action={async () => {
                "use server";
                await toggleChecklistItem(date, item.id, "todoList");
              }}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                item.completed
                  ? "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800"
                  : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              }`}
            >
              <button
                type="submit"
                className="flex items-center gap-2 flex-1 text-left"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  readOnly
                  className="h-4 w-4 text-purple-600 rounded pointer-events-none"
                />
                <span
                  className={
                    item.completed
                      ? "line-through text-gray-500 dark:text-gray-400"
                      : "text-gray-900 dark:text-gray-100"
                  }
                >
                  {item.text}
                </span>
              </button>
            </form>
          ))}
        </div>
      </div>

      {/* Simple footer placeholder */}
      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Server-rendered daily page - PR1 complete
        </p>
      </div>
    </main>
  );
}
