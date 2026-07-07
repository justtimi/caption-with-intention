// Environmental sounds ([door slams], [glass shatters]) and music descriptors
// ([upbeat music playing]) are intentionally excluded from this lookup table.
// These map to the environment dimension - spatial origin and atmospheric context -
// which is reserved for a future phase. Only speech delivery annotations are
// handled here.

import type { SignalIntentState } from "./signals.js";

export const bracketAnnotations: Record<string, SignalIntentState[]> = {
  whispering: [
    {
      dimension: "intensity",
      value: "whisper",
      confidence: 0.98,
    },
  ],
  hushed: [
    {
      dimension: "intensity",
      value: "whisper",
      confidence: 0.98,
    },
  ],
  shouting: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.98,
    },
  ],
  yelling: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.98,
    },
  ],
  screaming: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.98,
    },
  ],
  murmuring: [
    {
      dimension: "intensity",
      value: "whisper",
      confidence: 0.98,
    },
  ],
  muttering: [
    {
      dimension: "intensity",
      value: "whisper",
      confidence: 0.98,
    },
  ],
  softly: [
    {
      dimension: "intensity",
      value: "whisper",
      confidence: 0.98,
    },
  ],
  quietly: [
    {
      dimension: "intensity",
      value: "whisper",
      confidence: 0.98,
    },
  ],
  loudly: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.98,
    },
  ],
  forcefully: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.98,
    },
  ],
  roaring: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.98,
    },
  ],
  bellowing: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.98,
    },
  ],
  slowly: [
    {
      dimension: "pace",
      value: "slow",
      confidence: 0.98,
    },
  ],
  carefully: [
    {
      dimension: "pace",
      value: "slow",
      confidence: 0.98,
    },
  ],
  rapidly: [
    {
      dimension: "pace",
      value: "fast",
      confidence: 0.98,
    },
  ],
  quickly: [
    {
      dimension: "pace",
      value: "fast",
      confidence: 0.98,
    },
  ],
  hesitantly: [
    {
      dimension: "pace",
      value: "slow",
      confidence: 0.98,
    },
  ],
  urgently: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.98,
    },
    {
      dimension: "pace",
      value: "fast",
      confidence: 0.98,
    },
  ],
  stuttering: [
    {
      dimension: "pace",
      value: "slow",
      confidence: 0.98,
    },
  ],
  stammering: [
    {
      dimension: "pace",
      value: "slow",
      confidence: 0.98,
    },
  ],
  deliberately: [
    {
      dimension: "pace",
      value: "slow",
      confidence: 0.98,
    },
  ],
  angrily: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.98,
    },
    {
      dimension: "pace",
      value: "fast",
      confidence: 0.98,
    },
  ],
  excitedly: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.98,
    },
    {
      dimension: "pace",
      value: "fast",
      confidence: 0.98,
    },
  ],
  sadly: [
    {
      dimension: "intensity",
      value: "whisper",
      confidence: 0.98,
    },
    {
      dimension: "pace",
      value: "slow",
      confidence: 0.98,
    },
  ],
  nervously: [
    {
      dimension: "intensity",
      value: "whisper",
      confidence: 0.98,
    },
    {
      dimension: "pace",
      value: "fast",
      confidence: 0.98,
    },
  ],
  frantically: [
    {
      dimension: "intensity",
      value: "loud",
      confidence: 0.98,
    },
    {
      dimension: "pace",
      value: "fast",
      confidence: 0.98,
    },
  ],
  calmly: [
    {
      dimension: "intensity",
      value: "normal",
      confidence: 0.98,
    },
    {
      dimension: "pace",
      value: "slow",
      confidence: 0.98,
    },
  ],
};
