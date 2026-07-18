import type { WordToken } from "../types/EnrichedCue.js";

export const sentenceMaker = (
  words: WordToken[],
  start: number,
  end: number,
): string => {
  let sentence = "";
  for (let i = start; i < end; i++) {
    const word = words[i];
    if (!word) continue;

    sentence = sentence + " ";
    sentence = sentence + word.word;
  }

  return sentence.trim();
};
