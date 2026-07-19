import type { CaptionRenderState } from "./types/CaptionRenderState.js";

export const reducedMotionInterceptor = (
  state: CaptionRenderState,
): CaptionRenderState => {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const shouldReduceMotion = motionQuery.matches;
  let reduceMotion = false;

  if (shouldReduceMotion) {
    reduceMotion = true;
  } else {
    reduceMotion = false;
  }

  return {
    ...state,
    reduceMotion,
  };
};
