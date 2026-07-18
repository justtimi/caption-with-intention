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

export type SignalIntentState = SignalIntensity | SignalPace;
