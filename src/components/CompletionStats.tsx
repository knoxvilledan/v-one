"use client";
import { ChecklistItem } from "../types";

interface CompletionStatsProps {
  items: ChecklistItem[];
  title: string;
  emoji: string;
  showTimeline?: boolean;
}

export default function CompletionStats({
  items,
  title,
  emoji,
  showTimeline = false,
}: CompletionStatsProps) {
  const totalItems = items.length;
  const completedItems = items.filter((item) => item.completed).length;
  const completionPercentage =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Group completions by time for timeline
  const completionTimeline = items
    .filter((item) => item.completed && item.completedAt)
    .sort(
      (a, b) =>
        new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime()
    )
    .slice(-5); // Show last 5 completions

  // Category breakdown
  const categoryStats = items.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = { total: 0, completed: 0 };
    }
    acc[category].total++;
    if (item.completed) {
      acc[category].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    if (percentage >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <span>{emoji}</span>
          <span>{title}</span>
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold">{completionPercentage}%</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {completedItems}/{totalItems} completed
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${getCompletionColor(
            completionPercentage
          )}`}
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryStats).length > 1 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Category Breakdown</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(categoryStats).map(([category, stats]) => {
              const catPercentage =
                stats.total > 0
                  ? Math.round((stats.completed / stats.total) * 100)
                  : 0;
              return (
                <div key={category} className="text-xs">
                  <div className="flex justify-between">
                    <span className="capitalize">{category}</span>
                    <span>
                      {stats.completed}/{stats.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <div
                      className={`h-1 rounded-full ${getCompletionColor(
                        catPercentage
                      )}`}
                      style={{ width: `${catPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Completions Timeline */}
      {showTimeline && completionTimeline.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Recent Completions</h4>
          <div className="space-y-1">
            {completionTimeline.map((item, index) => (
              <div
                key={`${item.itemId}-${index}`}
                className="flex items-center justify-between text-xs"
              >
                <span className="truncate flex-1 mr-2">{item.text}</span>
                <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {formatTime(new Date(item.completedAt!))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievement Badges */}
      <div className="flex flex-wrap gap-1 mt-3">
        {completionPercentage === 100 && (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            ✨ Perfect Day!
          </span>
        )}
        {completionPercentage >= 80 && completionPercentage < 100 && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            🔥 Almost There!
          </span>
        )}
        {completedItems >= 5 && (
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
            💪 Productive
          </span>
        )}
        {completionTimeline.length >= 3 && (
          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
            ⚡ On Fire
          </span>
        )}
      </div>
    </div>
  );
}
