export type IntentState = {
  intensity: "whisper" | "normal" | "loud" | "emphasis";
  pace: "slow" | "normal" | "fast";
  confidence: number;
  source: "manual" | "text" | "audio" | "ml" | "corrected";
};