import type { IntentState } from "./IntentState.js";
import type { CaptionCue } from "./CaptionCue.js";

export type WordToken = {
  word: string;
  startTime?: number;
};

export type EnrichedCue = CaptionCue & {
  words: WordToken[];
  intent: IntentState;
  speakerId?: string;
};
