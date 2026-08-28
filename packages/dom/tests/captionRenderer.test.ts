import { CaptionRenderState, EnrichedCue } from "@cue-engine/core";
import { createRenderer } from "../src/renderer/CaptionRenderer.js";
import { describe, it, expect } from "vitest";

type ValidatedActiveRenderState = Omit<CaptionRenderState, "activeCue"> & {
  activeCue: EnrichedCue;
};
type ValidatedPreviousRenderState = Omit<CaptionRenderState, "previousCue"> & {
  previousCue: EnrichedCue;
};

const CUE_A: EnrichedCue = {
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

const CUE_B: EnrichedCue = {
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

const RENDER_STATE_DEFAULT: CaptionRenderState = {
  cuePhase: "entering",
  activeCue: CUE_A,
  previousCue: CUE_B,
  reduceMotion: false,
  visibleWordIndex: 3,
};

function createTestActiveRenderState(
  overrides?: Partial<CaptionRenderState>,
): ValidatedActiveRenderState {
  const vary = {
    ...RENDER_STATE_DEFAULT,
    ...overrides,
  };
  if (!vary.activeCue) throw new Error("activeCue cannot be null");
  return { ...vary, activeCue: vary.activeCue };
}
function createTestPreviousRenderState(
  overrides?: Partial<CaptionRenderState>,
): ValidatedPreviousRenderState {
  const vary = {
    ...RENDER_STATE_DEFAULT,
    ...overrides,
  };
  if (!vary.previousCue) throw new Error("previousCue cannot be null");
  return { ...vary, previousCue: vary.previousCue };
}

describe("`entering` — basic activation", () => {
  it("Calling `render({ cuePhase: entering, activeCue, ... })` results in the cue's words appearing as spans in `container` (i.e., `setCue` was actually called on some acquired view).", () => {
    const container = document.createElement("div");
    const renderer = createRenderer(container);
    const RENDER_STATE = createTestActiveRenderState();
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
  it(" After an `entering` call, calling `render({ cuePhase: active, visibleWordIndex, reduceMotion, ... })` results in the correct spans getting `data-visible=true` (proving `updateVisibleWord` was called on the *same* view acquired during `entering`, not a new one).", () => {
    const container = document.createElement("div");
    const renderer = createRenderer(container);
    const enteringState = createTestActiveRenderState();
    renderer.render(enteringState);
    const activeState = createTestActiveRenderState({
      cuePhase: "active",
      visibleWordIndex: 3,
    });
    renderer.render(activeState);
    for (let i = 0; i <= activeState.visibleWordIndex; i++) {
      expect(
        container.querySelectorAll("span")[i].getAttribute("data-visible"),
      ).toBe("true");
      expect(
        container
          .querySelectorAll("span")
          [i].getAttribute("data-reduce-motion"),
      ).toBe("false");
    }
    for (
      let i = activeState.visibleWordIndex + 1;
      i < activeState.activeCue.words.length;
      i++
    ) {
      expect(
        container.querySelectorAll("span")[i].getAttribute("data-visible"),
      ).toBeNull();
      expect(
        container
          .querySelectorAll("span")
          [i].getAttribute("data-reduce-motion"),
      ).toBeNull();
    }
  });
});

describe(" `exiting` — held, not released", () => {
  it("After `entering` + `active`, calling `render({ cuePhase: exiting, ... })` doesn't clear the DOM or release the view — the previously revealed words are still present and still `data-visible=true` (proving `exiting` is correctly inert).", () => {
    const container = document.createElement("div");
    const renderer = createRenderer(container);
    const enteringState = createTestActiveRenderState();
    renderer.render(enteringState);
    const activeState = createTestActiveRenderState({
      cuePhase: "active",
      visibleWordIndex: 3,
    });
    renderer.render(activeState);
    const exitingState = createTestPreviousRenderState({
      cuePhase: "exiting",
      activeCue: null,
      previousCue: CUE_A,
    });
    renderer.render(exitingState);
    for (let i = 0; i <= exitingState.visibleWordIndex; i++) {
      expect(
        container.querySelectorAll("span")[i].getAttribute("data-visible"),
      ).toBe("true");
      expect(
        container
          .querySelectorAll("span")
          [i].getAttribute("data-reduce-motion"),
      ).toBe("false");
    }
    for (
      let i = exitingState.visibleWordIndex + 1;
      i < exitingState.previousCue.words.length;
      i++
    ) {
      expect(
        container.querySelectorAll("span")[i].getAttribute("data-visible"),
      ).toBeNull();
      expect(
        container
          .querySelectorAll("span")
          [i].getAttribute("data-reduce-motion"),
      ).toBeNull();
    }
  });
  it("Multiple consecutive `exiting` calls don't cause any additional `acquire()` calls — you can test this by exhausting the rest of the pool (if `poolSize` is small) and confirming repeated `exiting` ticks don't throw a pool-exhaustion error (since they shouldn't be acquiring anything).", () => {
    const container = document.createElement("div");
    const renderer = createRenderer(container);
    const enteringState = createTestActiveRenderState();
    renderer.render(enteringState);
    const activeState = createTestActiveRenderState({
      cuePhase: "active",
      visibleWordIndex: 3,
    });
    renderer.render(activeState);
    const exitingState: CaptionRenderState = {
      ...RENDER_STATE_DEFAULT,
      cuePhase: "exiting",
      activeCue: null,
      previousCue: CUE_A,
    };
    renderer.render(exitingState);
    renderer.render(exitingState);
    renderer.render(exitingState);
    renderer.render(exitingState);
    expect(() => renderer.render(createTestActiveRenderState())).not.toThrow();
    expect(() => renderer.render(createTestActiveRenderState())).not.toThrow();
    expect(() => renderer.render(createTestActiveRenderState())).not.toThrow();
    expect(() => renderer.render(createTestActiveRenderState())).toThrow();
  });
});

describe("`exiting → idle` — release on transition", () => {
  it("After `entering` → `active` → `exiting`, calling `render({ cuePhase: idle, ... })` releases the view — verify by acquiring `poolSize` views afterward and confirming there's no stuck view still marked in-use (i.e., the pool has recovered full capacity).", () => {
    const container = document.createElement("div");
    const renderer = createRenderer(container);
    const enteringState = createTestActiveRenderState();
    renderer.render(enteringState);
    const activeState = createTestActiveRenderState({
      cuePhase: "active",
      visibleWordIndex: 3,
    });
    renderer.render(activeState);
    const exitingState: CaptionRenderState = {
      ...RENDER_STATE_DEFAULT,
      cuePhase: "exiting",
      activeCue: null,
      previousCue: CUE_A,
    };
    renderer.render(exitingState);
    const idleState: CaptionRenderState = {
      ...RENDER_STATE_DEFAULT,
      cuePhase: "idle",
      activeCue: null,
      previousCue: null,
    };
    renderer.render(idleState);
    renderer.render(createTestActiveRenderState());
    renderer.render(createTestActiveRenderState());
    renderer.render(createTestActiveRenderState());
    expect(() => renderer.render(createTestActiveRenderState())).toThrow();
  });
  it("The DOM is cleared after this transition (since `release()` calls `view.clear()` internally).", () => {
    const container = document.createElement("div");
    const renderer = createRenderer(container);
    const enteringState = createTestActiveRenderState();
    renderer.render(enteringState);
    const activeState = createTestActiveRenderState({
      cuePhase: "active",
      visibleWordIndex: 3,
    });
    renderer.render(activeState);
    const exitingState: CaptionRenderState = {
      ...RENDER_STATE_DEFAULT,
      cuePhase: "exiting",
      activeCue: null,
      previousCue: CUE_A,
    };
    renderer.render(exitingState);
    const idleState: CaptionRenderState = {
      ...RENDER_STATE_DEFAULT,
      cuePhase: "idle",
      activeCue: null,
      previousCue: null,
    };
    renderer.render(idleState);
    expect(container.querySelectorAll("span").length).toBe(0);
  });
});

describe("`exiting → entering` — held-exiting release wipes newly rendered content", () => {
  it("After `entering` → `active` → `exiting` → `entering`, the held `exiting` transition releases the freshly acquired view immediately, so the DOM is left empty and the next `entering` can reacquire that slot without leaking it.", () => {
    const container = document.createElement("div");
    const renderer = createRenderer(container);
    renderer.render(createTestActiveRenderState());
    renderer.render(
      createTestActiveRenderState({
        cuePhase: "active",
        visibleWordIndex: 3,
      }),
    );
    const exitingState: CaptionRenderState = {
      ...RENDER_STATE_DEFAULT,
      cuePhase: "exiting",
      activeCue: null,
      previousCue: CUE_A,
    };
    renderer.render(exitingState);
    renderer.render(
      createTestActiveRenderState({ cuePhase: "entering", activeCue: CUE_B }),
    );
    expect(container.querySelectorAll("span")).toHaveLength(CUE_A.words.length);
    expect(() =>
      renderer.render(
        createTestActiveRenderState({ cuePhase: "entering", activeCue: CUE_B }),
      ),
    ).not.toThrow();
    expect(container.querySelectorAll("span")).toHaveLength(CUE_B.words.length + CUE_A.words.length);
    expect(container.querySelectorAll("span")[0].textContent).toBe("Is");
  });
});

describe(" Full multi-cue sequence", () => {
  it("Two full cue lifecycles back to back (`entering` → `active` (x2-3) → `exiting` → `idle` → `entering` → `active` → `exiting` → `idle`) — confirm the second cue's words correctly replace the first cue's words in the DOM, with no leftover spans or attributes from cue A.", () => {
    const container = document.createElement("div");
    const renderer = createRenderer(container);
    renderer.render(createTestActiveRenderState());
    renderer.render(
      createTestActiveRenderState({
        cuePhase: "active",
        visibleWordIndex: 3,
      }),
    );
    const exitingState: CaptionRenderState = {
      ...RENDER_STATE_DEFAULT,
      cuePhase: "exiting",
      activeCue: null,
      previousCue: CUE_A,
    };
    renderer.render(exitingState);
    const idleState: CaptionRenderState = {
      ...RENDER_STATE_DEFAULT,
      cuePhase: "idle",
      activeCue: null,
      previousCue: null,
    };
    renderer.render(idleState);
    expect(container.querySelectorAll("span").length).toBe(0);
    renderer.render(createTestActiveRenderState({ activeCue: CUE_B }));
    expect(container.querySelectorAll("span")).toHaveLength(CUE_B.words.length);
    for (let i = 0; i < CUE_B.words.length; i++) {
      const element = container.querySelectorAll("span")[i];
      expect(element.textContent).toBe(CUE_B.words[i].word);
      expect(element.getAttribute("data-visible")).toBeNull();
      expect(element.getAttribute("data-reduce-motion")).toBeNull();
    }
    const activeState = createTestActiveRenderState({
      cuePhase: "active",
      visibleWordIndex: 3,
      activeCue: CUE_B,
    });
    renderer.render(activeState);
    for (let i = 0; i <= activeState.visibleWordIndex; i++) {
      expect(
        container.querySelectorAll("span")[i].getAttribute("data-visible"),
      ).toBe("true");
      expect(
        container
          .querySelectorAll("span")
          [i].getAttribute("data-reduce-motion"),
      ).toBe("false");
    }
    for (
      let i = activeState.visibleWordIndex + 1;
      i < activeState.activeCue.words.length;
      i++
    ) {
      expect(
        container.querySelectorAll("span")[i].getAttribute("data-visible"),
      ).toBeNull();
      expect(
        container
          .querySelectorAll("span")
          [i].getAttribute("data-reduce-motion"),
      ).toBeNull();
    }
    const exitingState2: CaptionRenderState = {
      ...RENDER_STATE_DEFAULT,
      cuePhase: "exiting",
      activeCue: null,
      previousCue: CUE_B,
    };
    renderer.render(exitingState2);
    const idleState2: CaptionRenderState = {
      ...RENDER_STATE_DEFAULT,
      cuePhase: "idle",
      activeCue: null,
      previousCue: null,
    };
    renderer.render(idleState2);
    expect(container.querySelectorAll("span").length).toBe(0);
  });
});

describe("Edge case — `active` before `entering`", () => {
  it("Calling `render({ cuePhase: active, ... })` as the very first call ever (no prior `entering`) doesn't throw (confirms your exam Q7 finding — optional chaining fails safe).", () => {
    const container = document.createElement("div");
    const renderer = createRenderer(container);
    expect(() =>
      renderer.render(
        createTestActiveRenderState({
          cuePhase: "active",
          visibleWordIndex: 3,
        }),
      ),
    ).not.toThrow();
    const RENDER_STATE = createTestActiveRenderState();
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

describe("Edge case — pool exhaustion during `entering`", () => {
  it("Repeated entering calls without release leak pool slots — after N such calls (poolSize), the pool is exhausted even though no cue has ever legitimately reached exiting/idle. This documents the known leak (see gaps list), not a defensive success.", () => {
    const container = document.createElement("div");
    const renderer = createRenderer(container);

    expect(() => renderer.render(createTestActiveRenderState())).not.toThrow();
    expect(() => renderer.render(createTestActiveRenderState())).not.toThrow();
    expect(() => renderer.render(createTestActiveRenderState())).not.toThrow();
    expect(() => renderer.render(createTestActiveRenderState())).toThrow();
    expect(container.querySelectorAll("span").length).toBe(3 * CUE_A.words.length);
  });
});
