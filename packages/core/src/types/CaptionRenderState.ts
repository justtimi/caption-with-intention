import type { EnrichedCue } from "./EnrichedCue.js";

export type CaptionRenderState = {
  activeCue: EnrichedCue | null;
  previousCue: EnrichedCue | null;
  visibleWordIndex: number;
  cuePhase: "entering" | "active" | "exiting" | "idle";
};