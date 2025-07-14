import { Block, ChecklistItem } from "../types";

// Cloud storage functions (for authenticated users)
export const saveDayDataToCloud = async (
  date: string,
  blocks: Block[],
  masterChecklist?: ChecklistItem[],
  wakeTime?: string,
  habitBreakChecklist?: ChecklistItem[]
) => {
  try {
    const response = await fetch("/api/user-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date,
        blocks,
        masterChecklist,
        wakeTime,
        habitBreakChecklist,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save data to cloud");
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving to cloud:", error);
    throw error;
  }
};

export const loadDayDataFromCloud = async (date: string) => {
  try {
    const response = await fetch(`/api/user-data?date=${date}`);

    if (!response.ok) {
      throw new Error("Failed to load data from cloud");
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error loading from cloud:", error);
    throw error;
  }
};

// Local storage functions (fallback/offline mode)
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
        habitBreakChecklist: null,
      };
    }
    return data;
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
        wakeTime: "04:00",
        habitBreakChecklist: null,
      };
    }
    return data;
  } catch (error) {
    console.error("Error loading day data by date:", error);
    return null;
  }
};

export const exportCSV = (blocks: Block[]) => {
  const headers = ["Time", "Label", "Complete", "Notes"];
  const rows = blocks.map((block) => [
    block.time,
    block.label,
    block.complete ? "Yes" : "No",
    block.notes.join("; "),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `amp-tracker-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportCSVByDate = (date: string, blocks: Block[]) => {
  const headers = ["Time", "Label", "Complete", "Notes"];
  const rows = blocks.map((block) => [
    block.time,
    block.label,
    block.complete ? "Yes" : "No",
    block.notes.join("; "),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `amp-tracker-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
