import type { IntentState } from "./IntentState.js";

export type WordToken = {
  word: string;
  startTime?: number;
};

export type EnrichedCue = {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  words: WordToken[];
  intent: IntentState;
  speakerId?: string;
};