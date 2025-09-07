import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/authOptions";
import { redirect } from "next/navigation";
import { HydrationService } from "../../lib/hydration";
import PageHeader from "../../components/PageHeader";
import DateNavigation from "../../components/DateNavigation";
import ScoreDisplay from "../../components/ScoreDisplay";
import ChecklistSection from "../../components/ChecklistSection";
import TimeBlocksSection from "../../components/TimeBlocksSection";
import TodoSection from "../../components/TodoSection";
import { getTodayStorageDate } from "../../lib/utils/storageUtils";
import { Suspense } from "react";

interface ChecklistItem {
  itemId: string;
  id: string;
  text: string;
  completed: boolean;
  category: string;
  dueDate?: string;
}

interface TimeBlock {
  id: string;
  time: string;
  label: string;
  notes: string[];
  complete: boolean;
  duration: number;
}

interface ChecklistData {
  [key: string]: ChecklistItem[];
}

interface DailyPageProps {
  params: { date: string };
}

export default async function DailyPage({ params }: DailyPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const { date } = params;

  // Get all data server-side using optimized HydrationService
  let userData;
  try {
    // Use the optimized HydrationService
    userData = await HydrationService.hydrateUserData(session.user.email, date);
    console.log("Using optimized HydrationService successfully");

    if (!userData) {
      throw new Error("HydrationService returned null");
    }
  } catch (error) {
    console.error("Original data loading failed:", error);

    // Fallback to basic structure if HydrationService fails
    userData = {
      user: {
        id: session.user.email,
        email: session.user.email,
        role: "public" as const,
      },
      templateSet: {
        version: "1.0.0",
        timeBlocks: [
          {
            blockId: "block-1",
            time: "06:00",
            label: "Morning Routine",
            order: 1,
          },
          {
            blockId: "block-2",
            time: "12:00",
            label: "Midday Check",
            order: 2,
          },
          {
            blockId: "block-3",
            time: "18:00",
            label: "Evening Review",
            order: 3,
          },
        ],
        timeBlocksOrder: ["block-1", "block-2", "block-3"],
        checklists: [
          {
            checklistId: "daily-master-checklist",
            title: "Daily Tasks",
            items: [
              { itemId: "item-1", text: "Morning Planning", order: 1 },
              { itemId: "item-2", text: "Focus Session", order: 2 },
              { itemId: "item-3", text: "Evening Review", order: 3 },
            ],
            itemsOrder: ["item-1", "item-2", "item-3"],
            order: 1,
          },
        ],
        checklistsOrder: ["daily-master-checklist"],
      },
      userSpace: null,
      todayEntry: null,
      todos: {
        pending: [],
        inProgress: [],
        dueToday: [],
        overdue: [],
      },
      recentDays: [],
    };
  }

  if (!userData) {
    console.error("Failed to load user data");
    const today = getTodayStorageDate();
    redirect(`/${today}`);
  }

  // Transform hydrated data to match existing component expectations
  const timeBlocks: TimeBlock[] = userData.templateSet.timeBlocks.map(
    (block) => {
      // Get completion status from todayEntry if available
      const dayEntryBlock = userData.todayEntry?.timeBlockCompletions?.find(
        (b: any) => b.blockId === block.blockId
      );

      return {
        id: block.blockId,
        time: block.time,
        label: block.label,
        notes: dayEntryBlock?.notes ? [dayEntryBlock.notes] : [],
        complete: !!dayEntryBlock,
        duration: dayEntryBlock?.duration || 60,
      };
    }
  );

  // Transform checklists data
  const checklistData: ChecklistData = {};
  userData.templateSet.checklists.forEach((checklist) => {
    const items: ChecklistItem[] = checklist.items.map((item) => {
      // Get completion status from todayEntry if available
      const dayEntryChecklist = userData.todayEntry?.checklistCompletions?.find(
        (c: any) => c.checklistId === checklist.checklistId
      );

      const completedItem = dayEntryChecklist?.completedItemIds?.find(
        (ci: any) => ci.itemId === item.itemId
      );

      return {
        itemId: item.itemId,
        id: item.itemId,
        text: item.text,
        completed: !!completedItem,
        category: "general",
      };
    });

    checklistData[checklist.checklistId] = items;
  });

  // Calculate daily score
  const totalItems =
    Object.values(checklistData).flat().length + timeBlocks.length;
  const completedItems =
    Object.values(checklistData)
      .flat()
      .filter((item) => item.completed).length +
    timeBlocks.filter((block) => block.complete).length;

  const todayData = {
    date,
    userId: session.user.email,
    score: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    targetScore: 80,
    timezone: userData.userSpace?.preferences?.timezone || "America/New_York",
  };

  // Transform todos to match TodoSection expectations
  const todoList = Array.isArray(userData.todos)
    ? userData.todos
    : (userData.todos.dueToday || []).map(
        (todo: any): ChecklistItem => ({
          itemId: todo._id?.toString() || Math.random().toString(),
          id: todo._id?.toString() || Math.random().toString(),
          text: todo.title || todo.text,
          completed: todo.status === "completed",
          category: "todo",
          dueDate: todo.dueDate?.toISOString?.() || todo.dueDate,
        })
      );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Suspense fallback={<div>Loading header...</div>}>
          <PageHeader session={session} />
        </Suspense>

        <Suspense fallback={<div>Loading navigation...</div>}>
          <DateNavigation currentDate={date} />
        </Suspense>

        <Suspense fallback={<div>Loading score...</div>}>
          <ScoreDisplay
            score={todayData.score}
            target={todayData.targetScore}
            date={date}
          />
        </Suspense>

        <div className="grid gap-6 lg:grid-cols-2 mt-6">
          <div className="space-y-6">
            <Suspense fallback={<div>Loading checklists...</div>}>
              <ChecklistSection checklistData={checklistData} date={date} />
            </Suspense>
          </div>

          <div className="space-y-6">
            <Suspense fallback={<div>Loading time blocks...</div>}>
              <TimeBlocksSection blocks={timeBlocks} date={date} />
            </Suspense>

            <Suspense fallback={<div>Loading todos...</div>}>
              <TodoSection todos={todoList} date={date} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
