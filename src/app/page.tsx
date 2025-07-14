"use client";
import { useState, useEffect } from "react";
import { saveDayData, loadDayData, exportCSV } from "../lib/storage";
import {
  clearAllLocalStorage,
  inspectLocalStorage,
  fixDateSerialization,
} from "../lib/debug";
import TimeBlock from "../components/TimeBlock";
import ScoreBar from "../components/ScoreBar";
import MasterChecklist from "../components/MasterChecklist";
import HabitBreakChecklist from "../components/HabitBreakChecklist";
import Footer from "../components/Footer";
import { calculateScore } from "../lib/scoring";
import { Block, ChecklistItem } from "../types";

interface DebugStorage {
  clearAllLocalStorage: () => void;
  inspectLocalStorage: () => void;
  fixDateSerialization: () => void;
}

declare global {
  interface Window {
    debugStorage?: DebugStorage;
  }
}

// Master checklist with all items organized by category
const defaultMasterChecklist: ChecklistItem[] = [
  // Morning items
  {
    id: "1",
    text: "Get Mind Right! Put 1 on Loop",
    completed: false,
    category: "morning",
  },
  {
    id: "2",
    text: "Hear/Read/ Write/Speak/ Vision/Feeling",
    completed: false,
    category: "morning",
  },
  { id: "3", text: "Teeth / Face", completed: false, category: "morning" },
  {
    id: "4",
    text: "Spa Treatment / Feet / Deodorant / Hair",
    completed: false,
    category: "morning",
  },
  {
    id: "5",
    text: "Stretch & Build up…EVERYTHING",
    completed: false,
    category: "morning",
  },
  {
    id: "6",
    text: "Workout [101] [201] [301]",
    completed: false,
    category: "morning",
  },
  {
    id: "7",
    text: "Work Day Prep / To Do List Prep",
    completed: false,
    category: "morning",
  },
  {
    id: "8",
    text: "Bible Study | Mind/Will | Soul/Emotions",
    completed: false,
    category: "morning",
  },

  // Work items
  { id: "work-1", text: "Work Tasks", completed: false, category: "work" },

  // Tech items
  {
    id: "tech-1",
    text: "Programming, Tech Stacks, Tools",
    completed: false,
    category: "tech",
  },
  {
    id: "tech-2",
    text: "Coding, Build Portfolio/Projects",
    completed: false,
    category: "tech",
  },
  {
    id: "tech-3",
    text: "Web Dev / Soft Dev",
    completed: false,
    category: "tech",
  },
  { id: "tech-4", text: "IT Help Desk", completed: false, category: "tech" },
  {
    id: "tech-5",
    text: "Network Security",
    completed: false,
    category: "tech",
  },
  {
    id: "tech-6",
    text: "Research & Development Subjects",
    completed: false,
    category: "tech",
  },

  // House & Family items
  {
    id: "house-1",
    text: "Household / Chores / Misc",
    completed: false,
    category: "house",
  },
  {
    id: "house-2",
    text: "Various / Store / Breaks / Dinner",
    completed: false,
    category: "house",
  },
  {
    id: "house-3",
    text: "2 - 3 X chores & 1.5 nights SB for family",
    completed: false,
    category: "house",
  },

  // Wrap up items
  { id: "wrap-1", text: "Plan Next Day", completed: false, category: "wrapup" },
  {
    id: "wrap-2",
    text: "Spa Treatment R2",
    completed: false,
    category: "wrapup",
  },
  {
    id: "wrap-3",
    text: "Blue Angel / Ideal Day/ life",
    completed: false,
    category: "wrapup",
  },
];

