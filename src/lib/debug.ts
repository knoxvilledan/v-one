import { ChecklistItem } from "../types";

// Debug utilities for localStorage issues
export const clearAllLocalStorage = () => {
  localStorage.clear();
  console.log("LocalStorage cleared");
};

export const inspectLocalStorage = () => {
  console.log("Current localStorage contents:");
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      console.log(`${key}:`, value);
    }
  }
};

export const fixDateSerialization = () => {
  console.log("Fixing date serialization issues...");
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const data = JSON.parse(value);
          if (data.masterChecklist) {
            // Fix any date serialization issues
            data.masterChecklist = data.masterChecklist.map(
              (item: ChecklistItem) => ({
                ...item,
                completedAt: item.completedAt
                  ? new Date(item.completedAt)
                  : undefined,
              })
            );
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`Fixed data for key: ${key}`);
          }
        }
      } catch (error) {
        console.error(`Error fixing data for key ${key}:`, error);
      }
    }
  }
};

export const defaultHabitBreakChecklist: ChecklistItem[] = [
  { id: "hb1", text: "LSD energy", completed: false, category: "lsd" },
  { id: "hb2", text: "LNR", completed: false, category: "lsd" },
  { id: "hb3", text: "LWR", completed: false, category: "lsd" },
  { id: "hb4", text: "AC", completed: false, category: "lsd" },
  { id: "hb5", text: "OC", completed: false, category: "lsd" },
  { id: "hb6", text: "GAF", completed: false, category: "lsd" },
  { id: "hb7", text: "GPR", completed: false, category: "lsd" },
  { id: "hb8", text: "NC", completed: false, category: "lsd" },
  {
    id: "hb9",
    text: "financial waste",
    completed: false,
    category: "financial",
  },
  { id: "hb10", text: "youtube shorts", completed: false, category: "youtube" },
  { id: "hb11", text: "time wasted", completed: false, category: "time" },
  {
    id: "hb5",
    text: "wasteful entertainment",
    completed: false,
    category: "entertainment",
  },
];
