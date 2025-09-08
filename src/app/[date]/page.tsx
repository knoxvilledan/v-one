import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import { HydrationService } from "../../lib/hydration";
import { getTodayStorageDate } from "../../lib/date-utils";
import EnhancedDailyLayout from "../../components/EnhancedDailyLayout";
import { DayData, ChecklistItem } from "../../types";

// Force dynamic rendering and no caching for this page
export const revalidate = 0;

interface PageProps {
  params: Promise<{ date: string }>;
}

export default async function DailyPage({ params }: PageProps) {
  // Get session server-side with authOptions
  const session = await getServerSession(authOptions);

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

  // Get all data server-side using optimized HydrationService
  let userData;
  try {
    userData = await HydrationService.hydrateUserData(session.user.email, date);
    console.log("✅ Using optimized HydrationService successfully");

    if (!userData) {
      throw new Error("HydrationService returned null");
    }
  } catch (error) {
    console.error("HydrationService failed:", error);

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

  // Transform hydrated data to DayData format for EnhancedDailyLayout
  const dayData: DayData = {
    date,
    displayDate: new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "numeric",
      day: "numeric",
      year: "2-digit",
    }),
    wakeTime: "06:00",
    userId: session.user.email,
    score: 0, // Will be calculated in component
    createdAt: new Date(),
    updatedAt: new Date(),
    userTimezone:
      userData.userSpace?.preferences?.timezone || "America/New_York",

    // Transform time blocks
    blocks: userData.templateSet.timeBlocks.map((block) => {
      const dayEntryBlock = userData.todayEntry?.timeBlockCompletions?.find(
        (b: any) => b.blockId === block.blockId
      );
      return {
        id: block.blockId,
        blockId: block.blockId,
        time: block.time,
        label: block.label,
        notes: dayEntryBlock?.notes ? [dayEntryBlock.notes] : [],
        complete: !!dayEntryBlock,
        duration: dayEntryBlock?.duration || 60,
      };
    }),

    // Transform checklists
    masterChecklist:
      userData.templateSet.checklists
        .find((c) => c.checklistId === "daily-master-checklist")
        ?.items.map((item): ChecklistItem => {
          const dayEntryChecklist =
            userData.todayEntry?.checklistCompletions?.find(
              (c: any) => c.checklistId === "daily-master-checklist"
            );
          const completedItem = dayEntryChecklist?.completedItemIds?.find(
            (ci: any) => ci.itemId === item.itemId
          );
          return {
            id: item.itemId,
            itemId: item.itemId,
            text: item.text,
            completed: !!completedItem,
            category: "general",
          };
        }) || [],

    habitBreakChecklist:
      userData.templateSet.checklists
        .find((c) => c.checklistId === "habit-break-tracker")
        ?.items.map((item): ChecklistItem => {
          const dayEntryChecklist =
            userData.todayEntry?.checklistCompletions?.find(
              (c: any) => c.checklistId === "habit-break-tracker"
            );
          const completedItem = dayEntryChecklist?.completedItemIds?.find(
            (ci: any) => ci.itemId === item.itemId
          );
          return {
            id: item.itemId,
            itemId: item.itemId,
            text: item.text,
            completed: !!completedItem,
            category: "general",
          };
        }) || [],

    workoutChecklist:
      userData.templateSet.checklists
        .find((c) => c.checklistId === "workout-checklist")
        ?.items.map((item): ChecklistItem => {
          const dayEntryChecklist =
            userData.todayEntry?.checklistCompletions?.find(
              (c: any) => c.checklistId === "workout-checklist"
            );
          const completedItem = dayEntryChecklist?.completedItemIds?.find(
            (ci: any) => ci.itemId === item.itemId
          );
          return {
            id: item.itemId,
            itemId: item.itemId,
            text: item.text,
            completed: !!completedItem,
            category: "workout",
          };
        }) || [],

    todoList: Array.isArray(userData.todos)
      ? userData.todos
      : (userData.todos.dueToday || []).map(
          (todo: any): ChecklistItem => ({
            id: todo._id?.toString() || Math.random().toString(),
            itemId: todo._id?.toString() || Math.random().toString(),
            text: todo.title || todo.text,
            completed: todo.status === "completed",
            category: "todo",
            dueDate: todo.dueDate?.toISOString?.() || todo.dueDate,
          })
        ),
  };

  // Server actions for data updates
  const handleUpdateData = async (data: Partial<DayData>) => {
    "use server";
    console.log("Updating data:", data);

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    try {
      await HydrationService.updateDayData(session.user.email, date, data);
      console.log("✅ Data updated successfully");
    } catch (error) {
      console.error("❌ Failed to update data:", error);
      throw error;
    }
  };

  const handleCompleteItem = async (itemId: string, category: string) => {
    "use server";
    console.log("Completing item:", itemId, "in category:", category);

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    try {
      await HydrationService.completeItem(
        session.user.email,
        date,
        itemId,
        category
      );
      console.log("✅ Item completed successfully");
    } catch (error) {
      console.error("❌ Failed to complete item:", error);
      throw error;
    }
  };

  const handleToggleTimeBlock = async (blockId: string) => {
    "use server";
    console.log("Toggling time block:", blockId);

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    try {
      await HydrationService.toggleTimeBlock(session.user.email, date, blockId);
      console.log("✅ Time block toggled successfully");
    } catch (error) {
      console.error("❌ Failed to toggle time block:", error);
      throw error;
    }
  };

  const handleAddBlockNote = async (blockId: string, note: string) => {
    "use server";
    console.log("Adding note to block:", blockId, "note:", note);

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    try {
      await HydrationService.addBlockNote(
        session.user.email,
        date,
        blockId,
        note
      );
      console.log("✅ Note added successfully");
    } catch (error) {
      console.error("❌ Failed to add note:", error);
      throw error;
    }
  };

  const handleDeleteBlockNote = async (blockId: string, noteIndex: number) => {
    "use server";
    console.log("Deleting note from block:", blockId, "index:", noteIndex);

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    try {
      await HydrationService.deleteBlockNote(
        session.user.email,
        date,
        blockId,
        noteIndex
      );
      console.log("✅ Note deleted successfully");
    } catch (error) {
      console.error("❌ Failed to delete note:", error);
      throw error;
    }
  };

  const handleUpdateBlockLabel = async (blockId: string, newLabel: string) => {
    "use server";
    console.log("Updating block label:", blockId, "new label:", newLabel);

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    try {
      await HydrationService.updateBlockLabel(
        session.user.email,
        date,
        blockId,
        newLabel
      );
      console.log("✅ Block label updated successfully");
    } catch (error) {
      console.error("❌ Failed to update block label:", error);
      throw error;
    }
  };

  return (
    <EnhancedDailyLayout
      dayData={dayData}
      onUpdateData={handleUpdateData}
      onCompleteItem={handleCompleteItem}
      onToggleTimeBlock={handleToggleTimeBlock}
      onAddBlockNote={handleAddBlockNote}
      onDeleteBlockNote={handleDeleteBlockNote}
      onUpdateBlockLabel={handleUpdateBlockLabel}
    />
  );
}
