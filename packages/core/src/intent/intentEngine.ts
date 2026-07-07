import { presplit } from "../preparation/presplit.js";
import type { IntentState } from "../types/IntentState.js";
import { bracketAnnotations } from "./bracketAnnotations.js";
import type { SignalIntentState } from "./signals.js";

export const inferIntent = (text: string): IntentState => {
  const words = presplit(text);
  const signals: SignalIntentState[] = [];

  const regex = /\[(.*?)\]/g;

  for (const match of text.matchAll(regex)) {
    const word = match[1]?.toLowerCase().trim();
    if (word && bracketAnnotations[word]) {
      signals.push(...bracketAnnotations[word]);
    }
  }

  return {
    intensity: "normal",
    pace: "normal",
    confidence: 0,
    source: "default",
  };
};
