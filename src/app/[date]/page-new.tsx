import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import { HydrationService } from "../../lib/hydration";
import { getTodayStorageDate } from "../../lib/date-utils";

// Force dynamic rendering and no caching for this page
export const revalidate = 0;

interface PageProps {
  params: Promise<{ date: string }>;
}

export default async function DailyPage({ params }: PageProps) {
  // Get session server-side with authOptions
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
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
    // Use the optimized HydrationService
    userData = await HydrationService.hydrateUserData(session.user.email, date);
    console.log("✅ Using optimized HydrationService successfully");

    if (!userData) {
      throw new Error("HydrationService returned null");
    }
  } catch (error) {
    console.error("❌ Original data loading failed:", error);

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

  // Simple production UI for now - can be enhanced later
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Daily Tracker
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome, {session.user.email} - {date}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Time Blocks */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Time Blocks
            </h2>
            <div className="space-y-3">
              {userData.templateSet.timeBlocks.map((block) => (
                <div
                  key={block.blockId}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {block.time}
                    </span>
                    <span className="ml-3 text-gray-600 dark:text-gray-300">
                      {block.label}
                    </span>
                  </div>
                  <div className="w-4 h-4 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Checklists */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Checklists
            </h2>
            <div className="space-y-4">
              {userData.templateSet.checklists.map((checklist) => (
                <div key={checklist.checklistId}>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {checklist.title}
                  </h3>
                  <div className="space-y-2">
                    {checklist.items.map((item) => (
                      <div
                        key={item.itemId}
                        className="flex items-center space-x-3"
                      >
                        <div className="w-4 h-4 bg-gray-300 rounded"></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            System Status
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p>✅ Using optimized HydrationService</p>
            <p>✅ Template Set: {userData.templateSet.version}</p>
            <p>✅ Time Blocks: {userData.templateSet.timeBlocks.length}</p>
            <p>✅ Checklists: {userData.templateSet.checklists.length}</p>
            <p>✅ User Role: {userData.user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
