import { describe, it, expect } from "vitest";
import { urgency } from "../src/intent/lexicons/urgency.js";
import { hesitation } from "../src/intent/lexicons/hesitation.js";
import { loud } from "../src/intent/lexicons/loud.js";
import { whisper } from "../src/intent/lexicons/whisper.js";

describe("intent lexicons", () => {
  it("contains urgency entries for fast-pace cues", () => {
    expect(urgency.now).toBe(0.6);
    expect(urgency.hurry).toBe(0.6);
    expect(urgency.quick).toBe(0.6);
    expect(urgency.run).toBe(0.6);
    expect(urgency.wait).toBeLessThan(urgency.now);
    expect(urgency.emergency).toBeGreaterThan(0);
  });

  it("contains hesitation entries for slow-pace phrases", () => {
    expect(hesitation.um).toBe(0.65);
    expect(hesitation.uh).toBe(0.65);
    expect(hesitation.well).toBe(0.65);
    expect(hesitation["wait a second"]).toBe(0.65);
    expect(hesitation["just a moment"]).toBe(0.65);
  });

  it("contains loud intensity entries", () => {
    expect(loud.scream).toBeGreaterThan(0);
    expect(loud.yell).toBeGreaterThan(0);
  });

  it("contains whisper intensity entries", () => {
    expect(whisper.whisper).toBeGreaterThan(0);
    expect(whisper.softly).toBeGreaterThan(0);
  });
});