// Default habit break checklist items
const defaultHabitBreakChecklist: ChecklistItem[] = [
  // LSD Energy
  {
    id: "lsd-1",
    text: "Negative self-talk",
    completed: false,
    category: "lsd",
  },
  {
    id: "lsd-2",
    text: "LNR",
    completed: false,
    category: "lsd",
  },
  {
    id: "lsd-3",
    text: "LWR",
    completed: false,
    category: "lsd",
  },
  {
    id: "lsd-4",
    text: "AC",
    completed: false,
    category: "lsd",
  },
  {
    id: "lsd-5",
    text: "OC",
    completed: false,
    category: "lsd",
  },
  {
    id: "lsd-6",
    text: "GAF",
    completed: false,
    category: "lsd",
  },
  {
    id: "lsd-7",
    text: "GPR",
    completed: false,
    category: "lsd",
  },
  {
    id: "lsd-8",
    text: "NC",
    completed: false,
    category: "lsd",
  },

  // Financial Waste
  {
    id: "financial-1",
    text: "Impulse purchases",
    completed: false,
    category: "financial",
  },

  // Youtube Shorts
  {
    id: "youtube-1",
    text: "Mindless scrolling",
    completed: false,
    category: "youtube",
  },

  // Time Wasted
  { id: "time-1", text: "Procrastination", completed: false, category: "time" },

  // Wasteful Entertainment
  {
    id: "entertainment-1",
    text: "Binge watching",
    completed: false,
    category: "entertainment",
  },
];

const defaultBlocks = [
  { time: "4:00 AM", label: "Wake & AMP Start" },
  { time: "5:00 AM", label: "Workout & Stretch" },
  { time: "6:00 AM", label: "Family Morning" },
  { time: "7:00 AM", label: "Open Hour (Focus)" },
  { time: "8:00 AM", label: "Education (Sales/Programming)" },
  { time: "9:00 AM", label: "Switch to Work (Sales/FUP)" },
  { time: "5:00 PM", label: "Tech Work" },
  { time: "6:00 PM", label: "Tech Work" },
  { time: "8:00 PM", label: "Family / Chores" },
  { time: "9:00 PM", label: "EOD Wrap Up" },
];

