"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { ApiService } from "../../../lib/api";
import { useContent } from "../../../hooks/useContent";
import { calculateScore } from "../../../lib/scoring";
import {
  generateTimeBlocks,
  calculateCompletionBlock,
  getUserTimezone,
  getDefaultWakeSettings,
  DailyWakeSettings,
} from "../../../lib/time-block-calculator";
import { Block, ChecklistItem, WakeTimeSettings } from "../../../types";

// Types for context
interface DailyDataContextType {
  // State
  wakeTime: string;
  setWakeTime: (value: string) => void;
  wakeTimeSettings: WakeTimeSettings | null;
  setWakeTimeSettings: (value: WakeTimeSettings | null) => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  todoListVisible: boolean;
  setTodoListVisible: (value: boolean) => void;
  todoList: ChecklistItem[];
  setTodoList: (value: ChecklistItem[]) => void;
  resetTodoPosition: boolean;
  setResetTodoPosition: (value: boolean) => void;
  blocks: Block[];
  setBlocks: (value: Block[]) => void;
  masterChecklist: ChecklistItem[];
  setMasterChecklist: (value: ChecklistItem[]) => void;
  habitBreakChecklist: ChecklistItem[];
  setHabitBreakChecklist: (value: ChecklistItem[]) => void;
  workoutChecklist: ChecklistItem[];
  setWorkoutChecklist: (value: ChecklistItem[]) => void;
  workoutListVisible: boolean;
  setWorkoutListVisible: (value: boolean) => void;
  resetWorkoutPosition: boolean;
  setResetWorkoutPosition: (value: boolean) => void;
  dailyWakeTime: string;
  setDailyWakeTime: (value: string) => void;
  userTimezone: string;
  setUserTimezone: (value: string) => void;
  timeBlocksCollapsed: boolean;
  setTimeBlocksCollapsed: (value: boolean) => void;

  // Computed values
  score: number;

  // Handlers
  handleCompleteChecklistItem: (itemId: string) => void;
  handleCompleteHabitBreakItem: (itemId: string) => void;
  handleCompleteTodoItem: (itemId: string) => Promise<void>;
  toggleComplete: (blockId: string) => Promise<void>;
  addNote: (blockId: string, text: string) => Promise<void>;
  deleteNote: (blockId: string, noteIndex: number) => Promise<void>;
  updateMasterChecklist: (updatedItems: ChecklistItem[]) => Promise<void>;
  updateHabitBreakChecklist: (updatedItems: ChecklistItem[]) => Promise<void>;
  updateTodoList: (updatedItems: ChecklistItem[]) => Promise<void>;
  updateWorkoutChecklist: (updatedItems: ChecklistItem[]) => Promise<void>;
  handleCompleteWorkoutItem: (itemId: string) => void;
  handleDailyWakeTimeChange: (newWakeTime: string) => void;
  resetDay: () => Promise<void>;
  handleTodoButtonClick: () => void;
  handleTodoPositionReset: () => void;
  handleWorkoutButtonClick: () => void;
  handleWorkoutPositionReset: () => void;
  onLabelUpdate: (blockId: string, newLabel: string) => void;
}

const DailyDataContext = createContext<DailyDataContextType | undefined>(
  undefined
);

export const useDailyData = () => {
  const context = useContext(DailyDataContext);
  if (context === undefined) {
    throw new Error("useDailyData must be used within a DailyDataProvider");
  }
  return context;
};

interface DailyDataProviderProps {
  children: ReactNode;
  date: string;
}

