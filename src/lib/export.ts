import { DayData } from "../types";

export function exportDayData(dayData: DayData): void {
  const dataStr = JSON.stringify(dayData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `amp-tracker-${dayData.date}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportWeeklyData(weekData: DayData[]): void {
  const dataStr = JSON.stringify(weekData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  const startDate = weekData[0]?.date || "unknown";
  const endDate = weekData[weekData.length - 1]?.date || "unknown";
  link.download = `amp-tracker-week-${startDate}-to-${endDate}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCSV(dayData: DayData): void {
  const headers = [
    "Date",
    "Type",
    "Category",
    "Item",
    "Completed",
    "CompletedAt",
  ];
  const rows: string[][] = [headers];

  // Add master checklist items
  dayData.masterChecklist?.forEach((item) => {
    rows.push([
      dayData.date,
      "Master Checklist",
      item.category,
      item.text,
      item.completed.toString(),
      item.completedAt
        ? typeof item.completedAt === "string"
          ? item.completedAt
          : item.completedAt.toISOString()
        : "",
    ]);
  });

  // Add habit break items
  dayData.habitBreakChecklist?.forEach((item) => {
    rows.push([
      dayData.date,
      "Habit Break",
      item.category,
      item.text,
      item.completed.toString(),
      item.completedAt
        ? typeof item.completedAt === "string"
          ? item.completedAt
          : item.completedAt.toISOString()
        : "",
    ]);
  });

  // Add workout items
  dayData.workoutChecklist?.forEach((item) => {
    rows.push([
      dayData.date,
      "Workout",
      item.category,
      item.text,
      item.completed.toString(),
      item.completedAt
        ? typeof item.completedAt === "string"
          ? item.completedAt
          : item.completedAt.toISOString()
        : "",
    ]);
  });

  // Add todo items
  dayData.todoList?.forEach((item) => {
    rows.push([
      dayData.date,
      "Todo",
      item.category,
      item.text,
      item.completed.toString(),
      item.completedAt
        ? typeof item.completedAt === "string"
          ? item.completedAt
          : item.completedAt.toISOString()
        : "",
    ]);
  });

  // Add time blocks
  dayData.blocks?.forEach((block) => {
    rows.push([
      dayData.date,
      "Time Block",
      "time-management",
      `${block.time} - ${block.label}`,
      block.complete.toString(),
      block.completedAt
        ? typeof block.completedAt === "string"
          ? block.completedAt
          : block.completedAt.toISOString()
        : "",
    ]);
  });

  const csvContent = rows
    .map((row) =>
      row.map((field) => `"${field.replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const dataBlob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `amp-tracker-${dayData.date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
