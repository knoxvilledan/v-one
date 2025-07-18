"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ApiService } from "../../lib/api";
import { exportCSVByDate } from "../../lib/storage";
import { getTodayStorageDate } from "../../lib/date-utils";
import DateNavigation from "../../components/DateNavigation";
import TimeBlock from "../../components/TimeBlock";
import ScoreBar from "../../components/ScoreBar";
import MasterChecklist from "../../components/MasterChecklist";
import HabitBreakChecklist from "../../components/HabitBreakChecklist";
import TodoList from "../../components/TodoList";
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
  const router = useRouter();
  const date = params?.date as string;
  const { data: session } = useSession();
  const [wakeTime, setWakeTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [todoListVisible, setTodoListVisible] = useState(false);
  const [todoList, setTodoList] = useState<ChecklistItem[]>([]);
  const [resetTodoPosition, setResetTodoPosition] = useState(false);

  // Redirect to today's date if no date is provided or invalid
  useEffect(() => {
    if (!date || date === "undefined") {
      const today = getTodayStorageDate();
      router.replace(`/${today}`);
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      const today = getTodayStorageDate();
      router.replace(`/${today}`);
      return;
    }
  }, [date, router]);

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

  // Helper function to ensure date fields are proper Date objects
  const ensureDateObjects = (items: ChecklistItem[]): ChecklistItem[] => {
    return items.map((item) => ({
      ...item,
      completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
    }));
  };

  // Load data from API when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.email || !date) return;

      try {
        setIsLoading(true);
        const userData = await ApiService.getUserData(session.user.email);
        const dayData = userData.days[date];

        if (dayData) {
          setWakeTime(dayData.wakeTime || "");
          setBlocks(
            dayData.blocks ||
              defaultBlocks.map((b) => ({
                ...b,
                notes: [],
                complete: false,
                checklist: undefined,
              }))
          );
          // Ensure dates are proper Date objects
          const masterChecklist =
            dayData.masterChecklist || defaultMasterChecklist;
          const habitBreakChecklist =
            dayData.habitBreakChecklist || defaultHabitBreakChecklist;
          let todoList = dayData.todoList || [];

          // Auto-load uncompleted todo items from previous days
          todoList = await loadPreviousTodoItems(userData, date, todoList);

          setMasterChecklist(ensureDateObjects(masterChecklist));
          setHabitBreakChecklist(ensureDateObjects(habitBreakChecklist));
          setTodoList(ensureDateObjects(todoList));
        } else {
          // If no data for this day, still load previous uncompleted todos
          const todoList = await loadPreviousTodoItems(userData, date, []);
          setTodoList(ensureDateObjects(todoList));
        }
      } catch (error) {
        console.error("Error loading day data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [session, date]);

  // Helper function to load uncompleted todo items from previous days
  const loadPreviousTodoItems = async (
    userData: { days: Record<string, { todoList?: ChecklistItem[] }> },
    currentDate: string,
    existingTodos: ChecklistItem[]
  ): Promise<ChecklistItem[]> => {
    const currentDateObj = new Date(currentDate);
    const allTodos = [...existingTodos];

    // Check all previous days for uncompleted todos
    Object.keys(userData.days).forEach((dateKey) => {
      const dayData = userData.days[dateKey];
      if (dayData.todoList) {
        dayData.todoList.forEach((todo: ChecklistItem) => {
          const todoDueDate = new Date(todo.dueDate || dateKey);

          // Include uncompleted todos that are due today or overdue
          if (
            !todo.completed &&
            todoDueDate <= currentDateObj &&
            !allTodos.some((existing) => existing.id === todo.id)
          ) {
            allTodos.push(todo);
          }
        });
      }
    });

    return allTodos;
  };

  // Save data to API when state changes (debounced)
  useEffect(() => {
    const saveData = async () => {
      if (!session?.user?.email || !date || isLoading) return;

      try {
        const dayData = {
          wakeTime,
          blocks,
          masterChecklist,
          habitBreakChecklist,
          todoList,
        };

        await ApiService.saveDayData(session.user.email, date, dayData);
      } catch (error) {
        console.error("Error saving day data:", error);
      }
    };

    // Debounce the save operation
    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [
    blocks,
    masterChecklist,
    wakeTime,
    habitBreakChecklist,
    todoList,
    date,
    session,
    isLoading,
  ]);

  // Unified time block assignment function that considers the current date context
  const getTimeBlockForCompletion = (
    completionTime: Date,
    currentPageDate: string
  ): number => {
    const completionHour = completionTime.getHours();
    const completionDate = completionTime.toISOString().split("T")[0]; // YYYY-MM-DD format

    // If we're on the current page date
    if (completionDate === currentPageDate) {
      // Standard time block assignments for the current day
      // Early morning (12:01 AM - 4:59 AM) -> 4:00 AM block
      if (completionHour >= 0 && completionHour < 5) return 0; // 12:01 AM - 4:59 AM -> 4:00 AM
      if (completionHour >= 5 && completionHour < 6) return 1; // 5:00 AM
      if (completionHour >= 6 && completionHour < 7) return 2; // 6:00 AM
      if (completionHour >= 7 && completionHour < 8) return 3; // 7:00 AM
      if (completionHour >= 8 && completionHour < 9) return 4; // 8:00 AM
      if (completionHour >= 9 && completionHour < 17) return 5; // 9:00 AM - 5:00 PM
      if (completionHour >= 17 && completionHour < 18) return 6; // 5:00 PM
      if (completionHour >= 18 && completionHour < 20) return 7; // 6:00 PM
      if (completionHour >= 20 && completionHour < 21) return 8; // 8:00 PM
      if (completionHour >= 21) return 9; // 9:00 PM - 11:59 PM -> 9:00 PM
    } else {
      // Cross-date scenarios
      const currentPageDateObj = new Date(currentPageDate + "T00:00:00");
      const completionDateObj = new Date(completionDate + "T00:00:00");

      // If completing on the day before the current page (late night work)
      if (completionDateObj.getTime() < currentPageDateObj.getTime()) {
        if (completionHour >= 21) return 9; // 9:00 PM - 11:59 PM -> 9:00 PM
        if (completionHour >= 0 && completionHour < 5) return 0; // 12:01 AM - 4:59 AM -> 4:00 AM
      }

      // If completing on the day after the current page (early morning work)
      if (completionDateObj.getTime() > currentPageDateObj.getTime()) {
        if (completionHour >= 0 && completionHour < 5) return 0; // 12:01 AM - 4:59 AM -> 4:00 AM
        if (completionHour >= 5 && completionHour < 6) return 1; // 5:00 AM
      }
    }

    // Fallback to standard assignment if no special case matches
    if (completionHour >= 0 && completionHour < 5) return 0; // 12:01 AM - 4:59 AM -> 4:00 AM
    if (completionHour >= 5 && completionHour < 6) return 1; // 5:00 AM
    if (completionHour >= 6 && completionHour < 7) return 2; // 6:00 AM
    if (completionHour >= 7 && completionHour < 8) return 3; // 7:00 AM
    if (completionHour >= 8 && completionHour < 9) return 4; // 8:00 AM
    if (completionHour >= 9 && completionHour < 17) return 5; // 9:00 AM - 5:00 PM
    if (completionHour >= 17 && completionHour < 18) return 6; // 5:00 PM
    if (completionHour >= 18 && completionHour < 20) return 7; // 6:00 PM
    if (completionHour >= 20 && completionHour < 21) return 8; // 8:00 PM
    if (completionHour >= 21) return 9; // 9:00 PM - 11:59 PM -> 9:00 PM

    return 0; // Default fallback to 4:00 AM block
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
          : getTimeBlockForCompletion(completionTime, date);

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
          : getTimeBlockForCompletion(now, date);

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

  // Handle todo list item completion
  const handleCompleteTodoItem = async (itemId: string) => {
    const completedItem = todoList.find((item) => item.id === itemId);
    if (completedItem) {
      const completionTime = new Date();

      if (completedItem.completed) {
        // Item is being unchecked - remove from blocks and mark as incomplete
        const updatedBlocks = [...blocks];
        const targetBlock = completedItem.targetBlock;

        if (targetBlock !== undefined) {
          const noteIndex = updatedBlocks[targetBlock].notes.findIndex(
            (note) =>
              note.includes(`✓ ${completedItem.text}`) &&
              note.includes("(completed")
          );
          if (noteIndex >= 0) {
            updatedBlocks[targetBlock].notes.splice(noteIndex, 1);
            setBlocks(updatedBlocks);
          }
        }

        // Update todo list
        const updatedTodoList = todoList.map((item) =>
          item.id === itemId
            ? {
                ...item,
                completed: false,
                completedAt: undefined,
                targetBlock: undefined,
              }
            : item
        );
        setTodoList(updatedTodoList);

        // Save to database immediately
        try {
          if (session?.user?.email && date) {
            const dayData = {
              wakeTime,
              blocks: updatedBlocks,
              masterChecklist,
              habitBreakChecklist,
              todoList: updatedTodoList,
            };
            await ApiService.saveDayData(session.user.email, date, dayData);
          }
        } catch (error) {
          console.error("Error saving todo item uncheck:", error);
        }
      } else {
        // Item is being checked - add to blocks and mark as complete
        const targetBlockIndex =
          completedItem.targetBlock !== undefined
            ? completedItem.targetBlock
            : getTimeBlockForCompletion(completionTime, date);

        const timestamp = completionTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const noteText = `✓ ${completedItem.text} (completed ${timestamp})`;

        const updatedBlocks = [...blocks];
        updatedBlocks[targetBlockIndex].notes.push(noteText);
        setBlocks(updatedBlocks);

        const updatedTodoList = todoList.map((item) =>
          item.id === itemId
            ? {
                ...item,
                completed: true,
                completedAt: completionTime,
                targetBlock: targetBlockIndex,
              }
            : item
        );
        setTodoList(updatedTodoList);

        // Save to database immediately
        try {
          if (session?.user?.email && date) {
            const dayData = {
              wakeTime,
              blocks: updatedBlocks,
              masterChecklist,
              habitBreakChecklist,
              todoList: updatedTodoList,
            };
            await ApiService.saveDayData(session.user.email, date, dayData);
          }
        } catch (error) {
          console.error("Error saving todo item check:", error);
        }
      }
    }
  };

  const toggleComplete = async (i: number) => {
    const copy = [...blocks];
    copy[i].complete = !copy[i].complete;
    setBlocks(copy);

    // Save to database immediately
    try {
      if (session?.user?.email && date) {
        const dayData = {
          wakeTime,
          blocks: copy,
          masterChecklist,
          habitBreakChecklist,
          todoList,
        };
        await ApiService.saveDayData(session.user.email, date, dayData);
      }
    } catch (error) {
      console.error("Error saving block completion:", error);
    }
  };

  const addNote = async (i: number, text: string) => {
    const copy = [...blocks];
    if (text.trim()) {
      copy[i].notes.push(text);
      setBlocks(copy);

      // Save to database immediately
      try {
        if (session?.user?.email && date) {
          const dayData = {
            wakeTime,
            blocks: copy,
            masterChecklist,
            habitBreakChecklist,
            todoList,
          };
          await ApiService.saveDayData(session.user.email, date, dayData);
        }
      } catch (error) {
        console.error("Error saving note:", error);
      }
    }
  };

  const deleteNote = async (blockIndex: number, noteIndex: number) => {
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
        // First try to find by exact text match and current block
        let foundItem = false;
        let updatedChecklist = masterChecklist.map((item) => {
          if (
            item.text === originalText &&
            item.completed &&
            item.targetBlock === blockIndex
          ) {
            foundItem = true;
            return {
              ...item,
              completed: false,
              completedAt: undefined,
              targetBlock: undefined,
            };
          }
          return item;
        });

        // If not found by exact text and current block, try to find by current target block only
        if (!foundItem) {
          updatedChecklist = masterChecklist.map((item) => {
            if (item.completed && item.targetBlock === blockIndex) {
              foundItem = true;
              return {
                ...item,
                completed: false,
                completedAt: undefined,
                targetBlock: undefined,
              };
            }
            return item;
          });
        }

        if (foundItem) {
          setMasterChecklist(updatedChecklist);
        }
      }
    }

    copy[blockIndex].notes.splice(noteIndex, 1);
    setBlocks(copy);

    // Save to database immediately
    try {
      if (session?.user?.email && date) {
        const dayData = {
          wakeTime,
          blocks: copy,
          masterChecklist,
          habitBreakChecklist,
          todoList,
        };
        await ApiService.saveDayData(session.user.email, date, dayData);
      }
    } catch (error) {
      console.error("Error saving after note deletion:", error);
    }
  };

  // Update master checklist
  const updateMasterChecklist = async (updatedItems: ChecklistItem[]) => {
    try {
      // Check for changes in completed items
      const blocksCopy = [...blocks];
      let blocksChanged = false;

      // Compare old and new master checklist to detect changes
      updatedItems.forEach((newItem) => {
        const oldItem = masterChecklist.find((item) => item.id === newItem.id);

        if (oldItem) {
          // Case 1: Item was unchecked (completed -> not completed)
          if (oldItem.completed && !newItem.completed) {
            // Remove from timeblock
            const oldBlockIndex = oldItem.targetBlock;
            if (
              oldBlockIndex !== undefined &&
              oldBlockIndex >= 0 &&
              oldBlockIndex < blocksCopy.length
            ) {
              // Find and remove the note from the old block
              const noteIndex = blocksCopy[oldBlockIndex].notes.findIndex(
                (note) => {
                  // More flexible pattern matching
                  return (
                    note.includes(`✓ ${oldItem.text}`) &&
                    note.includes("(completed")
                  );
                }
              );

              if (noteIndex >= 0) {
                blocksCopy[oldBlockIndex].notes.splice(noteIndex, 1);
                blocksChanged = true;
                console.log(
                  `Removed unchecked item "${oldItem.text}" from block ${oldBlockIndex}`
                );
              }
            }
          }

          // Case 2: Item was reassigned (completed -> still completed but different block)
          else if (
            oldItem.completed &&
            newItem.completed &&
            oldItem.targetBlock !== newItem.targetBlock
          ) {
            const oldBlockIndex = oldItem.targetBlock;
            const newBlockIndex = newItem.targetBlock;

            // Find and remove the note from the old block
            if (
              oldBlockIndex !== undefined &&
              oldBlockIndex >= 0 &&
              oldBlockIndex < blocksCopy.length
            ) {
              const noteIndex = blocksCopy[oldBlockIndex].notes.findIndex(
                (note) => {
                  // More flexible pattern matching
                  return (
                    note.includes(`✓ ${oldItem.text}`) &&
                    note.includes("(completed")
                  );
                }
              );

              if (noteIndex >= 0) {
                const originalNote = blocksCopy[oldBlockIndex].notes[noteIndex];
                blocksCopy[oldBlockIndex].notes.splice(noteIndex, 1);

                // Add to new block if specified
                if (
                  newBlockIndex !== undefined &&
                  newBlockIndex >= 0 &&
                  newBlockIndex < blocksCopy.length
                ) {
                  // Extract timestamp from original note
                  const timestamp = originalNote.match(
                    /\(completed (\d{1,2}:\d{2}[^)]*)\)/
                  )?.[1];
                  const newNote = `✓ ${newItem.text} (completed ${timestamp})`;
                  blocksCopy[newBlockIndex].notes.push(newNote);
                }

                blocksChanged = true;
                console.log(
                  `Reassigned item "${oldItem.text}" from block ${oldBlockIndex} to block ${newBlockIndex}`
                );
              }
            }
          }
        }
      });

      // Update state
      setMasterChecklist(updatedItems);
      if (blocksChanged) {
        setBlocks(blocksCopy);
      }

      // Save to database immediately
      if (session?.user?.email && date) {
        const dayData = {
          wakeTime,
          blocks: blocksChanged ? blocksCopy : blocks,
          masterChecklist: updatedItems,
          habitBreakChecklist,
          todoList,
        };
        await ApiService.saveDayData(session.user.email, date, dayData);
      }
    } catch (error) {
      console.error("Error updating master checklist:", error);
    }
  };

  const updateHabitBreakChecklist = async (updatedItems: ChecklistItem[]) => {
    try {
      setHabitBreakChecklist(updatedItems);
      // Save to database immediately
      if (session?.user?.email && date) {
        const dayData = {
          wakeTime,
          blocks,
          masterChecklist,
          habitBreakChecklist: updatedItems,
          todoList,
        };
        await ApiService.saveDayData(session.user.email, date, dayData);
      }
    } catch (error) {
      console.error("Error updating habit break checklist:", error);
    }
  };

  const updateTodoList = async (updatedItems: ChecklistItem[]) => {
    try {
      setTodoList(updatedItems);
      // Save to database immediately
      if (session?.user?.email && date) {
        const dayData = {
          wakeTime,
          blocks,
          masterChecklist,
          habitBreakChecklist,
          todoList: updatedItems,
        };
        await ApiService.saveDayData(session.user.email, date, dayData);
      }
    } catch (error) {
      console.error("Error updating todo list:", error);
    }
  };

  // Reset day function - clears all data for the current day
  const resetDay = async () => {
    try {
      // Reset all state to default values
      setWakeTime("");
      setBlocks(
        defaultBlocks.map((b) => ({
          ...b,
          notes: [],
          complete: false,
          checklist: undefined,
        }))
      );
      setMasterChecklist(defaultMasterChecklist);
      setHabitBreakChecklist(defaultHabitBreakChecklist);
      setTodoList([]);

      // Save the reset data to database
      if (session?.user?.email && date) {
        const dayData = {
          wakeTime: "",
          blocks: defaultBlocks.map((b) => ({
            ...b,
            notes: [],
            complete: false,
            checklist: undefined,
          })),
          masterChecklist: defaultMasterChecklist,
          habitBreakChecklist: defaultHabitBreakChecklist,
          todoList: [],
        };
        await ApiService.saveDayData(session.user.email, date, dayData);
      }
    } catch (error) {
      console.error("Error resetting day:", error);
    }
  };

  // Handler for todo button with close/reset functionality
  const handleTodoButtonClick = () => {
    if (todoListVisible) {
      // If already visible, close it
      setTodoListVisible(false);
    } else {
      // If not visible, show it and reset position
      setTodoListVisible(true);
      setResetTodoPosition(true);
    }
  };

  // Callback when todo position is reset
  const handleTodoPositionReset = () => {
    setResetTodoPosition(false);
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
      {/* Header with App Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AMP Tracker</h1>
      </div>

      {/* Date Navigation, Wake Time, and Welcome Message - responsive layout */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <DateNavigation currentDate={date} />
          <div className="flex items-center gap-2">
            <label
              htmlFor="wake-time"
              className="text-sm font-medium whitespace-nowrap"
            >
              Woke Time:
            </label>
            <input
              id="wake-time"
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="border rounded-md px-4 py-2 text-sm"
              placeholder="Enter wake time"
            />
          </div>
          <div className="flex items-center">
            <button
              onClick={handleTodoButtonClick}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                todoListVisible
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
              title={todoListVisible ? "Close To-Do List" : "Open To-Do List"}
            >
              📝 To-Do
            </button>
          </div>
        </div>
        <div className="flex items-center">
          <span className="text-base lg:text-lg font-medium">
            Welcome, {session.user?.name || "User"}
          </span>
        </div>
      </div>

      <ScoreBar score={score} />
      <MasterChecklist
        items={masterChecklist}
        onCompleteItem={handleCompleteChecklistItem}
        onUpdateItems={updateMasterChecklist}
      />

      {/* Todo List - Responsive positioning for desktop */}
      <div className="relative hidden md:block">
        <TodoList
          items={todoList}
          onCompleteItem={handleCompleteTodoItem}
          onUpdateItems={updateTodoList}
          isVisible={todoListVisible}
          isMobile={false}
          currentDate={date}
          resetPosition={resetTodoPosition}
          onPositionReset={handleTodoPositionReset}
        />
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
            />
          </div>
        ))}
      </div>
      <div className="mt-8">
        {/* Todo List for mobile - appears above HabitBreakChecklist */}
        <div className="block md:hidden mb-6">
          <TodoList
            items={todoList}
            onCompleteItem={handleCompleteTodoItem}
            onUpdateItems={updateTodoList}
            isVisible={todoListVisible}
            isMobile={true}
            currentDate={date}
            resetPosition={resetTodoPosition}
            onPositionReset={handleTodoPositionReset}
          />
        </div>

        <HabitBreakChecklist
          items={habitBreakChecklist}
          onCompleteItem={handleCompleteHabitBreakItem}
          onUpdateItems={updateHabitBreakChecklist}
        />
      </div>
      <Footer
        onExport={() => exportCSVByDate(date, blocks)}
        onSignOut={() => signOut()}
        onResetDay={resetDay} // Add reset day function to footer
      />
    </main>
  );
}
