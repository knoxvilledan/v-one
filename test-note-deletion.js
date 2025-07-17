// Test the note deletion logic
const notes = [
  "✓ Task 1 (completed 10:30)", // index 0
  "Manual note", // index 1
  "🚫 Bad habit (11:00)", // index 2
  "✓ Task 2 (completed 11:15)", // index 3
  "Another manual note", // index 4
  "🚫 Another bad habit (12:00)", // index 5
];

const isHabitBreakNote = (note) => note.startsWith("🚫 ");

console.log("Original notes:", notes);
console.log(
  "Original indices:",
  notes.map((_, i) => i)
);

// Test regular notes (non-habit break)
const regularNotesWithIndices = notes
  .map((note, noteIndex) => ({ note, noteIndex }))
  .filter(({ note }) => !isHabitBreakNote(note));

console.log("\nRegular notes with original indices:");
regularNotesWithIndices.forEach(({ note, noteIndex }) => {
  console.log(`Index ${noteIndex}: "${note}"`);
});

// Test habit break notes
const habitBreakNotesWithIndices = notes
  .map((note, noteIndex) => ({ note, noteIndex }))
  .filter(({ note }) => isHabitBreakNote(note));

console.log("\nHabit break notes with original indices:");
habitBreakNotesWithIndices.forEach(({ note, noteIndex }) => {
  console.log(`Index ${noteIndex}: "${note}"`);
});

// Test deletion simulation
function simulateDelete(originalNotes, indexToDelete) {
  console.log(
    `\nSimulating deletion of index ${indexToDelete}: "${originalNotes[indexToDelete]}"`
  );
  const result = originalNotes.filter((_, i) => i !== indexToDelete);
  console.log("Result after deletion:", result);
  return result;
}

// Test deleting different indices
simulateDelete(notes, 0); // Delete first regular note
simulateDelete(notes, 1); // Delete manual note
simulateDelete(notes, 2); // Delete first habit break note
simulateDelete(notes, 3); // Delete second regular note
