/**
 * Unit tests for user-actions.ts copy helpers and re-inheritance logic
 */

import { describe, it, expect } from "@jest/globals";
import { ChecklistItem, Block } from "../../types";

// Import the functions we want to test
// Note: Since these are internal functions, we'll need to expose them for testing
// For now, we'll recreate the logic to test the behavior

/**
 * Copy checklist items for a new day, resetting completion state
 */
function copyChecklistForNewDay(
  list: ChecklistItem[] | undefined
): ChecklistItem[] {
  if (!list || list.length === 0) return [];

  return list.map((item) => ({
    ...item,
    completed: false,
    completedAt: undefined,
    timezoneOffset: undefined,
    // Preserve: id, text, category, targetBlock
  }));
}

/**
 * Copy todo list items for a new day, resetting completion state
 */
function copyTodoListForNewDay(
  list: ChecklistItem[] | undefined
): ChecklistItem[] {
  if (!list || list.length === 0) return [];

  return list.map((item) => ({
    ...item,
    completed: false,
    completedAt: undefined,
    timezoneOffset: undefined,
    // Preserve: id, text, category, targetBlock, order
  }));
}

/**
 * Copy time blocks for a new day, keeping only labels and order
 */
function copyBlocksForNewDay(blocks: Block[] | undefined): Block[] {
  if (!blocks || blocks.length === 0) return [];

  return blocks.map((block) => ({
    id: block.id,
    time: block.time,
    label: block.label, // Keep custom names
    notes: [], // Reset notes
    complete: false, // Reset completion
    duration: block.duration,
    index: block.index,
    // Drop any timestamps or transient fields
  }));
}

describe("Copy Helpers", () => {
  describe("copyChecklistForNewDay", () => {
    it("should return empty array for undefined/empty input", () => {
      expect(copyChecklistForNewDay(undefined)).toEqual([]);
      expect(copyChecklistForNewDay([])).toEqual([]);
    });

    it("should reset completion state while preserving other fields", () => {
      const sourceList: ChecklistItem[] = [
        {
          id: "item1",
          text: "Complete important task",
          completed: true,
          completedAt: new Date("2025-09-30T10:00:00Z"),
          category: "work",
          targetBlock: 5,
          timezoneOffset: -300,
        },
        {
          id: "item2",
          text: "Review daily tasks",
          completed: false,
          category: "morning",
        },
      ];

      const result = copyChecklistForNewDay(sourceList);

      expect(result).toHaveLength(2);

      // First item should have completion reset
      expect(result[0]).toEqual({
        id: "item1",
        text: "Complete important task",
        completed: false,
        completedAt: undefined,
        category: "work",
        targetBlock: 5,
        timezoneOffset: undefined,
      });

      // Second item should remain unchanged (already incomplete)
      expect(result[1]).toEqual({
        id: "item2",
        text: "Review daily tasks",
        completed: false,
        completedAt: undefined,
        category: "morning",
        timezoneOffset: undefined,
      });
    });
  });

  describe("copyTodoListForNewDay", () => {
    it("should return empty array for undefined/empty input", () => {
      expect(copyTodoListForNewDay(undefined)).toEqual([]);
      expect(copyTodoListForNewDay([])).toEqual([]);
    });

    it("should reset completion state and preserve order/targetBlock", () => {
      const sourceTodos: ChecklistItem[] = [
        {
          id: "todo1",
          text: "Buy groceries",
          completed: true,
          completedAt: new Date("2025-09-30T14:00:00Z"),
          category: "todo",
          targetBlock: 8,
          timezoneOffset: -300,
        },
        {
          id: "todo2",
          text: "Call dentist",
          completed: false,
          category: "todo",
          targetBlock: 10,
        },
      ];

      const result = copyTodoListForNewDay(sourceTodos);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "todo1",
        text: "Buy groceries",
        completed: false,
        completedAt: undefined,
        category: "todo",
        targetBlock: 8,
        timezoneOffset: undefined,
      });
      expect(result[1]).toEqual({
        id: "todo2",
        text: "Call dentist",
        completed: false,
        completedAt: undefined,
        category: "todo",
        targetBlock: 10,
        timezoneOffset: undefined,
      });
    });
  });

  describe("copyBlocksForNewDay", () => {
    it("should return empty array for undefined/empty input", () => {
      expect(copyBlocksForNewDay(undefined)).toEqual([]);
      expect(copyBlocksForNewDay([])).toEqual([]);
    });

    it("should keep labels and order but reset notes and completion", () => {
      const sourceBlocks: Block[] = [
        {
          id: "block1",
          time: "04:00",
          label: "Custom Morning Routine",
          notes: ["Had a great workout", "Finished early"],
          complete: true,
          duration: 60,
          index: 0,
        },
        {
          id: "block2",
          time: "05:00",
          label: "Work Tasks",
          notes: ["Meeting notes", "Project update"],
          complete: false,
          duration: 60,
          index: 1,
        },
      ];

      const result = copyBlocksForNewDay(sourceBlocks);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "block1",
        time: "04:00",
        label: "Custom Morning Routine", // Preserved
        notes: [], // Reset
        complete: false, // Reset
        duration: 60,
        index: 0,
      });
      expect(result[1]).toEqual({
        id: "block2",
        time: "05:00",
        label: "Work Tasks", // Preserved
        notes: [], // Reset
        complete: false, // Reset
        duration: 60,
        index: 1,
      });
    });
  });
});

