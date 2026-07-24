import { createCueView, type CueView } from "./CueView.js";

interface CueNodePool {
  acquire: () => CueView;
  release: (view: CueView) => void;
}

export const createCueNodePool = (
  container: HTMLElement,
  poolSize = 2,
): CueNodePool => {
  const views: CueView[] = [];
  for (let i = 0; i < poolSize; i++) {
    views.push(createCueView(container));
  }
  const inUse = new Set<CueView>();
  return {
    acquire() {
      for (const view of views) {
        if (!inUse.has(view)) {
          inUse.add(view);
          return view;
        }
      }
      throw new Error(
        "CueNodePool exhausted. All CueView instances are currently in use.",
      );
    },
    release(view: CueView) {
      view.clear();
      inUse.delete(view);
    },
  };
};
