import { describe, it, expect } from "vitest";
import { enrichCues } from "../src/preparation/enrichCues.js";
import type { CaptionCue } from "../src/types/CaptionCue.js";

const VALID_CUE_1: CaptionCue = {
  id: "1",
  startTime: 0,
  endTime: 9000,
  text: "Hello",
};
const VALID_CUE_2: CaptionCue = {
  id: "2",
  startTime: 9000,
  endTime: 18000,
  text: "",
};
const VALID_CUE_3: CaptionCue = {
  id: "3",
  startTime: 18000,
  endTime: 27000,
  text: "Thank you for watching, and don't forget to like and subscribe!",
};

describe("enrich cues", () => {
  it("should enrich a valid cue", () => {
    const enrichedCues = enrichCues([VALID_CUE_3]);
    expect(enrichedCues).toHaveLength(1);
    expect(enrichedCues[0].id).toBe("3");
    expect(enrichedCues[0].words).toEqual([
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
    ]);
  });
  it("preserve all the original cue fields", () => {
    const enrichedCues = enrichCues([VALID_CUE_3]);
    expect(enrichedCues).toHaveLength(1);
    expect(enrichedCues[0].id).toBe("3");
    expect(enrichedCues[0].startTime).toBe(18000);
    expect(enrichedCues[0].endTime).toBe(27000);
    expect(enrichedCues[0].text).toBe(
      "Thank you for watching, and don't forget to like and subscribe!",
    );
  });
  it("it correctly attaches words from presplit", () => {
    const enrichedCues = enrichCues([VALID_CUE_3]);
    expect(enrichedCues[0].words).toEqual([
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
    ]);
  });
  it("the default intent has the right shape and values", () => {
    const enrichedCues = enrichCues([VALID_CUE_3]);
    expect(enrichedCues[0].intent).toEqual({
      intensity: "normal",
      pace: "normal",
      confidence: 0,
      source: "default",
    });
  });
  it("an empty array input", () => {
    const enrichedCues = enrichCues([]);
    expect(enrichedCues).toHaveLength(0);
    expect(enrichedCues).toEqual([]);
  });
  it("cue has empty text", () => {
    const enrichedCues = enrichCues([VALID_CUE_2]);
    expect(enrichedCues).toHaveLength(1);
    expect(enrichedCues[0].words).toEqual([]);
  });
  it(" it handles multiple cues correctly", () => {
    const enrichedCues = enrichCues([VALID_CUE_1, VALID_CUE_2, VALID_CUE_3]);
    expect(enrichedCues).toHaveLength(3);
    expect(enrichedCues[0].words).toEqual([{ word: "Hello" }]);
    expect(enrichedCues[1].words).toEqual([]);
    expect(enrichedCues[2].words).toEqual([
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
    ]);
  });
});
