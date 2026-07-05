import type { EnrichedCue } from "./EnrichedCue.js";

export type CuePhase = "entering" | "active" | "exiting" | "idle";

export type CaptionRenderState = {
  activeCue: EnrichedCue | null;
  previousCue: EnrichedCue | null;
  visibleWordIndex: number;
  cuePhase: CuePhase;
};