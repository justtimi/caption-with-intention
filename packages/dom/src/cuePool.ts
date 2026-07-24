import { createCueView, type CueView } from "./cueView.js";

interface CueNodePool {
  acquire: () => CueView;
  release: (view: CueView) => void;
}

export const createCueNodePool = (
  container: HTMLElement,
  poolSize: number,
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
      throw new Error("No available views at the time");
    },
    release(view: CueView) {
      view.clear();
      inUse.delete(view);
    },
  };
};
