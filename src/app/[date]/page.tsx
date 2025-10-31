"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  getUserDataByDate,
  createMasterChecklistItem,
  createHabitChecklistItem,
  createWorkoutChecklistItem,
  createTodoItem,
  saveDayData,
} from "../../lib/user-actions";
import { exportCSVByDate } from "../../lib/storage";
import { getTodayStorageDate } from "../../lib/date-utils";
import { useContent } from "../../hooks/useContent";
import DateNavigation from "../../components/DateNavigation";
import TimeBlock from "../../components/TimeBlock";
import ScoreBar from "../../components/ScoreBar";
import MasterChecklist from "../../components/MasterChecklist";
import HabitBreakChecklist from "../../components/HabitBreakChecklist";
import TodoList from "../../components/TodoList";
import WorkoutChecklist from "../../components/WorkoutChecklist";
import Footer from "../../components/Footer";
import AdminViewToggle from "../../components/AdminViewToggle";
import { calculateScore } from "../../lib/scoring";
import {
  generateSimpleTimeBlocks,
  calculateSimpleCompletionBlock,
} from "../../lib/simple-time-blocks";
import { Block, ChecklistItem } from "../../types";

export default function DailyPage() {
  const params = useParams();
  const router = useRouter();
  const date = params?.date as string;
  const { data: session } = useSession();
  const { contentData } = useContent();

  const [isLoading, setIsLoading] = useState(true);
  const [wakeTime, setWakeTime] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [todoListVisible, setTodoListVisible] = useState(false);
  const [todoList, setTodoList] = useState<ChecklistItem[]>([]);
  const [resetTodoPosition, setResetTodoPosition] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [masterChecklist, setMasterChecklist] = useState<ChecklistItem[]>([]);
  const [habitBreakChecklist, setHabitBreakChecklist] = useState<
    ChecklistItem[]
  >([]);
  const [workoutChecklist, setWorkoutChecklist] = useState<ChecklistItem[]>([]);
  const [workoutListVisible, setWorkoutListVisible] = useState(false);
  const [resetWorkoutPosition, setResetWorkoutPosition] = useState(false);
  // New state for enhanced time tracking
  const [userTimezone, setUserTimezone] = useState<string>("");
  // Time blocks collapse state
  const [timeBlocksCollapsed, setTimeBlocksCollapsed] = useState(false);

  // Get default content from dynamic templates
  const getDefaultContent = useCallback(() => {
    // Always use the new 24-hour block system
    const defaultTimeBlocks = generateSimpleTimeBlocks();
    const defaultBlocks = defaultTimeBlocks.map((config) => ({
      id: config.id,
      time: config.time,
      label: config.label,
      notes: config.notes,
      complete: config.complete,
      duration: 60,
      index: config.index,
    }));

    if (!contentData?.content) {
      return {
        defaultBlocks,
        defaultMasterChecklist: [],
        defaultHabitBreakChecklist: [],
        defaultWorkoutChecklist: [],
      };
    }

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

    const defaultWorkoutChecklist =
      contentData.content.workoutChecklist?.map((wc) => ({
        id: wc.id,
        text: wc.text,
        completed: false,
        category: wc.category as ChecklistItem["category"],
      })) || [];

    return {
      defaultBlocks,
      defaultMasterChecklist,
      defaultHabitBreakChecklist,
      defaultWorkoutChecklist,
    };
  }, [contentData?.content]);

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
          defaultWorkoutChecklist,
        } = defaults;

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
        if (workoutChecklist.length === 0) {
          setWorkoutChecklist(defaultWorkoutChecklist as ChecklistItem[]);
        }
      }
    }
  }, [
    contentData,
    blocks.length,
    masterChecklist.length,
    habitBreakChecklist.length,
    workoutChecklist.length,
    getDefaultContent,
  ]);

  // Note: Time block structure is now fixed at 24 blocks (00:00 to 23:59)
  // No longer need dynamic calculation based on wake times

  // Load data from server actions when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.email || !date) return;

      try {
        setIsLoading(true);

        // Use our new unified server action instead of ApiService
        const result = await getUserDataByDate(session.user.email, date);

        if (!result.success || !result.data) {
          console.error("Failed to load user data:", result.error);
          return;
        }

        const dayData = result.data;

        // Get default content for blocks only
        const defaults = getDefaultContent();
        const { defaultBlocks } = defaults;

        // Load the data directly from server action result
        setWakeTime(dayData.wakeTime || "");
        setWeight(dayData.weight || "");

        // Generate 24-hour blocks and merge with any existing timeblock notes from database
        const blocksWithNotes = defaultBlocks.map((block, index) => {
          // Check if there's existing timeblock data with notes for this index
          const existingBlock = dayData.blocks?.find((b) => b.index === index);
          return {
            ...block,
            notes: existingBlock?.notes || [],
            complete: existingBlock?.complete || false,
            checklist: undefined,
          };
        });
        setBlocks(blocksWithNotes);

        // Load timezone settings
        setUserTimezone(dayData.userTimezone);

        // Load checklists directly from server action result (inheritance handled in server action)
        setMasterChecklist(
          ensureDateObjects(dayData.masterChecklist as ChecklistItem[])
        );
        setHabitBreakChecklist(
          ensureDateObjects(dayData.habitBreakChecklist as ChecklistItem[])
        );

        // Load workout checklist directly from server action (inheritance handled in server action)
        setWorkoutChecklist(ensureDateObjects(dayData.workoutChecklist));

        // Load todo list
        setTodoList(ensureDateObjects(dayData.todoList));
      } catch (error) {
        console.error("Error loading day data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [session, date, getDefaultContent]);

  // Note: Auto-save removed - server actions now handle persistence automatically
  // Data is saved immediately when items are created via server actions

  // Enhanced time block assignment function that uses the new 18-hour system
  const getTimeBlockForCompletion = (completionTime: Date): number => {
    // Use the simple 24-hour time block calculator
    const blockIndex = calculateSimpleCompletionBlock(completionTime);

    // Ensure we don't exceed the 24 block limit (0-23)
    return Math.min(Math.max(blockIndex, 0), 23);
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
          : getTimeBlockForCompletion(completionTime);

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

      // Save blocks and checklist to database
      if (session?.user?.email) {
        saveDayData(session.user.email, date, {
          blocks: updatedBlocks,
          masterChecklist: updatedChecklist,
        }).catch(console.error);
      }
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
          : getTimeBlockForCompletion(now);

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
            await saveDayData(session.user.email, date, {
              blocks: updatedBlocks,
              habitBreakChecklist: updatedItems,
            });
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
            await saveDayData(session.user.email, date, {
              blocks: updatedBlocks,
              todoList: updatedTodoList,
            });
          }
        } catch (error) {
          console.error("Error saving todo item uncheck:", error);
        }
      } else {
        // Item is being checked - add to blocks and mark as complete
        const targetBlockIndex =
          completedItem.targetBlock !== undefined
            ? completedItem.targetBlock
            : getTimeBlockForCompletion(completionTime);

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
            await saveDayData(session.user.email, date, {
              blocks: updatedBlocks,
              todoList: updatedTodoList,
            });
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
          await saveDayData(session.user.email, date, {
            blocks: copy,
          });
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
          await saveDayData(session.user.email, date, {
            blocks: copy,
          });
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
    let updatedMasterChecklist = masterChecklist;

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
          updatedMasterChecklist = updatedChecklist;
        }
      }
    }

    copy[blockIndex].notes.splice(noteIndex, 1);
    setBlocks(copy);

    // Save to database immediately
    try {
      if (session?.user?.email && date) {
        await saveDayData(session.user.email, date, {
          blocks: copy,
          masterChecklist: updatedMasterChecklist,
        });
      }
    } catch (error) {
      console.error("Error saving after note deletion:", error);
    }
  };

  // Update master checklist
  const updateMasterChecklist = async (updatedItems: ChecklistItem[]) => {
    try {
      // Check for new items (not in current state) and create via server action
      const newItems = updatedItems.filter(
        (item) => !masterChecklist.find((existing) => existing.id === item.id)
      );

      // Create new items via server action for persistence
      for (const newItem of newItems) {
        if (session?.user?.email) {
          await createMasterChecklistItem(
            session.user.email,
            newItem.text,
            newItem.category,
            date
          );
        }
      }

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
        await saveDayData(session.user.email, date, {
          masterChecklist: updatedItems,
          blocks: blocksChanged ? blocksCopy : undefined,
        });
      }
    } catch (error) {
      console.error("Error updating master checklist:", error);
    }
  };

  const updateHabitBreakChecklist = async (updatedItems: ChecklistItem[]) => {
    try {
      // Check for new items (not in current state) and create via server action
      const newItems = updatedItems.filter(
        (item) =>
          !habitBreakChecklist.find((existing) => existing.id === item.id)
      );

      // Create new items via server action for persistence
      for (const newItem of newItems) {
        if (session?.user?.email) {
          await createHabitChecklistItem(
            session.user.email,
            newItem.text,
            newItem.category,
            date
          );
        }
      }

      setHabitBreakChecklist(updatedItems);

      // Save to database immediately
      if (session?.user?.email && date) {
        await saveDayData(session.user.email, date, {
          habitBreakChecklist: updatedItems,
        });
      }
    } catch (error) {
      console.error("Error updating habit break checklist:", error);
    }
  };

  const updateTodoList = async (updatedItems: ChecklistItem[]) => {
    try {
      // Check for new items (not in current state) and create via server action
      const newItems = updatedItems.filter(
        (item) => !todoList.find((existing) => existing.id === item.id)
      );

      // Create new items via server action for persistence
      for (const newItem of newItems) {
        if (session?.user?.email) {
          await createTodoItem(
            session.user.email,
            newItem.text,
            newItem.category,
            date
          );
        }
      }

      setTodoList(updatedItems);

      // Save to database immediately
      if (session?.user?.email && date) {
        await saveDayData(session.user.email, date, {
          todoList: updatedItems,
        });
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
          defaultWorkoutChecklist,
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
        setWorkoutChecklist(defaultWorkoutChecklist as ChecklistItem[]);
        setTodoList([]);

        // Save the reset data to database
        if (session?.user?.email && date) {
          await saveDayData(session.user.email, date, {
            wakeTime: "",
            blocks: defaultBlocks.map((b) => ({
              ...b,
              notes: [],
              complete: false,
              checklist: undefined,
            })),
            masterChecklist: defaultMasterChecklist as ChecklistItem[],
            habitBreakChecklist: defaultHabitBreakChecklist as ChecklistItem[],
            workoutChecklist: defaultWorkoutChecklist as ChecklistItem[],
            todoList: [],
          });
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

  // Handler for workout button with close/reset functionality
  const handleWorkoutButtonClick = () => {
    if (workoutListVisible) {
      // If already visible, close it
      setWorkoutListVisible(false);
    } else {
      // If not visible, show it and reset position
      setWorkoutListVisible(true);
      setResetWorkoutPosition(true);
    }
  };

  // Callback when workout position is reset
  const handleWorkoutPositionReset = () => {
    setResetWorkoutPosition(false);
  };

  // Update workout checklist
  const updateWorkoutChecklist = async (updatedItems: ChecklistItem[]) => {
    try {
      // Check for new items (not in current state) and create via server action
      const newItems = updatedItems.filter(
        (item) => !workoutChecklist.find((existing) => existing.id === item.id)
      );

      // Create new items via server action for persistence
      for (const newItem of newItems) {
        if (session?.user?.email) {
          await createWorkoutChecklistItem(
            session.user.email,
            newItem.text,
            newItem.category,
            date
          );
        }
      }

      setWorkoutChecklist(updatedItems);

      // Save to database immediately
      if (session?.user?.email && date) {
        await saveDayData(session.user.email, date, {
          workoutChecklist: updatedItems,
        });
      }
    } catch (error) {
      console.error("Error updating workout checklist:", error);
    }
  };

  // Handle workout item completion
  const handleCompleteWorkoutItem = (itemId: string) => {
    const completedItem = workoutChecklist.find((item) => item.id === itemId);
    if (completedItem) {
      const completionTime = new Date();
      // Use manually assigned target block or auto-assign based on new time rules
      const targetBlockIndex =
        completedItem.targetBlock !== undefined
          ? completedItem.targetBlock
          : getTimeBlockForCompletion(completionTime);

      const timestamp = completionTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const noteText = `💪 ${completedItem.text} (completed ${timestamp})`;

      const updatedBlocks = [...blocks];
      updatedBlocks[targetBlockIndex].notes.push(noteText);
      setBlocks(updatedBlocks);

      const updatedChecklist = workoutChecklist.map((item) =>
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
      setWorkoutChecklist(updatedChecklist);

      // Save blocks and checklist to database
      if (session?.user?.email) {
        saveDayData(session.user.email, date, {
          blocks: updatedBlocks,
          workoutChecklist: updatedChecklist,
        }).catch(console.error);
      }
    }
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
              Wake Time:
            </label>
            <input
              id="wake-time"
              type="text"
              value={wakeTime ? wakeTime : ""}
              onChange={async (e) => {
                let value = e.target.value.replace(/\D/g, ""); // Remove non-digits

                // Format as --:-- (military time)
                if (value.length >= 3) {
                  value = value.slice(0, 2) + ":" + value.slice(2, 4);
                }

                // Validate time (00:00 - 23:59)
                if (value.length === 5) {
                  const [hours, minutes] = value.split(":");
                  const h = parseInt(hours);
                  const m = parseInt(minutes);
                  if (h > 23 || m > 59) return; // Invalid time
                }

                setWakeTime(value);

                // Save to database only when complete (5 chars = HH:MM)
                if (value.length === 5) {
                  try {
                    if (session?.user?.email && date) {
                      await saveDayData(session.user.email, date, {
                        wakeTime: value,
                      });
                    }
                  } catch (error) {
                    console.error("Error saving wake time:", error);
                  }
                }
              }}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  // Save on Enter key press
                  try {
                    if (session?.user?.email && date) {
                      await saveDayData(session.user.email, date, {
                        wakeTime: wakeTime,
                      });
                    }
                    // Remove focus from input after saving
                    e.currentTarget.blur();
                  } catch (error) {
                    console.error("Error saving wake time:", error);
                  }
                }
              }}
              onBlur={async () => {
                // Save on blur even if incomplete, or clear if empty
                if (wakeTime.length === 0 || wakeTime.length === 5) {
                  try {
                    if (session?.user?.email && date) {
                      await saveDayData(session.user.email, date, {
                        wakeTime: wakeTime,
                      });
                    }
                  } catch (error) {
                    console.error("Error saving wake time:", error);
                  }
                }
              }}
              className="border rounded-md px-3 py-1 text-sm w-16 text-center font-mono"
              placeholder="--:--"
              maxLength={5}
            />
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="weight"
              className="text-sm font-medium whitespace-nowrap"
            >
              Weight:
            </label>
            <input
              id="weight"
              type="text"
              value={weight ? weight : ""}
              onChange={async (e) => {
                let value = e.target.value.replace(/[^\d.]/g, ""); // Only digits and decimal

                // Ensure only one decimal point
                const parts = value.split(".");
                if (parts.length > 2) {
                  value = parts[0] + "." + parts.slice(1).join("");
                }

                // Limit to 4 total digits (including decimal)
                if (parts[1] && parts[1].length > 1) {
                  value = parts[0] + "." + parts[1].slice(0, 1);
                }
                if (parts[0].length > 3) {
                  value =
                    parts[0].slice(0, 3) + (parts[1] ? "." + parts[1] : "");
                }

                setWeight(value);

                // Save to database when user pauses typing
                if (value.length > 0) {
                  try {
                    if (session?.user?.email && date) {
                      await saveDayData(session.user.email, date, {
                        weight: value,
                      });
                    }
                  } catch (error) {
                    console.error("Error saving weight:", error);
                  }
                }
              }}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  // Save on Enter key press
                  try {
                    if (session?.user?.email && date) {
                      await saveDayData(session.user.email, date, {
                        weight: weight,
                      });
                    }
                    // Remove focus from input after saving
                    e.currentTarget.blur();
                  } catch (error) {
                    console.error("Error saving weight:", error);
                  }
                }
              }}
              onBlur={async () => {
                // Save on blur
                try {
                  if (session?.user?.email && date) {
                    await saveDayData(session.user.email, date, {
                      weight: weight,
                    });
                  }
                } catch (error) {
                  console.error("Error saving weight:", error);
                }
              }}
              className="border rounded-md px-3 py-1 text-sm w-16 text-center font-mono"
              placeholder="---.-"
              maxLength={5}
            />
            <span className="text-sm text-gray-600">lbs</span>
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
          <div className="flex items-center">
            <button
              onClick={handleWorkoutButtonClick}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                workoutListVisible
                  ? "bg-purple-500 text-white hover:bg-purple-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
              title={
                workoutListVisible ? "Close P90X Workout" : "Open P90X Workout"
              }
            >
              💪 P90X
            </button>
          </div>

          {/* Admin View Toggle - only visible to admin users */}
          <AdminViewToggle />
        </div>
        <div className="flex items-center">
          <span className="text-base lg:text-lg font-medium">
            Welcome, {session?.user?.name || "User"}
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

      {/* Workout Checklist - Responsive positioning for desktop */}
      <div className="relative hidden md:block">
        <WorkoutChecklist
          items={workoutChecklist}
          onCompleteItem={handleCompleteWorkoutItem}
          onUpdateItems={updateWorkoutChecklist}
          isVisible={workoutListVisible}
          isMobile={false}
          currentDate={date}
          resetPosition={resetWorkoutPosition}
          onPositionReset={handleWorkoutPositionReset}
        />
      </div>

      {/* Time Blocks Section with Collapse */}
      <div className="mb-8">
        {/* Time Blocks Header */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Time Blocks ({blocks.length})
          </h2>
          <button
            onClick={() => setTimeBlocksCollapsed(!timeBlocksCollapsed)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
            title={
              timeBlocksCollapsed
                ? "Expand Time Blocks"
                : "Collapse Time Blocks"
            }
          >
            <span>{timeBlocksCollapsed ? "Expand" : "Collapse"}</span>
            <svg
              className={`w-4 h-4 transition-transform ${
                timeBlocksCollapsed ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Time Blocks Grid */}
        {!timeBlocksCollapsed && (
          <div className="columns-1 md:columns-2 xl:columns-3 gap-12">
            {blocks.map((block, i) => (
              <div
                key={block.id || `block-${i}`}
                className="break-inside-avoid mb-4"
              >
                <TimeBlock
                  block={block}
                  index={i}
                  toggleComplete={toggleComplete}
                  addNote={addNote}
                  deleteNote={deleteNote}
                  onLabelUpdate={async (blockId, newLabel) => {
                    const updatedBlocks = [...blocks];
                    const realBlockIndex = updatedBlocks.findIndex(
                      (b) => b.id === blockId
                    );
                    if (realBlockIndex !== -1) {
                      updatedBlocks[realBlockIndex].label = newLabel;
                      setBlocks(updatedBlocks);

                      // Save to database immediately
                      try {
                        if (session?.user?.email && date) {
                          await saveDayData(session.user.email, date, {
                            blocks: updatedBlocks,
                          });
                        }
                      } catch (error) {
                        console.error(
                          "Error saving block label update:",
                          error
                        );
                      }
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
        )}
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

        {/* Workout Checklist for mobile - appears above HabitBreakChecklist */}
        <div className="block md:hidden mb-6">
          <WorkoutChecklist
            items={workoutChecklist}
            onCompleteItem={handleCompleteWorkoutItem}
            onUpdateItems={updateWorkoutChecklist}
            isVisible={workoutListVisible}
            isMobile={true}
            currentDate={date}
            resetPosition={resetWorkoutPosition}
            onPositionReset={handleWorkoutPositionReset}
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
        onSignOut={() => signOut({ callbackUrl: "/auth/signin" })}
        onResetDay={resetDay} // Add reset day function to footer
      />
    </main>
  );
}
