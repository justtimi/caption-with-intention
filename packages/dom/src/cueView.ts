import type { EnrichedCue } from "@cue-engine/core";

export interface CueView {
  setCue(cue: EnrichedCue): void;
  updateVisibleWord(index: number, reduceMotion: boolean): void;
  clear(): void;
}

export const createCueView = (container: HTMLElement): CueView => {
  const rootElement: HTMLDivElement = document.createElement("div");
  const wordSpans: HTMLSpanElement[] = [];
  let previousVisibleWordIndex: number = -1;
  container.appendChild(rootElement);

  const clearView = () => {
    rootElement.replaceChildren();
    wordSpans.length = 0;
    previousVisibleWordIndex = -1;
  };

  return {
    setCue(cue: EnrichedCue) {
      clearView();
      for (const wordToken of cue.words) {
        const wordSpan = document.createElement("span");
        wordSpan.textContent = wordToken.word;
        rootElement.appendChild(wordSpan);
        wordSpans.push(wordSpan);
      }
    },
    updateVisibleWord(index: number, reduceMotion: boolean) {
      if (index > wordSpans.length - 1) index = wordSpans.length - 1;
      if (index < -1) index = -1;

      const min = Math.min(previousVisibleWordIndex, index);
      const max = Math.max(previousVisibleWordIndex, index);

      for (let i = min + 1; i <= max; i++) {
        const current = wordSpans[i];
        if (!current) continue;
        if (previousVisibleWordIndex < index) {
          current.setAttribute("data-visible", "true");
        } else {
          current.setAttribute("data-visible", "false");
        }
        if (reduceMotion) {
          current.setAttribute("data-reduce-motion", "true");
        } else {
          current.setAttribute("data-reduce-motion", "false");
        }
      }
      previousVisibleWordIndex = index;
    },
    clear() {
      clearView();
    },
  };
};
