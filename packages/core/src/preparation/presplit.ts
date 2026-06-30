import type { WordToken } from "../types/EnrichedCue.js";

export const presplit = (text: string): WordToken[] => {
  let normalized = text.trim();
  if (normalized === "") return [];

  const tokens = normalized.split(/\s+/);

  const result = tokens.map((token) => ({ word: token }));

  return result;
};
