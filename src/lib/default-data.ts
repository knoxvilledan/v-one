import { ChecklistItem, Block } from "../types";

// Default data for public users (blank templates)
export const defaultPublicMasterChecklist: ChecklistItem[] = [
  // Morning routine
  {
    id: "m1",
    text: "Morning routine item 1",
    completed: false,
    category: "morning",
  },
  {
    id: "m2",
    text: "Morning routine item 2",
    completed: false,
    category: "morning",
  },
  {
    id: "m3",
    text: "Morning routine item 3",
    completed: false,
    category: "morning",
  },

  // Work tasks
  {
    id: "w1",
    text: "Work task 1",
    completed: false,
    category: "work",
  },
  {
    id: "w2",
    text: "Work task 2",
    completed: false,
    category: "work",
  },

  // Tech tasks
  {
    id: "t1",
    text: "Tech learning goal 1",
    completed: false,
    category: "tech",
  },
  {
    id: "t2",
    text: "Tech project 1",
    completed: false,
    category: "tech",
  },

  // House/Family tasks
  {
    id: "h1",
    text: "Household task 1",
    completed: false,
    category: "house",
  },
  {
    id: "h2",
    text: "Family time",
    completed: false,
    category: "house",
  },

  // Wrap-up tasks
  {
    id: "wr1",
    text: "Plan tomorrow",
    completed: false,
    category: "wrapup",
  },
  {
    id: "wr2",
    text: "Reflect on day",
    completed: false,
    category: "wrapup",
  },
];

export const defaultPublicHabitBreakChecklist: ChecklistItem[] = [
  {
    id: "hb1",
    text: "Bad habit 1",
    completed: false,
    category: "lsd",
  },
  {
    id: "hb2",
    text: "Bad habit 2",
    completed: false,
    category: "lsd",
  },
  {
    id: "hb3",
    text: "Bad habit 3",
    completed: false,
    category: "lsd",
  },
  {
    id: "hb4",
    text: "Financial waste",
    completed: false,
    category: "financial",
  },
  {
    id: "hb5",
    text: "Time waster",
    completed: false,
    category: "time",
  },
  {
    id: "hb6",
    text: "Wasteful entertainment",
    completed: false,
    category: "entertainment",
  },
];

export const defaultPublicBlocks: Omit<
  Block,
  "notes" | "complete" | "checklist"
>[] = [
  { time: "6:00 AM", label: "Morning Routine" },
  { time: "7:00 AM", label: "Exercise/Wellness" },
  { time: "8:00 AM", label: "Breakfast/Planning" },
  { time: "9:00 AM", label: "Focus Work" },
  { time: "12:00 PM", label: "Lunch Break" },
  { time: "1:00 PM", label: "Afternoon Work" },
  { time: "5:00 PM", label: "Personal Projects" },
  { time: "7:00 PM", label: "Dinner/Family" },
  { time: "9:00 PM", label: "Wind Down" },
  { time: "10:00 PM", label: "Evening Routine" },
];

// Your existing admin data (from the current app)
export const defaultAdminMasterChecklist: ChecklistItem[] = [
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

export const defaultAdminHabitBreakChecklist: ChecklistItem[] = [
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
    id: "hb12", // Fixed duplicate ID
    text: "wasteful entertainment",
    completed: false,
    category: "entertainment",
  },
];

export const defaultAdminBlocks: Omit<
  Block,
  "notes" | "complete" | "checklist"
>[] = [
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
