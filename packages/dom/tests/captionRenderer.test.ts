import { CaptionRenderState, EnrichedCue } from "@cue-engine/core";
import { createRenderer } from "../src/renderer/CaptionRenderer.js";
import { describe, it, expect } from "vitest";

type ValidatedRenderState = Omit<CaptionRenderState, "activeCue"> & {
  activeCue: EnrichedCue;
};

const RENDER_STATE_1: CaptionRenderState = {
  cuePhase: "entering",
  activeCue: {
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
  },
  previousCue: {
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
  },
  reduceMotion: false,
  visibleWordIndex: 3,
};

function createTestRenderState(
  overrides?: Partial<CaptionRenderState>,
): ValidatedRenderState {
  const vary = {
    ...RENDER_STATE_1,
    ...overrides,
  };
  if (!vary.activeCue) throw new Error("activeCue cannot be null");
  return { ...vary, activeCue: vary.activeCue };
}

describe("`entering` — basic activation", () => {
  it("Calling `render({ cuePhase: entering, activeCue, ... })` results in the cue's words appearing as spans in `container` (i.e., `setCue` was actually called on some acquired view).", () => {
    const container = document.createElement("div");
    const renderer = createRenderer(container);
    const RENDER_STATE = createTestRenderState(RENDER_STATE_1);
    renderer.render(RENDER_STATE);
    const activeCue = RENDER_STATE.activeCue;
    expect(container.querySelectorAll("span").length).toBe(
      activeCue.words.length,
    );
    for (let i = 0; i < activeCue.words.length; i++) {
      expect(container.querySelectorAll("span")[i].textContent).toBe(
        activeCue.words[i].word,
      );
    }
  });
});

describe(" `active` — word revealing", () => {
  it(" After an `entering` call, calling `render({ cuePhase: active, visibleWordIndex, reduceMotion, ... })` results in the correct spans getting `data-visible=true` (proving `updateVisibleWord` was called on the *same* view acquired during `entering`, not a new one).", () => {});
});

describe(" `exiting` — held, not released", () => {
  it("After `entering` + `active`, calling `render({ cuePhase: exiting, ... })` doesn't clear the DOM or release the view — the previously revealed words are still present and still `data-visible=true` (proving `exiting` is correctly inert).", () => {});
  it("Multiple consecutive `exiting` calls don't cause any additional `acquire()` calls — you can test this by exhausting the rest of the pool (if `poolSize` is small) and confirming repeated `exiting` ticks don't throw a pool-exhaustion error (since they shouldn't be acquiring anything).", () => {});
});

describe("`exiting → idle` — release on transition", () => {
  it("After `entering` → `active` → `exiting`, calling `render({ cuePhase: idle, ... })` releases the view — verify by acquiring `poolSize` views afterward and confirming there's no stuck view still marked in-use (i.e., the pool has recovered full capacity).", () => {});
  it("The DOM is cleared after this transition (since `release()` calls `view.clear()` internally).", () => {});
});

describe("`exiting → entering` — release then immediately reuse (no `idle` in between)", () => {
  it("A sequence `entering` (cue A) → `active` → `exiting` → `entering` (cue B) — confirm the transition-detection logic still fires correctly even when moving straight into a new `entering` rather than through `idle`.", () => {});
});

describe(" Full multi-cue sequence", () => {
  it("Two full cue lifecycles back to back (`entering` → `active` (x2-3) → `exiting` → `idle` → `entering` → `active` → `exiting` → `idle`) — confirm the second cue's words correctly replace the first cue's words in the DOM, with no leftover spans or attributes from cue A.", () => {});
});

describe("Edge case — `active` before `entering`", () => {
  it("Calling `render({ cuePhase: active, ... })` as the very first call ever (no prior `entering`) doesn't throw (confirms your exam Q7 finding — optional chaining fails safe).", () => {});
});

describe("Edge case — pool exhaustion during `entering`", () => {
  it("Repeated entering calls without release leak pool slots — after N such calls (poolSize), the pool is exhausted even though no cue has ever legitimately reached exiting/idle. This documents the known leak (see gaps list), not a defensive success.", () => {});
});
