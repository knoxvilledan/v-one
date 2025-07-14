"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  loadDayDataByDate,
  saveDayDataByDate,
  exportCSVByDate,
} from "../../lib/storage";
import TimeBlock from "../../components/TimeBlock";
import ScoreBar from "../../components/ScoreBar";
import ExportButton from "../../components/ExportButton";
import { calculateScore } from "../../lib/scoring";
import { Block, ChecklistItem } from "../../types";

const defaultChecklist: ChecklistItem[] = [
  { id: "1", text: "Get Mind Right! Put 1 on Loop", completed: false },
  { id: "2", text: "Hear/Read/ Write/Speak/ Vision/Feeling", completed: false },
  { id: "3", text: "Teeth / Face", completed: false },
  {
    id: "4",
    text: "Spa Treatment / Feet / Deodorant / Hair",
    completed: false,
  },
  { id: "5", text: "Stretch & Build up…EVERYTHING", completed: false },
  { id: "6", text: "Workout [101] [201] [301]", completed: false },
  { id: "7", text: "Work Day Prep / To Do List Prep", completed: false },
  {
    id: "8",
    text: "Bible Study | Mind/Will | Soul/Emotions",
    completed: false,
  },
];

const defaultWorkChecklist: ChecklistItem[] = [
  { id: "work-1", text: "Work Tasks", completed: false },
];

const defaultTechChecklist: ChecklistItem[] = [
  { id: "tech-1", text: "Programming, Tech Stacks, Tools", completed: false },
  { id: "tech-2", text: "Coding, Build Portfolio/Projects", completed: false },
  { id: "tech-3", text: "Web Dev / Soft Dev", completed: false },
  { id: "tech-4", text: "IT Help Desk", completed: false },
  { id: "tech-5", text: "Network Security", completed: false },
  { id: "tech-6", text: "Research & Development Subjects", completed: false },
];

const defaultHouseFamilyChecklist: ChecklistItem[] = [
  { id: "house-1", text: "Household / Chores / Misc", completed: false },
  {
    id: "house-2",
    text: "Various / Store / Breaks / Dinner",
    completed: false,
  },
  {
    id: "house-3",
    text: "2 - 3 X chores & 1.5 nights SB for family",
    completed: false,
  },
];

const defaultWrapUpChecklist: ChecklistItem[] = [
  { id: "wrap-1", text: "Plan Next Day", completed: false },
  { id: "wrap-2", text: "Spa Treatment R2", completed: false },
  { id: "wrap-3", text: "Blue Angel / Ideal Day/ life", completed: false },
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

  const [blocks, setBlocks] = useState<Block[]>(
    () =>
      (date && loadDayDataByDate(date)) ||
      defaultBlocks.map((b, index) => ({
        ...b,
        notes: [],
        complete: false,
        checklist:
          index === 0
            ? defaultChecklist
            : index === 5
            ? defaultWorkChecklist
            : index === 6
            ? defaultTechChecklist
            : index === 8
            ? defaultHouseFamilyChecklist
            : index === 9
            ? defaultWrapUpChecklist
            : undefined,
      }))
  );

  useEffect(() => {
    if (date) saveDayDataByDate(date, blocks);
  }, [blocks, date]);

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
    copy[blockIndex].notes.splice(noteIndex, 1);
    setBlocks(copy);
  };

  const editNote = (blockIndex: number, noteIndex: number, newText: string) => {
    const copy = [...blocks];
    copy[blockIndex].notes[noteIndex] = newText;
    setBlocks(copy);
  };

  const updateChecklist = (blockIndex: number, checklist: ChecklistItem[]) => {
    const copy = [...blocks];
    copy[blockIndex].checklist = checklist;
    setBlocks(copy);
  };

  const score = calculateScore(blocks);

  return (
    <main className="max-w-7xl mx-auto px-4">
      <h1 className="text-2xl font-bold mb-2">AMP Tracker – {date}</h1>
      <ScoreBar score={score} />
      <ExportButton onExport={() => exportCSVByDate(date, blocks)} />
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
              updateChecklist={updateChecklist}
            />
          </div>
        ))}
      </div>
    </main>
  );
}
