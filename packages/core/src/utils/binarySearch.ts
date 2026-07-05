import type { EnrichedCue } from "../types/EnrichedCue.js";

export const binarySearch = (
  cues: EnrichedCue[],
  target: number,
): EnrichedCue | null => {
  let middle = 0;
  let start = 0;
  let end = cues.length - 1;
  while (start <= end) {
    middle = Math.floor((start + end) / 2);
    let cuesMiddle = cues[middle];
    if (cuesMiddle !== undefined) {
      if (cuesMiddle.startTime <= target && target < cuesMiddle.endTime) {
        return cuesMiddle;
      }
      if (target > cuesMiddle.startTime) {
        start = middle + 1;
      }
      if (target < cuesMiddle.startTime) {
        end = middle - 1;
      }
    } else {
      break;
    }
  }
  return null;
};
