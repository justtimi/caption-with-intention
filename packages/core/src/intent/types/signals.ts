export type IntensityValue = "whisper" | "normal" | "loud";
export type PaceValue = "slow" | "normal" | "fast";

type SignalIntensity = {
  dimension: "intensity";
  value: IntensityValue;
  confidence: number;
};
type SignalPace = {
  dimension: "pace";
  value: PaceValue;
  confidence: number;
};

export type SignalIntentState = SignalIntensity | SignalPace;