export const DailyDataProvider = ({
  children,
  date,
}: DailyDataProviderProps) => {
  const { data: session } = useSession();
  const { contentData } = useContent();

  // All state from the original component
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
  const [workoutChecklist, setWorkoutChecklist] = useState<ChecklistItem[]>([]);
  const [workoutListVisible, setWorkoutListVisible] = useState(false);
  const [resetWorkoutPosition, setResetWorkoutPosition] = useState(false);
  const [dailyWakeTime, setDailyWakeTime] = useState<string>("");
  const [userTimezone, setUserTimezone] = useState<string>("");
  const [timeBlocksCollapsed, setTimeBlocksCollapsed] = useState(false);

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
        defaultWorkoutChecklist: [],
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
      defaultWakeTimeSettings: defaultWakeSettings,
    };
  }, [contentData?.content]);

  // Helper function to ensure date fields are proper Date objects
  const ensureDateObjects = (items: ChecklistItem[]): ChecklistItem[] => {
    return items.map((item) => ({
      ...item,
      completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
    }));
  };

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

  // Helper function to load customized workout items from most recent day (with completion reset)
  const loadCustomizedWorkoutItems = async (
    userData: { days: Record<string, { workoutChecklist?: ChecklistItem[] }> },
    currentDate: string,
    defaultWorkouts: ChecklistItem[]
  ): Promise<ChecklistItem[]> => {
    // Get all dates and find the most recent one with workout customizations
    const dates = Object.keys(userData.days).sort().reverse();

    for (const dateKey of dates) {
      const dayData = userData.days[dateKey];
      if (dayData.workoutChecklist && dayData.workoutChecklist.length > 0) {
        // Found customized workout list - reset completion status for new day
        return dayData.workoutChecklist.map((workout: ChecklistItem) => ({
          ...workout,
          completed: false,
          completedAt: undefined,
          targetBlock: undefined,
          completionTimezone: undefined,
          timezoneOffset: undefined,
        }));
      }
    }

    // No customizations found, use default (ensure proper typing)
    return defaultWorkouts.map((item) => ({ ...item }));
  };

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

  // Initialize user timezone on component mount
  useEffect(() => {
    const timezone = getUserTimezone();
    setUserTimezone(timezone);
  }, []);

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
    wakeTimeSettings,
    getDefaultContent,
  ]);

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
          defaultWorkoutChecklist,
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
          } else if (dayData.wakeTime) {
            // Sync dailyWakeTime with wakeTime if only wakeTime is set
            setDailyWakeTime(dayData.wakeTime);
          }
          if (dayData.userTimezone) {
            setUserTimezone(dayData.userTimezone);
          }

          // Ensure dates are proper Date objects
          const masterChecklist =
            dayData.masterChecklist || defaultMasterChecklist;
          const habitBreakChecklist =
            dayData.habitBreakChecklist || defaultHabitBreakChecklist;

          // Load customized workout items (preserves user customizations, resets completion)
          let workoutChecklist = dayData.workoutChecklist || [];
          if (workoutChecklist.length === 0) {
            // No workout data for today, load customized list from previous days
            workoutChecklist = await loadCustomizedWorkoutItems(
              userData,
              date,
              defaultWorkoutChecklist
            );
          } else {
            // Reset completion status for existing workout items (daily reset)
            workoutChecklist = workoutChecklist.map(
              (workout: ChecklistItem) => ({
                ...workout,
                completed: false,
                completedAt: undefined,
                targetBlock: undefined,
                completionTimezone: undefined,
                timezoneOffset: undefined,
              })
            );
          }

          let todoList = dayData.todoList || [];

          // Auto-load uncompleted todo items from previous days
          todoList = await loadPreviousTodoItems(userData, date, todoList);

          setMasterChecklist(ensureDateObjects(masterChecklist));
          setHabitBreakChecklist(ensureDateObjects(habitBreakChecklist));
          setWorkoutChecklist(ensureDateObjects(workoutChecklist));
          setTodoList(ensureDateObjects(todoList));
        } else {
          // If no data for this day, load customized workouts and previous uncompleted todos
          const todoList = await loadPreviousTodoItems(userData, date, []);
          const workoutChecklist = await loadCustomizedWorkoutItems(
            userData,
            date,
            defaultWorkoutChecklist
          );

          setTodoList(ensureDateObjects(todoList));
          setWorkoutChecklist(ensureDateObjects(workoutChecklist));
        }
      } catch (error) {
        console.error("Error loading day data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [session, date, getDefaultContent]);

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
          workoutChecklist,
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
    workoutChecklist,
    todoList,
    date,
    session,
    isLoading,
    dailyWakeTime,
    userTimezone,
  ]);

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
              workoutChecklist,
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
              workoutChecklist,
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
            workoutChecklist,
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
            workoutChecklist,
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
          workoutChecklist,
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
          workoutChecklist,
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
          workoutChecklist,
          todoList: updatedItems,
        };
        await ApiService.saveDayData(session.user.email, date, dayData);
      }
    } catch (error) {
      console.error("Error updating todo list:", error);
    }
  };

  const updateWorkoutChecklist = async (updatedItems: ChecklistItem[]) => {
    try {
      setWorkoutChecklist(updatedItems);
      // Save to database immediately
      if (session?.user?.email && date) {
        const dayData = {
          wakeTime,
          blocks,
          masterChecklist,
          habitBreakChecklist,
          workoutChecklist: updatedItems,
          todoList,
        };
        await ApiService.saveDayData(session.user.email, date, dayData);
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
          : getTimeBlockForCompletion(completionTime, date);

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
    }
  };

  // Handler for daily wake time changes
  const handleDailyWakeTimeChange = (newWakeTime: string) => {
    setDailyWakeTime(newWakeTime);
    // Also sync with the main wakeTime field to hide the banner
    if (newWakeTime) {
      setWakeTime(newWakeTime);
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
            workoutChecklist: defaultWorkoutChecklist as ChecklistItem[],
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

  const onLabelUpdate = (blockId: string, newLabel: string) => {
    const updatedBlocks = [...blocks];
    const realBlockIndex = updatedBlocks.findIndex((b) => b.id === blockId);
    if (realBlockIndex !== -1) {
      updatedBlocks[realBlockIndex].label = newLabel;
      setBlocks(updatedBlocks);
    }
  };

  // Computed values
  const score = calculateScore(blocks);

  const value = {
    // State
    wakeTime,
    setWakeTime,
    wakeTimeSettings,
    setWakeTimeSettings,
    isLoading,
    setIsLoading,
    todoListVisible,
    setTodoListVisible,
    todoList,
    setTodoList,
    resetTodoPosition,
    setResetTodoPosition,
    blocks,
    setBlocks,
    masterChecklist,
    setMasterChecklist,
    habitBreakChecklist,
    setHabitBreakChecklist,
    workoutChecklist,
    setWorkoutChecklist,
    workoutListVisible,
    setWorkoutListVisible,
    resetWorkoutPosition,
    setResetWorkoutPosition,
    dailyWakeTime,
    setDailyWakeTime,
    userTimezone,
    setUserTimezone,
    timeBlocksCollapsed,
    setTimeBlocksCollapsed,

    // Computed values
    score,

    // Handlers
    handleCompleteChecklistItem,
    handleCompleteHabitBreakItem,
    handleCompleteTodoItem,
    toggleComplete,
    addNote,
    deleteNote,
    updateMasterChecklist,
    updateHabitBreakChecklist,
    updateTodoList,
    updateWorkoutChecklist,
    handleCompleteWorkoutItem,
    handleDailyWakeTimeChange,
    resetDay,
    handleTodoButtonClick,
    handleTodoPositionReset,
    handleWorkoutButtonClick,
    handleWorkoutPositionReset,
    onLabelUpdate,
  };

  return (
    <DailyDataContext.Provider value={value}>
      {children}
    </DailyDataContext.Provider>
  );
};
