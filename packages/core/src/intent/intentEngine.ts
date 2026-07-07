import { presplit } from "../preparation/presplit.js";
import type { IntentState } from "../types/IntentState.js";
import type { SignalIntentState } from "./signals.js";

export const inferIntent = (text: string): IntentState => {
  const words = presplit(text);
  const signals: SignalIntentState[] = [];
  return {
    intensity: "normal",
    pace: "normal",
    confidence: 0,
    source: "default",
  };
};
