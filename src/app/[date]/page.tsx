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
import { Block } from "../../types";

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
      defaultBlocks.map((b) => ({ ...b, notes: [], complete: false }))
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

  const score = calculateScore(blocks);

  return (
    <main className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">AMP Tracker – {date}</h1>
      <ScoreBar score={score} />
      <ExportButton onExport={() => exportCSVByDate(date, blocks)} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {blocks.map((block, i) => (
          <TimeBlock
            key={i}
            block={block}
            index={i}
            toggleComplete={toggleComplete}
            addNote={addNote}
            deleteNote={deleteNote}
            editNote={editNote}
          />
        ))}
      </div>
    </main>
  );
}
