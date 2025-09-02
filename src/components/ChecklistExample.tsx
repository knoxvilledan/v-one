import Checklist from "./Checklist";
import { type ChecklistData } from "../lib/checklist-actions";

interface ChecklistExampleProps {
  // Example of how to use the Checklist component with hydrated data
  hydratedData: {
    templateSet: {
      checklists: ChecklistData[];
    };
    todayEntry: {
      checklistCompletions: Array<{
        checklistId: string;
        completedItemIds: string[];
        notes?: string;
      }>;
    } | null;
  };
  targetDate?: string;
}

export default function ChecklistExample({
  hydratedData,
  targetDate,
}: ChecklistExampleProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Daily Checklists</h2>

      {hydratedData.templateSet.checklists.map((checklist) => {
        // Find completion data for this checklist
        const completion = hydratedData.todayEntry?.checklistCompletions.find(
          (c) => c.checklistId === checklist.checklistId
        );

        return (
          <Checklist
            key={checklist.checklistId}
            checklist={checklist}
            completedItemIds={completion?.completedItemIds || []}
            notes={completion?.notes || ""}
            targetDate={targetDate}
            showNotes={true}
            className="max-w-2xl"
          />
        );
      })}
    </div>
  );
}

/**
 * Example usage in a page component:
 *
 * ```tsx
 * import { HydrationService } from "../lib/hydration";
 * import ChecklistExample from "../components/ChecklistExample";
 *
 * export default async function HomePage() {
 *   const userData = await HydrationService.hydrateUserData("user@example.com");
 *
 *   if (!userData) {
 *     return <div>Please log in</div>;
 *   }
 *
 *   return (
 *     <div className="container mx-auto px-4 py-8">
 *       <ChecklistExample hydratedData={userData} />
 *     </div>
 *   );
 * }
 * ```
 */
