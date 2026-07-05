import { describe, it, expect } from "vitest";
import { presplit } from "../src/preparation/presplit.js";

describe("presplitting cue text into word", () => {
  it("empty string", () => {
    expect(presplit("")).toHaveLength(0);
  });
  it("whitespace-only string", () => {
    expect(presplit("   ")).toHaveLength(0);
  });
  it("single word, no whitespace", () => {
    expect(presplit("hello")).toEqual([{ word: "hello" }]);
  });
  it("multiple words separated by single spaces", () => {
    expect(presplit("hello world I am Timmy")).toEqual([
      { word: "hello" },
      { word: "world" },
      { word: "I" },
      { word: "am" },
      { word: "Timmy" },
    ]);
  });
  it("multiple words separated by multiple consecutive spaces", () => {
    expect(presplit("hello   world    I     am    Timmy")).toEqual([
      { word: "hello" },
      { word: "world" },
      { word: "I" },
      { word: "am" },
      { word: "Timmy" },
    ]);
  });
  it("multi-line text with newlines between words", () => {
    expect(presplit("hello\nworld\nI\nam\nTimmy")).toEqual([
      { word: "hello" },
      { word: "world" },
      { word: "I" },
      { word: "am" },
      { word: "Timmy" },
    ]);
  });
  it("Leading and trailing whitespace around otherwise valid text", () => {
    expect(presplit("   hello world\nI am\nTimmy   ")).toEqual([
      { word: "hello" },
      { word: "world" },
      { word: "I" },
      { word: "am" },
      { word: "Timmy" },
    ]);
  });
  it("a word with punctuation attached", () => {
    expect(presplit("   hello, world!\nI am, Timmy!   ")).toEqual([
      { word: "hello," },
      { word: "world!" },
      { word: "I" },
      { word: "am," },
      { word: "Timmy!" },
    ]);
  });
});
