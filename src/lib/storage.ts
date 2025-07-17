import { Block, ChecklistItem } from "../types";

export const saveDayData = (
  blocks: Block[],
  masterChecklist?: ChecklistItem[],
  wakeTime?: string,
  habitBreakChecklist?: ChecklistItem[]
) => {
  try {
    const key = new Date().toISOString().split("T")[0];
    const data = { blocks, masterChecklist, wakeTime, habitBreakChecklist };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving day data:", error);
  }
};

export const loadDayData = () => {
  try {
    const key = new Date().toISOString().split("T")[0];
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const data = JSON.parse(raw);
    // Handle legacy format (array) and new format (object)
    if (Array.isArray(data)) {
      return {
        blocks: data,
        masterChecklist: null,
        wakeTime: "04:00",
        habitBreakChecklist: [],
      };
    }

    // Convert completedAt strings back to Date objects
    if (data.masterChecklist) {
      data.masterChecklist = data.masterChecklist.map(
        (item: ChecklistItem) => ({
          ...item,
          completedAt: item.completedAt
            ? new Date(item.completedAt)
            : undefined,
        })
      );
    }

    // Convert completedAt strings back to Date objects for habit break checklist
    if (data.habitBreakChecklist) {
      data.habitBreakChecklist = data.habitBreakChecklist.map(
        (item: ChecklistItem) => ({
          ...item,
          completedAt: item.completedAt
            ? new Date(item.completedAt)
            : undefined,
        })
      );
    }

    return { ...data, habitBreakChecklist: data.habitBreakChecklist || [] };
  } catch (error) {
    console.error("Error loading day data:", error);
    return null;
  }
};

export const saveDayDataByDate = (
  date: string,
  blocks: Block[],
  masterChecklist?: ChecklistItem[],
  wakeTime?: string,
  habitBreakChecklist?: ChecklistItem[]
) => {
  try {
    const data = { blocks, masterChecklist, wakeTime, habitBreakChecklist };
    localStorage.setItem(date, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving day data by date:", error);
  }
};

export const loadDayDataByDate = (date: string) => {
  try {
    const raw = localStorage.getItem(date);
    if (!raw) return null;

    const data = JSON.parse(raw);
    // Handle legacy format (array) and new format (object)
    if (Array.isArray(data)) {
      return {
        blocks: data,
        masterChecklist: null,
        wakeTime: "05:00",
        habitBreakChecklist: [],
      };
    }

    // Convert completedAt strings back to Date objects
    if (data.masterChecklist) {
      data.masterChecklist = data.masterChecklist.map(
        (item: ChecklistItem) => ({
          ...item,
          completedAt: item.completedAt
            ? new Date(item.completedAt)
            : undefined,
        })
      );
    }

    // Convert completedAt strings back to Date objects for habit break checklist
    if (data.habitBreakChecklist) {
      data.habitBreakChecklist = data.habitBreakChecklist.map(
        (item: ChecklistItem) => ({
          ...item,
          completedAt: item.completedAt
            ? new Date(item.completedAt)
            : undefined,
        })
      );
    }

    return { ...data, habitBreakChecklist: data.habitBreakChecklist || [] };
  } catch (error) {
    console.error("Error loading day data by date:", error);
    return null;
  }
};

export const exportCSV = (blocks: Block[]) => {
  const header = "Time,Label,Done,Notes\n";
  const rows = blocks
    .map(
      (b) =>
        `${b.time},${b.label},${b.complete ? "Yes" : "No"},"${b.notes.join(
          "; "
        )}"`
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AMP_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportCSVByDate = (date: string, blocks: Block[]) => {
  const header = "Time,Label,Done,Notes\n";
  const rows = blocks
    .map(
      (b) =>
        `${b.time},${b.label},${b.complete ? "Yes" : "No"},"${b.notes.join(
          "; "
        )}"`
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AMP_${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
