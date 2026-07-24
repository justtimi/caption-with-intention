import type { CaptionRenderState } from "@cue-engine/core";
import { createCueNodePool } from "./CuePool.js";
import type { CueView } from "./CueView.js";

interface CaptionRenderer {
  render: (state: CaptionRenderState) => void;
}

export const createCaptionRenderer = (
  container: HTMLElement,
): CaptionRenderer => {
  const pool = createCueNodePool(container, 3);
  let activeView: CueView | null = null;
  let previousCuePhase = "";
  return {
    render(state) {
      const activeCue = state.activeCue;
      if (activeCue) {
        if (state.cuePhase === "entering") {
          activeView = pool.acquire();
          activeView.setCue(activeCue);
        } else if (state.cuePhase === "active") {
          activeView?.updateVisibleWord(
            state.visibleWordIndex,
            state.reduceMotion,
          );
        }
      }
      if (previousCuePhase === "exiting" && state.cuePhase !== "exiting") {
        if (!activeView) return;
        pool.release(activeView);
        activeView = null;
      } else if (state.cuePhase === "idle") {
      }
      previousCuePhase = state.cuePhase;
    },
  };
};