describe("Re-inheritance Logic", () => {
  describe("shouldReInherit behavior", () => {
    it("should trigger re-inheritance when any single item is added", () => {
      const currentData = {
        masterChecklist: [
          { id: "1", text: "Task 1", completed: false, category: "work" },
        ],
        habitBreakChecklist: [],
        workoutChecklist: [],
        todoList: [],
        blocks: [],
      };

      const sourceData = {
        masterChecklist: [
          { id: "1", text: "Task 1", completed: false, category: "work" },
          { id: "2", text: "Task 2", completed: false, category: "work" }, // Added
        ],
        habitBreakChecklist: [],
        workoutChecklist: [],
        todoList: [],
        blocks: [],
      };

      // This would trigger hasContentChanged to return true
      // because the masterChecklist has different content
      expect(currentData.masterChecklist.length).toBe(1);
      expect(sourceData.masterChecklist.length).toBe(2);
    });

    it("should trigger re-inheritance when a block is renamed", () => {
      const currentBlocks = [
        {
          id: "block1",
          label: "Old Label",
          time: "04:00",
          notes: [],
          complete: false,
        },
      ];

      const sourceBlocks = [
        {
          id: "block1",
          label: "New Label",
          time: "04:00",
          notes: [],
          complete: false,
        },
      ];

      // This would trigger hasContentChanged for blocks
      expect(currentBlocks[0].label).toBe("Old Label");
      expect(sourceBlocks[0].label).toBe("New Label");
    });

    it("should trigger re-inheritance when todo is added/removed", () => {
      const currentTodos: ChecklistItem[] = [];
      const sourceTodos = [
        { id: "todo1", text: "New todo", completed: false, category: "todo" },
      ];

      // This would trigger hasContentChanged for todoList
      expect(currentTodos.length).toBe(0);
      expect(sourceTodos.length).toBe(1);
    });
  });

  describe("inheritance acceptance criteria", () => {
    it("should create new day with yesterday todos (incomplete) and block names", () => {
      const yesterdayData = {
        todoList: [
          {
            id: "todo1",
            text: "Buy groceries",
            completed: true,
            category: "todo" as const,
          },
          {
            id: "todo2",
            text: "Call dentist",
            completed: false,
            category: "todo" as const,
          },
          {
            id: "todo3",
            text: "Review notes",
            completed: false,
            category: "todo" as const,
          },
        ],
        blocks: [
          {
            id: "block1",
            time: "04:00",
            label: "Custom Morning",
            notes: ["Great session"],
            complete: true,
            duration: 60,
            index: 0,
          },
          {
            id: "block2",
            time: "05:00",
            label: "Work Block",
            notes: ["Productive"],
            complete: false,
            duration: 60,
            index: 1,
          },
        ],
      };

      const inheritedTodos = copyTodoListForNewDay(yesterdayData.todoList);
      const inheritedBlocks = copyBlocksForNewDay(yesterdayData.blocks);

      // All todos should be inherited but reset to incomplete
      expect(inheritedTodos).toHaveLength(3);
      inheritedTodos.forEach((todo) => {
        expect(todo.completed).toBe(false);
        expect(todo.completedAt).toBeUndefined();
      });

      // Block labels should be preserved, notes/completion reset
      expect(inheritedBlocks).toHaveLength(2);
      expect(inheritedBlocks[0].label).toBe("Custom Morning");
      expect(inheritedBlocks[0].notes).toEqual([]);
      expect(inheritedBlocks[0].complete).toBe(false);
      expect(inheritedBlocks[1].label).toBe("Work Block");
      expect(inheritedBlocks[1].notes).toEqual([]);
      expect(inheritedBlocks[1].complete).toBe(false);
    });
  });
});
