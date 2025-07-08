import { Block } from "../types";

export const calculateScore = (blocks: Block[]): number => {
  if (!blocks || !Array.isArray(blocks)) {
    return 0;
  }
  const total = blocks.length;
  const done = blocks.filter((b) => b.complete).length;
  return total > 0 ? Math.round((done / total) * 100) : 0;
};
