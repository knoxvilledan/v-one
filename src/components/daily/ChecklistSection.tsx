// Server Component for checklist sections
import { ChecklistItem } from "../../types";
import {
  completeChecklistItem,
  uncompleteChecklistItem,
} from "../../lib/checklist-actions";

interface ChecklistSectionProps {
  title: string;
  items: ChecklistItem[];
  listType:
    | "masterChecklist"
    | "habitBreakChecklist"
    | "workoutChecklist"
    | "todoList";
  date: string;
  colorScheme: "green" | "red" | "orange" | "purple";
}

function getColorClasses(colorScheme: string, completed: boolean) {
  const schemes = {
    green: completed
      ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
      : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700",
    red: completed
      ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
      : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700",
    orange: completed
      ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
      : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700",
    purple: completed
      ? "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800"
      : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700",
  };
  return schemes[colorScheme as keyof typeof schemes];
}

function getCheckboxColor(colorScheme: string) {
  const colors = {
    green: "text-blue-600",
    red: "text-red-600",
    orange: "text-orange-600",
    purple: "text-purple-600",
  };
  return colors[colorScheme as keyof typeof colors];
}

export default function ChecklistSection({
  title,
  items,
  listType,
  date,
  colorScheme,
}: ChecklistSectionProps) {
  // Map listType to checklistId based on the title
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <form
            key={item.id}
            action={async () => {
              "use server";
              // Map listType/title to checklistId inline to avoid serialization issues
              let checklistId = "";
              if (title === "Daily Tasks") {
                checklistId = "daily-master-checklist";
              } else if (title === "Habit Breaks") {
                checklistId = "habit-break-tracker";
              } else if (title === "Workout Checklist") {
                checklistId = "workout-checklist";
              } else {
                // Fallback mapping
                switch (listType) {
                  case "masterChecklist":
                    checklistId = "daily-master-checklist";
                    break;
                  case "habitBreakChecklist":
                    checklistId = "habit-break-tracker";
                    break;
                  case "workoutChecklist":
                    checklistId = "workout-checklist";
                    break;
                  default:
                    checklistId = "daily-master-checklist";
                }
              }

              if (item.completed) {
                await uncompleteChecklistItem(checklistId, item.id, date);
              } else {
                await completeChecklistItem(
                  checklistId,
                  item.id,
                  item.text,
                  date
                );
              }
            }}
            className={`flex items-center gap-3 p-3 rounded-lg border ${getColorClasses(
              colorScheme,
              item.completed
            )}`}
          >
            <button
              type="submit"
              className="flex items-center gap-2 flex-1 text-left"
            >
              <input
                type="checkbox"
                checked={item.completed}
                readOnly
                className={`h-4 w-4 ${getCheckboxColor(
                  colorScheme
                )} rounded pointer-events-none`}
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
  );
}
