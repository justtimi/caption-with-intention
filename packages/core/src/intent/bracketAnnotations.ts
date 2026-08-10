// Environmental sounds ([door slams], [glass shatters]) and music descriptors
// ([upbeat music playing]) are intentionally excluded from this lookup table.
// These map to the environment dimension - spatial origin and atmospheric context -
// which is reserved for a future phase. Only speech delivery annotations are
// handled here.

import type { SignalIntentState } from "./types/signals.js";

export const bracketAnnotations: Record<string, SignalIntentState[]> = {
  whispering: [
    {
      dimension: "intensity",
      value: "whisper",
      confidence: 0.8,
    },
  ],
  hushed: [
    {
      dimension: "intensity",
      value: "whisper",
      confidence: 0.8,
    },
  ],
  shouting: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.8,
    },
  ],
  yelling: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.8,
    },
  ],
  screaming: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.8,
    },
  ],
  murmuring: [
    {
      dimension: "intensity",
      value: "whisper",
      confidence: 0.8,
    },
  ],
  muttering: [
    {
      dimension: "intensity",
      value: "whisper",
      confidence: 0.8,
    },
  ],
  softly: [
    {
      dimension: "intensity",
      value: "whisper",
      confidence: 0.8,
    },
  ],
  quietly: [
    {
      dimension: "intensity",
      value: "whisper",
      confidence: 0.8,
    },
  ],
  loudly: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.8,
    },
  ],
  forcefully: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.8,
    },
  ],
  roaring: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.8,
    },
  ],
  bellowing: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.8,
    },
  ],
  slowly: [
    {
      dimension: "pace",
      value: "slow",
      confidence: 0.8,
    },
  ],
  carefully: [
    {
      dimension: "pace",
      value: "slow",
      confidence: 0.8,
    },
  ],
  rapidly: [
    {
      dimension: "pace",
      value: "fast",
      confidence: 0.8,
    },
  ],
  quickly: [
    {
      dimension: "pace",
      value: "fast",
      confidence: 0.8,
    },
  ],
  hesitantly: [
    {
      dimension: "pace",
      value: "slow",
      confidence: 0.8,
    },
  ],
  urgently: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.8,
    },
    {
      dimension: "pace",
      value: "fast",
      confidence: 0.8,
    },
  ],
  stuttering: [
    {
      dimension: "pace",
      value: "slow",
      confidence: 0.8,
    },
  ],
  stammering: [
    {
      dimension: "pace",
      value: "slow",
      confidence: 0.8,
    },
  ],
  deliberately: [
    {
      dimension: "pace",
      value: "slow",
      confidence: 0.8,
    },
  ],
  angrily: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.8,
    },
    {
      dimension: "pace",
      value: "fast",
      confidence: 0.8,
    },
  ],
  excitedly: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.8,
    },
    {
      dimension: "pace",
      value: "fast",
      confidence: 0.8,
    },
  ],
  sadly: [
    {
      dimension: "intensity",
      value: "whisper",
      confidence: 0.8,
    },
    {
      dimension: "pace",
      value: "slow",
      confidence: 0.8,
    },
  ],
  nervously: [
    {
      dimension: "intensity",
      value: "whisper",
      confidence: 0.8,
    },
    {
      dimension: "pace",
      value: "fast",
      confidence: 0.8,
    },
  ],
  frantically: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.8,
    },
    {
      dimension: "pace",
      value: "fast",
      confidence: 0.8,
    },
  ],
  calmly: [
    {
      dimension: "intensity",
      value: "normal",
      confidence: 0.8,
    },
    {
      dimension: "pace",
      value: "slow",
      confidence: 0.8,
    },
  ],
};
