import type {
  CaptionRenderState,
  CuePhase,
} from "../types/CaptionRenderState.js";
import type { EnrichedCue } from "../types/EnrichedCue.js";
import { binarySearch } from "../utils/binarySearch.js";

interface TimelineInterface {
  start: () => void;
  stop: () => void;
}

export class TimelineController implements TimelineInterface {
  constructor(
    private video: HTMLVideoElement,
    private cues: EnrichedCue[],
    private callback: (state: CaptionRenderState) => void,
  ) {}
  private rafId: number | null = null;
  private previousCue: EnrichedCue | null = null;
  start() {
    this.rafId = requestAnimationFrame(() => this.tick());
  }

  tick(): void {
    const currentTime = this.video.currentTime;
    const activeCue = binarySearch(this.cues, currentTime);
    let cuePhase: CuePhase = "idle";
    if (activeCue && !this.previousCue) {
      cuePhase = "entering";
    }
    if (activeCue === this.previousCue) {
      cuePhase = "active";
    }
    if (!activeCue && this.previousCue) {
      cuePhase = "exiting";
    }
    if (!activeCue && !this.previousCue) {
      cuePhase = "idle";
    }

    let visibleWordIndex = 0;
    if (activeCue) {
      visibleWordIndex = Math.floor(
        ((currentTime - activeCue.startTime) /
          (activeCue.endTime - activeCue.startTime)) *
          activeCue.words.length,
      );
    }
    if (this.previousCue) {
      if (cuePhase === "exiting") {
        visibleWordIndex = this.previousCue.words.length;
      }
    }

    const state: CaptionRenderState = {
      activeCue,
      previousCue: this.previousCue,
      visibleWordIndex,
      cuePhase,
    };
    this.callback(state);
    this.previousCue = activeCue;
    this.rafId = requestAnimationFrame(() => this.tick());
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
  }
}
