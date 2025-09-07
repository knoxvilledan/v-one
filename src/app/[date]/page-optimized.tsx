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

  // Get all data server-side using optimized HydrationService
  let userData;
  try {
    userData = await HydrationService.hydrateUserData(session.user.email, date);
    console.log("✅ Using optimized HydrationService successfully");
  } catch (error) {
    console.error("❌ HydrationService failed:", error);
    // Show error page with helpful information
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              System Error
            </h1>
            <p className="text-gray-700 mb-4">
              Unable to load your daily data. This might be because:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>No active template set found for your user role</li>
              <li>Database connection issues</li>
              <li>Missing user space configuration</li>
            </ul>
            <div className="mt-6 space-x-4">
              <a
                href="/auth/signin"
                className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Return to Sign In
              </a>
              <a
                href="/"
                className="inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Go to Today
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Process the optimized data for rendering
  const processedData = processOptimizedData(userData, date);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <DateNavigation currentDate={date} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              <ScoreDisplay
                score={processedData.score}
                completedCount={processedData.completedCount}
                totalCount={processedData.totalCount}
              />

              {/* All Checklists */}
              {processedData.checklists.map((checklist) => (
                <ChecklistSection
                  key={checklist.checklistId}
                  title={checklist.title}
                  items={checklist.items}
                  sectionId={checklist.checklistId}
                />
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <TimeBlocksSection blocks={processedData.timeBlocks} />
              <TodoSection todoItems={processedData.todoItems} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Process optimized data into format expected by components
function processOptimizedData(userData: any, date: string) {
  // Convert timeBlocks to expected format
  const timeBlocks = userData.templateSet.timeBlocks.map(
    (block: any, index: number) => {
      const dayEntryBlock = userData.todayEntry?.timeBlockCompletions?.find(
        (b: any) => b.blockId === block.blockId
      );

      return {
        id: block.blockId,
        time: block.time,
        label: block.label,
        notes: dayEntryBlock?.notes || "",
        completed: !!dayEntryBlock,
        completedAt: dayEntryBlock?.completedAt || null,
      };
    }
  );

  // Convert checklists to expected format
  const checklists: any[] = [];
  userData.templateSet.checklists.forEach((checklist: any) => {
    const items: ChecklistItem[] = checklist.items.map((item: any) => {
      // Find completion in dayEntry
      const dayEntryChecklist = userData.todayEntry?.checklistCompletions?.find(
        (c: any) => c.checklistId === checklist.checklistId
      );
      const isCompleted =
        dayEntryChecklist?.completedItemIds?.includes(item.itemId) || false;
      const completedItem = dayEntryChecklist?.completedItems?.find(
        (ci: any) => ci.itemId === item.itemId
      );

      return {
        id: item.itemId,
        text: item.text,
        category: item.category || checklist.title,
        completed: isCompleted,
        completedAt: completedItem?.completedAt || null,
        targetBlock: null, // Could be enhanced later
      };
    });

    checklists.push({
      checklistId: checklist.checklistId,
      title: checklist.title,
      items,
    });
  });

  // Calculate score from completed items
  const completedCount = checklists.reduce(
    (sum, checklist) =>
      sum + checklist.items.filter((item: any) => item.completed).length,
    0
  );
  const totalCount = checklists.reduce(
    (sum, checklist) => sum + checklist.items.length,
    0
  );
  const score = calculateScore(
    completedCount,
    totalCount,
    timeBlocks.filter((block: any) => block.completed).length,
    timeBlocks.length
  );

  return {
    timeBlocks,
    checklists,
    todoItems: userData.todoItems || [],
    score,
    completedCount,
    totalCount,
  };
}
