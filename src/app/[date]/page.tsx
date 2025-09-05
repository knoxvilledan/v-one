import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { getTodayStorageDate } from "../../lib/date-utils";
import { HydrationService } from "../../lib/hydration";
import { calculateScore } from "../../lib/scoring";
import { ChecklistItem } from "../../types";
import type { ITodoItem } from "../../models/TodoItem";
import {
  PageHeader,
  DateNavigation,
  ScoreDisplay,
  ChecklistSection,
  TimeBlocksSection,
  TodoSection,
} from "../../components/daily";

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

  // Get all data server-side using HydrationService
  let userData;
  try {
    userData = await HydrationService.hydrateUserData(session.user.email, date);
  } catch (error) {
    console.error("HydrationService error:", error);
    // Fallback to old system temporarily to get functionality working
    const { getDay } = await import("../../server/queries/daily");
    const fallbackData = await getDay(date, session.user.email);
    console.log("Using fallback data loading");

    // Convert fallback data to expected format
    userData = {
      user: {
        id: session.user.email,
        email: session.user.email,
        role: "public" as const,
      },
      templateSet: {
        version: "1.0.0",
        timeBlocks: fallbackData.blocks.map((block, index) => ({
          blockId: block.id || `block-${index}`,
          time: block.time,
          label: block.label,
          order: index + 1,
        })),
        timeBlocksOrder: [],
        checklists: [
          {
            checklistId: "daily-master-checklist",
            title: "Daily Tasks",
            items: fallbackData.masterChecklist.map((item, index) => ({
              itemId: item.id || `item-${index}`,
              text: item.text,
              category: item.category || "general",
              order: index + 1,
            })),
            itemsOrder: [],
          },
          {
            checklistId: "habit-break-tracker",
            title: "Habit Breaks",
            items: fallbackData.habitBreakChecklist.map((item, index) => ({
              itemId: item.id || `habit-${index}`,
              text: item.text,
              category: item.category || "general",
              order: index + 1,
            })),
            itemsOrder: [],
          },
          {
            checklistId: "workout-checklist",
            title: "Workout Checklist",
            items: fallbackData.workoutChecklist.map((item, index) => ({
              itemId: item.id || `workout-${index}`,
              text: item.text,
              category: item.category || "general",
              order: index + 1,
            })),
            itemsOrder: [],
          },
        ],
        checklistsOrder: [],
      },
      todayEntry: null,
      todos: [],
      recentDays: [],
    };
  }

  if (!userData) {
    console.error("Failed to load user data");
    const today = getTodayStorageDate();
    redirect(`/${today}`);
  }

  // Transform hydrated data to match existing component expectations
  const timeBlocks = userData.templateSet.timeBlocks.map((block, index) => {
    // Get completion status from todayEntry if available
    const dayEntryBlock = userData.todayEntry?.timeBlockCompletions?.find(
      (b) => b.blockId === block.blockId
    );

    return {
      id: block.blockId,
      time: block.time,
      label: block.label,
      notes: dayEntryBlock?.notes ? [dayEntryBlock.notes] : [],
      complete: !!dayEntryBlock,
      duration: dayEntryBlock?.duration || 60,
      index: index,
    };
  });

  // Transform checklists from the new structure
  const checklistData: { [key: string]: ChecklistItem[] } = {};

  userData.templateSet.checklists.forEach((checklist) => {
    const items: ChecklistItem[] = checklist.items.map((item) => {
      // Get completion status from todayEntry if available
      const dayEntryChecklist = userData.todayEntry?.checklistCompletions?.find(
        (c) => c.checklistId === checklist.checklistId
      );
      const isCompleted =
        dayEntryChecklist?.completedItemIds?.includes(item.itemId) || false;
      const completedItem = dayEntryChecklist?.completedItems?.find(
        (ci) => ci.itemId === item.itemId
      );

      return {
        id: item.itemId,
        text: item.text,
        completed: isCompleted,
        category: "todo" as const,
        completedAt: completedItem?.completedAt,
      };
    });

    // Map checklist titles to legacy field names for compatibility
    if (
      checklist.title.toLowerCase().includes("master") ||
      checklist.title.toLowerCase().includes("daily")
    ) {
      checklistData.masterChecklist = items;
    } else if (checklist.title.toLowerCase().includes("habit")) {
      checklistData.habitBreakChecklist = items;
    } else if (checklist.title.toLowerCase().includes("workout")) {
      checklistData.workoutChecklist = items;
    }
  });

  // Create day object for compatibility with existing components
  const day = {
    date,
    userId: session.user.email,
    wakeTime: "", // TODO: Add wake time to DayEntry model if needed
    dailyWakeTime: "",
    userTimezone:
      userData.userSpace?.preferences?.timezone || "America/New_York",
    blocks: timeBlocks,
    masterChecklist: checklistData.masterChecklist || [],
    habitBreakChecklist: checklistData.habitBreakChecklist || [],
    workoutChecklist: checklistData.workoutChecklist || [],
    todoList: Array.isArray(userData.todos)
      ? []
      : (userData.todos.dueToday || []).map(
          (todo: ITodoItem): ChecklistItem => ({
            id:
              (
                todo as ITodoItem & { _id: { toString(): string } }
              )._id?.toString() || Math.random().toString(),
            text: todo.text,
            completed: todo.status === "completed",
            category: "todo" as const,
            dueDate: todo.dueDate?.toISOString().split("T")[0],
          })
        ) || [],
    settings: {
      wakeTime: "",
      timezone: userData.userSpace?.preferences?.timezone || "America/New_York",
    },
  };

  const score = calculateScore(day.blocks);

  return (
    <main className="max-w-7xl mx-auto px-4">
      {/* Header with App Title and Welcome */}
      <PageHeader session={session} />

      {/* Date Navigation and Wake Time */}
      <DateNavigation date={date} wakeTime={day.wakeTime} />

      {/* Score Display */}
      <ScoreDisplay score={score} />

      {/* Master Checklist Section */}
      <ChecklistSection
        title="Daily Tasks"
        items={day.masterChecklist}
        listType="masterChecklist"
        date={date}
        colorScheme="green"
      />

      {/* Time Blocks Section */}
      <TimeBlocksSection blocks={day.blocks} date={date} />

      {/* Habit Break Checklist Section */}
      <ChecklistSection
        title="Habit Breaks"
        items={day.habitBreakChecklist}
        listType="habitBreakChecklist"
        date={date}
        colorScheme="red"
      />

      {/* Workout Checklist Section */}
      <ChecklistSection
        title="Workout Checklist"
        items={day.workoutChecklist}
        listType="workoutChecklist"
        date={date}
        colorScheme="orange"
      />

      {/* Todo List Section */}
      <TodoSection todoList={day.todoList} date={date} />

      {/* Simple footer placeholder */}
      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Server-rendered daily page - PR3 component split complete
        </p>
      </div>
    </main>
  );
}
