import type { CaptionCue } from "../types/CaptionCue.js";
import type { EnrichedCue } from "../types/EnrichedCue.js";
import { presplit } from "./presplit.js";

export const enrichCues = (cues: CaptionCue[]): EnrichedCue[] => {
  const results: EnrichedCue[] = [];
  for (const c of cues) {
    const text = c.text;
    const words = presplit(text);

    results.push({
      ...c,
      words,
      intent: {
        intensity: "normal",
        pace: "normal",
        confidence: 0,
        source: "default",
      },
    });
  }
  return results;
};
