import { createCueNodePool } from "../src/renderer/CueNodePool.js";
import { describe, it, expect } from "vitest";
import { EnrichedCue } from "@cue-engine/core";
import { createCueView } from "../src/renderer/CueView.js";

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

describe(" Pool creation", () => {
  it("Each created view has appended its `rootElement` into `container` (you can check `container.children.length === poolSize` right after creation).", () => {
    const container = document.createElement("div");
    createCueNodePool(container, 3);
    expect(container.children.length).toBe(3);
  });
  it("Default `poolSize` (no second argument) creates `2` views — confirm the default actually applies.", () => {
    const container = document.createElement("div");
    createCueNodePool(container);
    expect(container.children.length).toBe(2);
  });
});

describe("`acquire()` — basic behavior", () => {
  it("Calling `acquire()` returns a valid `CueView` (has `setCue`, `updateVisibleWord`, `clear` methods).", () => {
    const container = document.createElement("div");
    const pool = createCueNodePool(container, 2);
    const view = pool.acquire();
    expect(view).toBeDefined();
    expect(typeof view.setCue).toBe("function");
    expect(typeof view.updateVisibleWord).toBe("function");
    expect(typeof view.clear).toBe("function");
  });
  it("Calling `acquire()` `poolSize` times in a row returns `poolSize` distinct views (no duplicates — assert the returned references are all different).", () => {
    const container = document.createElement("div");
    const pool = createCueNodePool(container, 3);
    const view1 = pool.acquire();
    const view2 = pool.acquire();
    const view3 = pool.acquire();
    expect(view1).toBeDefined();
    expect(view2).toBeDefined();
    expect(view3).toBeDefined();
    expect(view1).not.toBe(view2);
    expect(view1).not.toBe(view3);
    expect(view2).not.toBe(view3);
  });
  it("Calling `acquire()` one more time than `poolSize` throws.", () => {
    const container = document.createElement("div");
    const pool = createCueNodePool(container, 2);
    pool.acquire();
    pool.acquire();
    expect(() => pool.acquire()).toThrow(
      "CueNodePool exhausted. All CueView instances are currently in use.",
    );
  });
});

describe("`release()` — basic behavior", () => {
  it("Releasing an acquired view makes it available again — acquire all views, release one, acquire again, confirm you get a view back without throwing (and ideally confirm it's the same reference you just released, since it's the only free one).", () => {
    const container = document.createElement("div");
    const pool = createCueNodePool(container, 3);
    const view1 = pool.acquire();
    const view2 = pool.acquire();
    const view3 = pool.acquire();
    pool.release(view2);
    pool.release(view3);
    expect(pool.acquire()).toBe(view2);
    expect(pool.acquire()).toBe(view3);
  });
  it("`release(view)` calls `view.clear()` internally — you can test this by acquiring a view, calling `setCue()` on it directly (populating spans), releasing it, then checking the view's DOM/spans are empty (this indirectly proves `clear()` ran).", () => {
    const container = document.createElement("div");
    const pool = createCueNodePool(container, 3);
    const firstView = pool.acquire();
    const secondView = pool.acquire();
    firstView.setCue(VALID_CUE_1);
    secondView.setCue(VALID_CUE_1);
    pool.release(firstView);
    expect(container.children[0].children.length).toBe(0);
    expect(container.children[1].children.length).toBe(
      VALID_CUE_1.words.length,
    );
  });
});

describe("`release()` — idempotency and edge cases", () => {
  it("Calling `release()` twice in a row on the same view doesn't throw.", () => {
    const container = document.createElement("div");
    const pool = createCueNodePool(container, 3);
    const view = pool.acquire();
    pool.release(view);
    expect(() => pool.release(view)).not.toThrow();
  });
  it("Calling `release()` on a view that was never acquired doesn't throw (per your exam answer — `Set.delete()` on a non-member is safe).", () => {
    const container = document.createElement("div");
    const pool = createCueNodePool(container, 3);
    const view = createCueView(container);
    expect(() => pool.release(view)).not.toThrow();
  });
});

describe(" Exhaustion and recovery", () => {
  it("Pool exhaustion (`acquire()` throws when full) followed by a `release()`, followed by another `acquire()` — confirm the pool recovers correctly and doesn't stay stuck thinking it's exhausted.", () => {
    const container = document.createElement("div");
    const pool = createCueNodePool(container, 2);
    pool.acquire();
    const view = pool.acquire();
    pool.release(view);
    expect(() => pool.acquire()).not.toThrow();
  });
});

describe("`poolSize` edge values", () => {
  it("`poolSize = 0` — `acquire()` throws immediately, no special-case crash (confirms your exam Q10 answer holds in actual code, not just in your head).", () => {
    const container = document.createElement("div");
    const pool = createCueNodePool(container, 0);
    expect(() => pool.acquire()).toThrow(
      "CueNodePool exhausted. All CueView instances are currently in use.",
    );
  });
  it("`poolSize = 1` — acquire once succeeds, second acquire throws, release then acquire succeeds again (sanity check at the smallest non-zero size).", () => {
    const container = document.createElement("div");
    const pool = createCueNodePool(container, 1);
    const view = pool.acquire();
    expect(() => pool.acquire()).toThrow(
      "CueNodePool exhausted. All CueView instances are currently in use.",
    );
    pool.release(view);
    expect(() => pool.acquire()).not.toThrow();
  });
});
