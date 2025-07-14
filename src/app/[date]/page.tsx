"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ApiService } from "../../lib/api";
import { exportCSVByDate } from "../../lib/storage";
import TimeBlock from "../../components/TimeBlock";
import ScoreBar from "../../components/ScoreBar";
import MasterChecklist from "../../components/MasterChecklist";
import HabitBreakChecklist from "../../components/HabitBreakChecklist";
import Footer from "../../components/Footer";
import { calculateScore } from "../../lib/scoring";
import { Block, ChecklistItem } from "../../types";

const defaultMasterChecklist: ChecklistItem[] = [
  // Morning routine
  {
    id: "m1",
    text: "Get Mind Right! Put 1 on Loop",
    completed: false,
    category: "morning",
  },
  {
    id: "m2",
    text: "Hear/Read/ Write/Speak/ Vision/Feeling",
    completed: false,
    category: "morning",
  },
  { id: "m3", text: "Teeth / Face", completed: false, category: "morning" },
  {
    id: "m4",
    text: "Spa Treatment / Feet / Deodorant / Hair",
    completed: false,
    category: "morning",
  },
  {
    id: "m5",
    text: "Stretch & Build up…EVERYTHING",
    completed: false,
    category: "morning",
  },
  {
    id: "m6",
    text: "Workout [101] [201] [301]",
    completed: false,
    category: "morning",
  },
  {
    id: "m7",
    text: "Work Day Prep / To Do List Prep",
    completed: false,
    category: "morning",
  },
  {
    id: "m8",
    text: "Bible Study | Mind/Will | Soul/Emotions",
    completed: false,
    category: "morning",
  },

  // Work tasks
  { id: "w1", text: "Work Tasks", completed: false, category: "work" },

  // Tech tasks
  {
    id: "t1",
    text: "Programming, Tech Stacks, Tools",
    completed: false,
    category: "tech",
  },
  {
    id: "t2",
    text: "Coding, Build Portfolio/Projects",
    completed: false,
    category: "tech",
  },
  { id: "t3", text: "Web Dev / Soft Dev", completed: false, category: "tech" },
  { id: "t4", text: "IT Help Desk", completed: false, category: "tech" },
  { id: "t5", text: "Network Security", completed: false, category: "tech" },
  {
    id: "t6",
    text: "Research & Development Subjects",
    completed: false,
    category: "tech",
  },

  // House/Family tasks
  {
    id: "h1",
    text: "Household / Chores / Misc",
    completed: false,
    category: "house",
  },
  {
    id: "h2",
    text: "Various / Store / Breaks / Dinner",
    completed: false,
    category: "house",
  },
  {
    id: "h3",
    text: "2 - 3 X chores & 1.5 nights SB for family",
    completed: false,
    category: "house",
  },

  // Wrap-up tasks
  { id: "wr1", text: "Plan Next Day", completed: false, category: "wrapup" },
  { id: "wr2", text: "Spa Treatment R2", completed: false, category: "wrapup" },
  {
    id: "wr3",
    text: "Blue Angel / Ideal Day/ life",
    completed: false,
    category: "wrapup",
  },
];

