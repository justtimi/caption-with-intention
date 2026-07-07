import { presplit } from "../preparation/presplit.js";
import type { IntentState } from "../types/IntentState.js";

type SignalIntensity = {
  dimension: "intensity";
  value: "whisper" | "normal" | "loud";
  confidence: number;
};
type SignalPace = {
  dimension: "pace";
  value: "slow" | "normal" | "fast";
  confidence: number;
};

type SignalIntentState = SignalIntensity | SignalPace;

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
