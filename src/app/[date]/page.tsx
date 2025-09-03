import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { getDay } from "../../server/queries/daily";
import { getTodayStorageDate } from "../../lib/date-utils";
import { calculateScore } from "../../lib/scoring";
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

  // Get all data server-side
  const day = await getDay(date, session.user.email);
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
