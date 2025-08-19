"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ApiService } from "../../lib/api";
import { exportCSVByDate } from "../../lib/storage";
import { getTodayStorageDate } from "../../lib/date-utils";
import { useContent } from "../../hooks/useContent";
import DateNavigation from "../../components/DateNavigation";
import TimeBlock from "../../components/TimeBlock";
import ScoreBar from "../../components/ScoreBar";
import MasterChecklist from "../../components/MasterChecklist";
import HabitBreakChecklist from "../../components/HabitBreakChecklist";
import TodoList from "../../components/TodoList";
import Footer from "../../components/Footer";
import WakeTimeInput from "../../components/WakeTimeInput";
import { calculateScore } from "../../lib/scoring";
import {
  generateTimeBlocks,
  calculateCompletionBlock,
  getUserTimezone,
  getDefaultWakeSettings,
  DailyWakeSettings,
} from "../../lib/time-block-calculator";
import { Block, ChecklistItem, WakeTimeSettings } from "../../types";

export default function DailyPage() {
  const params = useParams();
  const router = useRouter();
  const date = params?.date as string;
  const { data: session } = useSession();
  const { contentData } = useContent();

  const [wakeTime, setWakeTime] = useState<string>("");
  const [wakeTimeSettings, setWakeTimeSettings] =
    useState<WakeTimeSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [todoListVisible, setTodoListVisible] = useState(false);
  const [todoList, setTodoList] = useState<ChecklistItem[]>([]);
  const [resetTodoPosition, setResetTodoPosition] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [masterChecklist, setMasterChecklist] = useState<ChecklistItem[]>([]);
  const [habitBreakChecklist, setHabitBreakChecklist] = useState<
    ChecklistItem[]
  >([]);
  // New state for enhanced time tracking
  const [dailyWakeTime, setDailyWakeTime] = useState<string>("");
  const [userTimezone, setUserTimezone] = useState<string>("");

  // Get default content from dynamic templates
  const getDefaultContent = useCallback(() => {
    if (!contentData?.content) {
      // Use the new 18-hour block system as fallback
      const defaultTimeBlocks = generateTimeBlocks();
      const defaultBlocks = defaultTimeBlocks.map((config) => ({
        id: `block-${config.index}`,
        time: config.timeLabel,
        label: `Block ${config.index + 1}`,
        notes: [],
        complete: false,
        duration: 60,
        index: config.index,
      }));

      return {
        defaultBlocks,
        defaultMasterChecklist: [],
        defaultHabitBreakChecklist: [],
        defaultWakeTimeSettings: getDefaultWakeSettings(),
      };
    }

    // Initialize wake time settings based on user role
    const defaultWakeSettings = getDefaultWakeSettings();

    // Use the new 18-hour block system instead of dynamic calculation
    const defaultTimeBlocks = generateTimeBlocks();

    const defaultBlocks = defaultTimeBlocks.map((config, index) => ({
      id:
        contentData.content.timeBlocks?.[index]?.id || `block-${config.index}`,
      time: config.timeLabel,
      label:
        contentData.content.timeBlocks?.[index]?.label ||
        `Time Block ${index + 1}`,
      notes: [],
      complete: false,
      duration: 60,
      index: config.index,
    }));

    const defaultMasterChecklist =
      contentData.content.masterChecklist?.map((mc) => ({
        id: mc.id,
        text: mc.text,
        completed: false,
        category: mc.category,
      })) || [];

    const defaultHabitBreakChecklist =
      contentData.content.habitBreakChecklist?.map((hb) => ({
        id: hb.id,
        text: hb.text,
        completed: false,
        category: hb.category,
      })) || [];

    return {
      defaultBlocks,
      defaultMasterChecklist,
      defaultHabitBreakChecklist,
      defaultWakeTimeSettings: defaultWakeSettings,
    };
  }, [contentData?.content]);
  // Initialize user timezone on component mount
  useEffect(() => {
    const timezone = getUserTimezone();
    setUserTimezone(timezone);
  }, []);

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

  // Helper function to ensure date fields are proper Date objects
  const ensureDateObjects = (items: ChecklistItem[]): ChecklistItem[] => {
    return items.map((item) => ({
      ...item,
      completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
    }));
  };

  // Initialize default state when content is loaded
  useEffect(() => {
    if (contentData?.content) {
      const defaults = getDefaultContent();
      if (typeof defaults === "object" && "defaultBlocks" in defaults) {
        const {
          defaultBlocks,
          defaultMasterChecklist,
          defaultHabitBreakChecklist,
          defaultWakeTimeSettings,
        } = defaults;

        // Initialize wake time settings if not already set
        if (!wakeTimeSettings && defaultWakeTimeSettings) {
          setWakeTimeSettings(defaultWakeTimeSettings);
        }

        // Only set initial state if we haven't loaded user data yet
        if (blocks.length === 0) {
          setBlocks(defaultBlocks);
        }
        if (masterChecklist.length === 0) {
          setMasterChecklist(defaultMasterChecklist as ChecklistItem[]);
        }
        if (habitBreakChecklist.length === 0) {
          setHabitBreakChecklist(defaultHabitBreakChecklist as ChecklistItem[]);
        }
      }
    }
  }, [
    contentData,
    blocks.length,
    masterChecklist.length,
    habitBreakChecklist.length,
    wakeTimeSettings,
    getDefaultContent,
  ]);

  // Note: Time block structure is now fixed at 18 blocks (4:00 a.m. to 9:00 p.m.)
  // This useEffect can be removed as we no longer dynamically calculate blocks
  useEffect(() => {
    // No longer needed - time blocks are static
  }, [wakeTimeSettings]);

  // Load data from API when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.email || !date) return;

      try {
        setIsLoading(true);
        const userData = await ApiService.getUserData(session.user.email);
        const dayData = userData.days[date];

        // Get default content
        const defaults = getDefaultContent();
        const {
          defaultBlocks,
          defaultMasterChecklist,
          defaultHabitBreakChecklist,
        } = defaults;

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
          // Load new daily wake time and timezone settings
          if (dayData.dailyWakeTime) {
            setDailyWakeTime(dayData.dailyWakeTime);
          }
          if (dayData.userTimezone) {
            setUserTimezone(dayData.userTimezone);
          }

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
  }, [session, date, getDefaultContent]);

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
          // Include new fields for daily wake time and timezone
          dailyWakeTime,
          userTimezone,
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
    dailyWakeTime,
    userTimezone,
  ]);

  // Enhanced time block assignment function that uses the new 18-hour system
  const getTimeBlockForCompletion = (
    completionTime: Date,
    currentPageDate: string
  ): number => {
    // Use the new 18-hour time block calculator with wake time settings
    const wakeSettings: DailyWakeSettings | undefined = dailyWakeTime
      ? { wakeTime: dailyWakeTime, date: currentPageDate }
      : undefined;

    const completionRecord = calculateCompletionBlock(
      completionTime,
      wakeSettings,
      userTimezone
    );

    // Ensure we don't exceed the 18 block limit (0-17)
    return Math.min(completionRecord.blockIndex, 17);
  };

  // Handle completed items from master checklist
  const handleCompleteChecklistItem = (itemId: string) => {
    const completedItem = masterChecklist.find((item) => item.id === itemId);
    if (completedItem) {
      const completionTime = new Date();
      // Use manually assigned target block or auto-assign based on new time rules
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
              // Store timezone information for audit (optional enhancement)
              completionTimezone: userTimezone,
              timezoneOffset: new Date().getTimezoneOffset(),
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
      // Use manually assigned target block or auto-assign based on new time rules
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
              // Store timezone information for audit (optional enhancement)
              completionTimezone: userTimezone,
              timezoneOffset: new Date().getTimezoneOffset(),
            }
          : item
      );
      setHabitBreakChecklist(updatedItems);

      // Save to database immediately
      const saveData = async () => {
        try {
          if (session?.user?.email && date) {
            const dayData = {
              wakeTime,
              blocks: updatedBlocks,
              masterChecklist,
              habitBreakChecklist: updatedItems,
              todoList,
              // Include new fields for daily wake time and timezone
              dailyWakeTime,
              userTimezone,
            };
            await ApiService.saveDayData(session.user.email, date, dayData);
          }
        } catch (error) {
          console.error("Error saving habit break completion:", error);
        }
      };
      saveData();
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
                // Store timezone information for audit (optional enhancement)
                completionTimezone: userTimezone,
                timezoneOffset: new Date().getTimezoneOffset(),
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

  const toggleComplete = async (blockId: string) => {
    const copy = [...blocks];
    const blockIndex = copy.findIndex((block) => block.id === blockId);
    if (blockIndex !== -1) {
      copy[blockIndex].complete = !copy[blockIndex].complete;
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
    }
  };

  const addNote = async (blockId: string, text: string) => {
    const copy = [...blocks];
    const blockIndex = copy.findIndex((block) => block.id === blockId);
    if (blockIndex !== -1 && text.trim()) {
      copy[blockIndex].notes.push(text);
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

  const deleteNote = async (blockId: string, noteIndex: number) => {
    const copy = [...blocks];
    const blockIndex = copy.findIndex((block) => block.id === blockId);

    if (blockIndex === -1) return;

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
      // Get default content
      const defaults = getDefaultContent();
      if (typeof defaults === "object" && "defaultBlocks" in defaults) {
        const {
          defaultBlocks,
          defaultMasterChecklist,
          defaultHabitBreakChecklist,
        } = defaults;

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
        setMasterChecklist(defaultMasterChecklist as ChecklistItem[]);
        setHabitBreakChecklist(defaultHabitBreakChecklist as ChecklistItem[]);
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
            masterChecklist: defaultMasterChecklist as ChecklistItem[],
            habitBreakChecklist: defaultHabitBreakChecklist as ChecklistItem[],
            todoList: [],
          };
          await ApiService.saveDayData(session.user.email, date, dayData);
        }
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

  // Handler for daily wake time changes
  const handleDailyWakeTimeChange = (newWakeTime: string) => {
    setDailyWakeTime(newWakeTime);
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
            Welcome, {session?.user?.name || "User"}
          </span>
        </div>
      </div>

      {/* Daily Wake Time Input for Time Block Assignment */}
      <WakeTimeInput
        currentWakeTime={dailyWakeTime}
        onWakeTimeChange={handleDailyWakeTimeChange}
        date={date}
      />

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
          <div
            key={block.id || `block-${i}`}
            className="break-inside-avoid mb-4"
          >
            <TimeBlock
              block={block}
              index={i}
              date={date}
              toggleComplete={toggleComplete}
              addNote={addNote}
              deleteNote={deleteNote}
              onLabelUpdate={(blockId, newLabel) => {
                const updatedBlocks = [...blocks];
                const realBlockIndex = updatedBlocks.findIndex(
                  (b) => b.id === blockId
                );
                if (realBlockIndex !== -1) {
                  updatedBlocks[realBlockIndex].label = newLabel;
                  setBlocks(updatedBlocks);
                }
              }}
              onError={(error) => {
                console.error("TimeBlock error:", error);
                // You could add a toast notification here
              }}
              isAdmin={contentData?.userRole === "admin"}
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