const defaultHabitBreakChecklist: ChecklistItem[] = [
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

export default function DailyPage() {
  const params = useParams();
  const date = params?.date as string;
  const { data: session } = useSession();
  const [wakeTime, setWakeTime] = useState<string>("04:00");
  const [isLoading, setIsLoading] = useState(true);

  const [blocks, setBlocks] = useState<Block[]>(() => {
    return defaultBlocks.map((b) => ({
      ...b,
      notes: [],
      complete: false,
      checklist: undefined,
    }));
  });

  const [masterChecklist, setMasterChecklist] = useState<ChecklistItem[]>(
    defaultMasterChecklist
  );

  const [habitBreakChecklist, setHabitBreakChecklist] = useState<
    ChecklistItem[]
  >(defaultHabitBreakChecklist);

  // Load data from API when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.email || !date) return;

      try {
        setIsLoading(true);
        const userData = await ApiService.getUserData(session.user.email);
        const dayData = userData.days[date];

        if (dayData) {
          setWakeTime(dayData.wakeTime || "04:00");
          setBlocks(
            dayData.blocks ||
              defaultBlocks.map((b) => ({
                ...b,
                notes: [],
                complete: false,
                checklist: undefined,
              }))
          );
          setMasterChecklist(dayData.masterChecklist || defaultMasterChecklist);
          setHabitBreakChecklist(
            dayData.habitBreakChecklist || defaultHabitBreakChecklist
          );
        }
      } catch (error) {
        console.error("Error loading day data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [session, date]);

  // Save data to API when state changes
  useEffect(() => {
    const saveData = async () => {
      if (!session?.user?.email || !date || isLoading) return;

      try {
        const dayData = {
          wakeTime,
          blocks,
          masterChecklist,
          habitBreakChecklist,
        };

        await ApiService.saveDayData(session.user.email, date, dayData);
      } catch (error) {
        console.error("Error saving day data:", error);
      }
    };

    saveData();
  }, [
    blocks,
    masterChecklist,
    wakeTime,
    habitBreakChecklist,
    date,
    session,
    isLoading,
  ]);

  // Determine which time block a completed item should go to
  const getTargetTimeBlock = (
    completionTime: Date,
    wakeTimeStr: string
  ): number => {
    const [wakeHour, wakeMinute] = wakeTimeStr.split(":").map(Number);
    const completionHour = completionTime.getHours();
    const completionMinute = completionTime.getMinutes();

    const wakeMinutes = wakeHour * 60 + wakeMinute;
    const completionMinutes = completionHour * 60 + completionMinute;

    if (completionMinutes >= wakeMinutes && completionHour < 5) {
      return 0;
    }

    if (completionHour < wakeHour) {
      return 9;
    }

    if (completionHour >= 4 && completionHour < 5) return 0;
    if (completionHour >= 5 && completionHour < 6) return 1;
    if (completionHour >= 6 && completionHour < 7) return 2;
    if (completionHour >= 7 && completionHour < 8) return 3;
    if (completionHour >= 8 && completionHour < 9) return 4;
    if (completionHour >= 9 && completionHour < 17) return 5;
    if (completionHour >= 17 && completionHour < 18) return 6;
    if (completionHour >= 18 && completionHour < 20) return 7;
    if (completionHour >= 20 && completionHour < 21) return 8;
    if (completionHour >= 21) return 9;

    return 5;
  };

  // Handle completed items from master checklist
  const handleCompleteChecklistItem = (itemId: string) => {
    const completedItem = masterChecklist.find((item) => item.id === itemId);
    if (completedItem) {
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

      const updatedBlocks = [...blocks];
      updatedBlocks[targetBlockIndex].notes.push(noteText);
      setBlocks(updatedBlocks);

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

    if (completedItem) {
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
      setBlocks(updatedBlocks);

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
      setHabitBreakChecklist(updatedItems);
    }
  };

  const toggleComplete = (i: number) => {
    const copy = [...blocks];
    copy[i].complete = !copy[i].complete;
    setBlocks(copy);
  };

  const addNote = (i: number, text: string) => {
    const copy = [...blocks];
    if (text.trim()) copy[i].notes.push(text);
    setBlocks(copy);
  };

  const deleteNote = (blockIndex: number, noteIndex: number) => {
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

    copy[blockIndex].notes.splice(noteIndex, 1);
    setBlocks(copy);
  };

  const editNote = (blockIndex: number, noteIndex: number, newText: string) => {
    const copy = [...blocks];
    copy[blockIndex].notes[noteIndex] = newText;
    setBlocks(copy);
  };

  // Update master checklist
  const updateMasterChecklist = async (updatedItems: ChecklistItem[]) => {
    try {
      setMasterChecklist(updatedItems);
      // Save to database immediately
      if (session?.user?.email && date) {
        const dayData = {
          wakeTime,
          blocks,
          masterChecklist: updatedItems,
          habitBreakChecklist,
        };
        await ApiService.saveDayData(session.user.email, date, dayData);
      }
    } catch (error) {
      console.error("Error updating master checklist:", error);
    }
  };

  const updateHabitBreakChecklist = (updatedItems: ChecklistItem[]) => {
    setHabitBreakChecklist(updatedItems);
  };

  const score = calculateScore(blocks);

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading day data...</div>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="max-w-7xl mx-auto px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Please sign in to view your data</div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4">
      <h1 className="text-2xl font-bold mb-2">AMP Tracker – {date}</h1>
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
        {blocks.map((block, i) => (
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
      <Footer onExport={() => exportCSVByDate(date, blocks)} />
    </main>
  );
}
