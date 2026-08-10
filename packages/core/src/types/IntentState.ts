export type IntentState = {
  intensity: "whisper" | "normal" | "loud";
  pace: "slow" | "normal" | "fast";
  emphasizedWords?: string[];
  confidence: number;
  source: "manual" | "text" | "audio" | "ml" | "corrected" | "default";
};
