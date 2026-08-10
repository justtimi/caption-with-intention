import type { CaptionRenderState } from "../types/CaptionRenderState.js";

export type BaseCaptionRenderState = Omit<CaptionRenderState, "reduceMotion">;

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

export const reducedMotionInterceptor = (
  state: BaseCaptionRenderState,
): CaptionRenderState => {
  return {
    ...state,
    reduceMotion: motionQuery.matches,
  };
};