export default function HomePage() {
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [masterChecklist, setMasterChecklist] = useState<ChecklistItem[]>(
    defaultMasterChecklist
  );
  const [habitBreakChecklist, setHabitBreakChecklist] = useState<
    ChecklistItem[]
  >(defaultHabitBreakChecklist);
  const [wakeTime, setWakeTime] = useState<string>("04:00");

  useEffect(() => {
    const stored = loadDayData();

    if (stored) {
      setBlocks(stored.blocks || stored); // Handle both new and legacy format
      setMasterChecklist(stored.masterChecklist || defaultMasterChecklist);
      setWakeTime(stored.wakeTime || "04:00");
      setHabitBreakChecklist(
        stored.habitBreakChecklist || defaultHabitBreakChecklist
      );
    } else {
      setBlocks(
        defaultBlocks.map((b) => ({
          ...b,
          notes: [],
          complete: false,
        }))
      );
    }

    // Add debug functions to window for development
    if (typeof window !== "undefined") {
      window.debugStorage = {
        clearAllLocalStorage,
        inspectLocalStorage,
        fixDateSerialization,
      };
    }
  }, []);

  useEffect(() => {
    if (blocks) {
      saveDayData(blocks, masterChecklist, wakeTime, habitBreakChecklist);
    }
  }, [blocks, masterChecklist, wakeTime, habitBreakChecklist]);

  // Determine which time block a completed item should go to
  const getTargetTimeBlock = (
    completionTime: Date,
    wakeTimeStr: string
  ): number => {
    const [wakeHour, wakeMinute] = wakeTimeStr.split(":").map(Number);
    const completionHour = completionTime.getHours();
    const completionMinute = completionTime.getMinutes();

    // Convert times to minutes since midnight for easier comparison
    const wakeMinutes = wakeHour * 60 + wakeMinute;
    const completionMinutes = completionHour * 60 + completionMinute;

    // If completion is after wake time and before 5 AM next day, use block 0
    if (completionMinutes >= wakeMinutes && completionHour < 5) {
      return 0; // Block 0 (4:00 AM)
    }

    // If completion is early morning (before wake time), it's for block 9 (previous day's wrap-up)
    if (completionHour < wakeHour) {
      return 9; // Block 9 (9:00 PM)
    }

    // Otherwise, determine based on current time ranges
    if (completionHour >= 4 && completionHour < 5) return 0; // 4:00 AM
    if (completionHour >= 5 && completionHour < 6) return 1; // 5:00 AM
    if (completionHour >= 6 && completionHour < 7) return 2; // 6:00 AM
    if (completionHour >= 7 && completionHour < 8) return 3; // 7:00 AM
    if (completionHour >= 8 && completionHour < 9) return 4; // 8:00 AM
    if (completionHour >= 9 && completionHour < 17) return 5; // 9:00 AM - 5:00 PM
    if (completionHour >= 17 && completionHour < 18) return 6; // 5:00 PM
    if (completionHour >= 18 && completionHour < 20) return 7; // 6:00 PM
    if (completionHour >= 20 && completionHour < 21) return 8; // 8:00 PM
    if (completionHour >= 21) return 9; // 9:00 PM

    return 5; // Default to work block
  };

  const handleCompleteChecklistItem = (itemId: string) => {
    const completedItem = masterChecklist.find((item) => item.id === itemId);
    if (completedItem && blocks) {
      const completionTime = new Date();
      // Use manually assigned target block or auto-assign based on time
      const targetBlockIndex =
        completedItem.targetBlock !== undefined
          ? completedItem.targetBlock
          : getTargetTimeBlock(completionTime, wakeTime);

      const timestamp = completionTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const noteText = `✓ ${completedItem.text} (completed ${timestamp})`;

      // Add note to the target time block
      const updatedBlocks = [...blocks];
      updatedBlocks[targetBlockIndex].notes.push(noteText);
      setBlocks(updatedBlocks);

      // Mark item as completed in master checklist
      const updatedChecklist = masterChecklist.map((item) =>
        item.id === itemId
          ? {
              ...item,
              completed: true,
              completedAt: completionTime,
              targetBlock: targetBlockIndex,
            }
          : item
      );
      setMasterChecklist(updatedChecklist);
    }
  };

  const handleCompleteHabitBreakItem = (itemId: string) => {
    const now = new Date();
    const completedItem = habitBreakChecklist.find(
      (item) => item.id === itemId
    );

    if (completedItem && blocks) {
      // Use manually assigned target block or auto-assign based on time
      const targetBlock =
        completedItem.targetBlock !== undefined
          ? completedItem.targetBlock
          : getTargetTimeBlock(now, wakeTime);

      // Add the bad habit as a note to the target block
      const updatedBlocks = [...blocks];
      const badHabitNote = `🚫 ${
        completedItem.text
      } (${now.toLocaleTimeString()})`;
      updatedBlocks[targetBlock].notes.push(badHabitNote);

      // Update the habit break checklist
      const updatedItems = habitBreakChecklist.map((item) =>
        item.id === itemId
          ? {
              ...item,
              completed: true,
              completedAt: now,
              targetBlock: targetBlock,
            }
          : item
      );

      setBlocks(updatedBlocks);
      setHabitBreakChecklist(updatedItems);

      // Save data
      saveDayData(updatedBlocks, masterChecklist, wakeTime, updatedItems);
    }
  };

  const toggleComplete = (i: number) => {
    if (!blocks) return;
    const copy = [...blocks];
    copy[i].complete = !copy[i].complete;
    setBlocks(copy);
  };

  const addNote = (i: number, text: string) => {
    if (!blocks) return;
    const copy = [...blocks];
    if (text.trim()) copy[i].notes.push(text);
    setBlocks(copy);
  };

  const deleteNote = (blockIndex: number, noteIndex: number) => {
    if (!blocks) return;
    const copy = [...blocks];
    const deletedNote = copy[blockIndex].notes[noteIndex];

    // Check if this is a completed checklist item note (starts with ✓)
    if (deletedNote.startsWith("✓ ")) {
      // Extract the original task text (remove ✓ and timestamp)
      const taskMatch = deletedNote.match(
        /^✓ (.+?) \(completed \d{1,2}:\d{2}\)$/
      );
      if (taskMatch) {
        const originalText = taskMatch[1];

        // Find and restore the item in master checklist
        const updatedChecklist = masterChecklist.map((item) => {
          if (item.text === originalText && item.completed) {
            return {
              ...item,
              completed: false,
              completedAt: undefined,
              targetBlock: undefined,
            };
          }
          return item;
        });
        setMasterChecklist(updatedChecklist);
      }
    }

    // Check if this is a bad habit note (starts with 🚫)
    if (deletedNote.startsWith("🚫 ")) {
      // Extract the original habit text (remove 🚫 and timestamp)
      const habitMatch = deletedNote.match(
        /^🚫 (.+?) \(\d{1,2}:\d{2}:\d{2}\)$/
      );
      if (habitMatch) {
        const originalText = habitMatch[1];

        // Find and restore the item in habit break checklist
        const updatedHabitBreakChecklist = habitBreakChecklist.map((item) => {
          if (item.text === originalText && item.completed) {
            return {
              ...item,
              completed: false,
              completedAt: undefined,
              targetBlock: undefined,
            };
          }
          return item;
        });

        setHabitBreakChecklist(updatedHabitBreakChecklist);
      }
    }

    copy[blockIndex].notes.splice(noteIndex, 1);
    setBlocks(copy);
  };

  const editNote = (blockIndex: number, noteIndex: number, newText: string) => {
    if (!blocks) return;
    const copy = [...blocks];
    copy[blockIndex].notes[noteIndex] = newText;
    setBlocks(copy);
  };

  // Update master checklist
  const updateMasterChecklist = (updatedItems: ChecklistItem[]) => {
    try {
      setMasterChecklist(updatedItems);
      // Force save immediately to ensure data persists
      if (blocks) {
        saveDayData(blocks, updatedItems, wakeTime, habitBreakChecklist);
      }
    } catch (error) {
      console.error("Error updating master checklist:", error);
    }
  };

  const updateHabitBreakChecklist = (updatedItems: ChecklistItem[]) => {
    try {
      setHabitBreakChecklist(updatedItems);
      // Force save immediately to ensure data persists
      if (blocks) {
        saveDayData(blocks, masterChecklist, wakeTime, updatedItems);
      }
    } catch (error) {
      console.error("Error updating habit break checklist:", error);
    }
  };

  const score = calculateScore(blocks || []);

  return (
    <main className="max-w-7xl mx-auto px-4">
      <h1 className="text-2xl font-bold mb-2">AMP Tracker</h1>
      <ScoreBar score={score} />
      <MasterChecklist
        items={masterChecklist}
        onCompleteItem={handleCompleteChecklistItem}
        onUpdateItems={updateMasterChecklist}
      />
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label htmlFor="wake-time" className="text-sm font-medium">
            Wake Time:
          </label>
          <input
            id="wake-time"
            type="time"
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
      </div>
      <div className="columns-1 md:columns-2 xl:columns-3 gap-12">
        {blocks &&
          blocks.map((block, i) => (
            <div key={i} className="break-inside-avoid mb-4">
              <TimeBlock
                block={block}
                index={i}
                toggleComplete={toggleComplete}
                addNote={addNote}
                deleteNote={deleteNote}
                editNote={editNote}
              />
            </div>
          ))}
      </div>
      <div className="mt-8">
        <HabitBreakChecklist
          items={habitBreakChecklist}
          onCompleteItem={handleCompleteHabitBreakItem}
          onUpdateItems={updateHabitBreakChecklist}
        />
      </div>
      <Footer onExport={() => exportCSV(blocks || [])} />
    </main>
  );
}
