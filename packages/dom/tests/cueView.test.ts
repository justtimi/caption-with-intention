import { EnrichedCue } from "@cue-engine/core";
import { createCueView } from "../src/renderer/CueView.js";
import { describe, it, expect } from "vitest";

const VALID_CUE_1: EnrichedCue = {
  id: "1",
  startTime: 18000,
  endTime: 27000,
  text: "Thank you for watching, and don't forget to like and subscribe!",
  words: [
    { word: "Thank" },
    { word: "you" },
    { word: "for" },
    { word: "watching," },
    { word: "and" },
    { word: "don't" },
    { word: "forget" },
    { word: "to" },
    { word: "like" },
    { word: "and" },
    { word: "subscribe!" },
  ],
  intent: {
    intensity: "loud",
    pace: "normal",
    confidence: 1,
    source: "text",
  },
};

const VALID_CUE_2: EnrichedCue = {
  id: "2",
  startTime: 0,
  endTime: 4500,
  text: "Is this microphone actually recording right now?",
  words: [
    { word: "Is" },
    { word: "this" },
    { word: "microphone" },
    { word: "actually" },
    { word: "recording" },
    { word: "right" },
    { word: "now?" },
  ],
  intent: {
    intensity: "whisper",
    pace: "slow",
    confidence: 0.35,
    source: "text",
  },
};

const VALID_CUE_3: EnrichedCue = {
  id: "3",
  startTime: 9000,
  endTime: 18000,
  text: "",
  words: [],
  intent: {
    intensity: "normal",
    pace: "normal",
    confidence: 0,
    source: "default",
  },
};

const getSpans = (container: HTMLElement) => {
  return Array.from(container.children[0].children);
};

describe("`setCue()` — initial population", () => {
  it("Given a cue with N words, `setCue()` creates exactly N spans in `rootElement`.", () => {
    const container = window.document.createElement("div");
    const cue = createCueView(container);
    cue.setCue(VALID_CUE_1);
    expect(VALID_CUE_1.words.length).toBe(getSpans(container).length);
  });
  it("Each span's `textContent` matches the corresponding `WordToken.word`, in order.", () => {
    const container = window.document.createElement("div");
    const cue = createCueView(container);
    cue.setCue(VALID_CUE_1);
    for (let i = 0; i < VALID_CUE_1.words.length; i++) {
      const word = VALID_CUE_1.words[i];
      expect(word.word).toBe(getSpans(container)[i].textContent);
    }
  });
});

describe("`setCue()` — rebuild behavior (Option A observable behavior)", () => {
  it("Calling `setCue()` a second time with a *different* cue fully replaces the DOM contents — no leftover spans from the first cue remain in `rootElement`.", () => {
    const container = window.document.createElement("div");
    const cue = createCueView(container);
    cue.setCue(VALID_CUE_1);
    cue.setCue(VALID_CUE_2);
    for (let i = 0; i < VALID_CUE_2.words.length; i++) {
      const word = VALID_CUE_2.words[i];
      expect(word.word).toBe(getSpans(container)[i].textContent);
    }
    expect(getSpans(container).length).toBe(VALID_CUE_2.words.length);
  });
});
describe(" Zero-word cues", () => {
  it("`setCue()` with `words: []` results in `wordSpans.length === 0` and no spans in the DOM — doesn't throw.", () => {
    const container = window.document.createElement("div");
    const cue = createCueView(container);
    cue.setCue(VALID_CUE_3);
    expect(getSpans(container).length).toBe(0);
  });
  it("Calling `updateVisibleWord()` afterward on this empty state doesn't throw and produces no attribute changes.", () => {
    const container = window.document.createElement("div");
    const cue = createCueView(container);
    cue.setCue(VALID_CUE_3);
    expect(() => cue.updateVisibleWord(7, false)).not.toThrow();
  });
});

describe("`updateVisibleWord()` — diffing range, forward seek", () => {
  it("Starting from `previousVisibleWordIndex = -1`, calling with `index = 2` sets `data-visible=true` on spans `0`, `1`, `2` only — nothing beyond.", () => {
    const container = window.document.createElement("div");
    const cue = createCueView(container);
    cue.setCue(VALID_CUE_2);
    cue.updateVisibleWord(2, true);

    const spans = getSpans(container);
    for (let i = 0; i < 3; i++) {
      const span = spans[i];
      expect(span).toBeDefined();
      expect(span.getAttribute("data-visible")).toBe("true");
    }
    for (let i = 3; i < getSpans(container).length; i++) {
      const span = spans[i];
      expect(span).toBeDefined();
      expect(span.getAttribute("data-visible")).toBeNull();
    }
  });
  it("From an already-partially-revealed state (e.g., `previousVisibleWordIndex = 2`), advancing to `index = 5` only touches spans `3, 4, 5` — spans `0-2` are untouched (assert their attribute values are unchanged from before the call, not merely still `true`).", () => {});
});
describe(" `updateVisibleWord()` — diffing range, backward seek", () => {
  it("From `previousVisibleWordIndex = 5`, seeking back to `index = 2` sets `data-visible=false` on spans `3, 4, 5` only — span `2` (the `min`) stays untouched/unchanged.", () => {});
  it("Symmetry check: forward then backward over the same range should leave spans in the expected state matching a manually-traced expectation (i.e., write out by hand what should be true after the sequence, then assert it).", () => {});
});

describe(" `updateVisibleWord()` — out-of-bounds index", () => {
  it("Calling with `index` greater than `wordSpans.length - 1` clamps to the last valid index — doesn't throw, doesn't try to access a nonexistent span.", () => {});
  it("Calling with a negative `index` (e.g., `-5`) clamps to `-1` — results in a no-op relative to current state if nothing was previously visible, or correctly un-reveals everything if something was previously visible.", () => {});
});

describe("`reduceMotion` — always read fresh, never cached", () => {
  it("Calling `updateVisibleWord(index, true)` sets `data-reduce-motion=true` on the affected spans.", () => {});
  it("Calling `updateVisibleWord(index, false)` immediately after (same or new index) sets `data-reduce-motion=`false`` — proving the value isn't cached/sticky from the previous call.", () => {});
  it("A call that touches zero spans (e.g., `min === max`, no range to update) still shouldn't error regardless of the `reduceMotion` value passed.", () => {});
});

describe("`clear()` — idempotency and full reset", () => {
  it("After `setCue()` populates spans, calling `clear()` results in an empty `rootElement` and `wordSpans.length === 0`.", () => {});
  it("Calling `clear()` a second time immediately after (redundant call) doesn't throw and leaves the same empty state — proving idempotency directly, not just appears safe.", () => {});
  it("After `clear()`, `previousVisibleWordIndex` is back to `-1` — verify indirectly by calling `updateVisibleWord(0, false)` afterward and confirming it behaves like a fresh reveal from nothing (span `0` becomes visible), not like it's continuing from stale state.", () => {});
});

describe("Redundant `setCue()` calls (exam Q9 behavior)", () => {
  it("Calling `setCue()` twice in a row with cues that happen to share the same `id` still fully rebuilds (per your exam answer — `CueView` doesn't dedupe, that's `CaptionRenderer`'s job) — assert that visual/reveal progress does *not* survive the second call (i.e., `previousVisibleWordIndex` resets even though the id didn't change), confirming `CueView` really doesn't do its own identity check.", () => {});
});
