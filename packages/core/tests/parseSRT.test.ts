import { describe, it, expect } from "vitest";
import { parseSRT } from "../src/parsers/parseSRT.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSRT(blocks: string[]): string {
  return blocks.join("\n\n");
}

const VALID_BLOCK_1 = "1\n00:00:01,000 --> 00:00:03,000\nHello world";
const VALID_BLOCK_2 = "2\n00:00:04,000 --> 00:00:06,000\nGoodbye world";
const VALID_BLOCK_3 = "3\n00:00:07,000 --> 00:00:09,000\nThird line";

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

describe("input validation", () => {
  it("throws TypeError when content is a number", () => {
    // @ts-expect-error — intentional runtime misuse
    expect(() => parseSRT(42)).toThrow(TypeError);
  });

  it("throws TypeError when content is null", () => {
    // @ts-expect-error
    expect(() => parseSRT(null)).toThrow(TypeError);
  });

  it("throws TypeError when content is undefined", () => {
    // @ts-expect-error
    expect(() => parseSRT(undefined)).toThrow(TypeError);
  });

  it("throws TypeError when content is an object", () => {
    // @ts-expect-error
    expect(() => parseSRT({})).toThrow(TypeError);
  });

  it("TypeError message includes the actual type received", () => {
    try {
      // @ts-expect-error
      parseSRT(123);
    } catch (err) {
      expect((err as TypeError).message).toMatch("number");
    }
  });
});

// ---------------------------------------------------------------------------
// Empty and blank input
// ---------------------------------------------------------------------------

describe("empty and blank input", () => {
  it("returns empty result for empty string", () => {
    const result = parseSRT("");
    expect(result.cues).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("returns empty result for whitespace-only string", () => {
    const result = parseSRT("   \n\n\t  ");
    expect(result.cues).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("returns empty result for newlines only", () => {
    const result = parseSRT("\n\n\n");
    expect(result.cues).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// BOM handling
// ---------------------------------------------------------------------------

describe("BOM handling", () => {
  it("strips UTF-8 BOM from the start of content", () => {
    const bom = "\uFEFF";
    const result = parseSRT(`${bom}${VALID_BLOCK_1}`);
    expect(result.cues).toHaveLength(1);
    expect(result.cues[0]?.id).toBe("1");
    expect(result.errors).toHaveLength(0);
  });

  it("does not corrupt cue ID when BOM is present", () => {
    const result = parseSRT(`\uFEFF${VALID_BLOCK_1}`);
    expect(result.cues[0]?.id).toBe("1");
  });

  it("handles content without BOM normally", () => {
    const result = parseSRT(VALID_BLOCK_1);
    expect(result.cues).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Valid input — single cue
// ---------------------------------------------------------------------------

describe("valid single cue", () => {
  it("parses a single valid cue", () => {
    const result = parseSRT(VALID_BLOCK_1);
    expect(result.cues).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it("returns correct cue id", () => {
    const result = parseSRT(VALID_BLOCK_1);
    expect(result.cues[0]?.id).toBe("1");
  });

  it("returns startTime in milliseconds", () => {
    const result = parseSRT(VALID_BLOCK_1);
    expect(result.cues[0]?.startTime).toBe(1000);
  });

  it("returns endTime in milliseconds", () => {
    const result = parseSRT(VALID_BLOCK_1);
    expect(result.cues[0]?.endTime).toBe(3000);
  });

  it("returns correct text", () => {
    const result = parseSRT(VALID_BLOCK_1);
    expect(result.cues[0]?.text).toBe("Hello world");
  });
});

// ---------------------------------------------------------------------------
// Valid input — multiple cues
// ---------------------------------------------------------------------------

describe("valid multiple cues", () => {
  it("parses multiple valid cues", () => {
    const result = parseSRT(
      makeSRT([VALID_BLOCK_1, VALID_BLOCK_2, VALID_BLOCK_3]),
    );
    expect(result.cues).toHaveLength(3);
    expect(result.errors).toHaveLength(0);
  });

  it("preserves cue order", () => {
    const result = parseSRT(
      makeSRT([VALID_BLOCK_1, VALID_BLOCK_2, VALID_BLOCK_3]),
    );
    expect(result.cues[0]?.id).toBe("1");
    expect(result.cues[1]?.id).toBe("2");
    expect(result.cues[2]?.id).toBe("3");
  });

  it("handles Windows-style line endings (CRLF)", () => {
    const content =
      "1\r\n00:00:01,000 --> 00:00:03,000\r\nHello world\r\n\r\n2\r\n00:00:04,000 --> 00:00:06,000\r\nGoodbye";
    const result = parseSRT(content);
    expect(result.cues).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it("handles mixed line endings", () => {
    const content =
      "1\r\n00:00:01,000 --> 00:00:03,000\r\nHello\n\n2\n00:00:04,000 --> 00:00:06,000\nWorld";
    const result = parseSRT(content);
    expect(result.cues).toHaveLength(2);
  });

  it("handles multi-line cue text", () => {
    const block =
      "1\n00:00:01,000 --> 00:00:03,000\nLine one\nLine two\nLine three";
    const result = parseSRT(block);
    expect(result.cues[0]?.text).toBe("Line one\nLine two\nLine three");
  });
});

// ---------------------------------------------------------------------------
// Timestamp parsing
// ---------------------------------------------------------------------------

describe("timestamp parsing", () => {
  it("parses zero timestamp correctly", () => {
    const result = parseSRT("1\n00:00:00,000 --> 00:00:01,000\nText");
    expect(result.cues[0]?.startTime).toBe(0);
  });

  it("parses hours correctly", () => {
    const result = parseSRT("1\n01:00:00,000 --> 02:00:00,000\nText");
    expect(result.cues[0]?.startTime).toBe(3600000);
    expect(result.cues[0]?.endTime).toBe(7200000);
  });

  it("parses milliseconds correctly", () => {
    const result = parseSRT("1\n00:00:00,500 --> 00:00:00,750\nText");
    expect(result.cues[0]?.startTime).toBe(500);
    expect(result.cues[0]?.endTime).toBe(750);
  });

  it("accepts dot as millisecond separator", () => {
    const result = parseSRT("1\n00:00:01.000 --> 00:00:03.000\nText");
    expect(result.cues[0]?.startTime).toBe(1000);
    expect(result.cues[0]?.endTime).toBe(3000);
  });

  it("handles 1-digit milliseconds", () => {
    const result = parseSRT("1\n00:00:01,5 --> 00:00:03,0\nText");
    expect(result.cues[0]?.startTime).toBe(1500);
  });

  it("handles 2-digit milliseconds", () => {
    const result = parseSRT("1\n00:00:01,50 --> 00:00:03,00\nText");
    expect(result.cues[0]?.startTime).toBe(1500);
  });

  it("handles large hour values", () => {
    const result = parseSRT("1\n99:59:59,999 --> 99:59:59,999\nText");
    // startTime === endTime triggers INVALID_TIME_RANGE, but timestamp itself should parse
    expect(result.errors[0]?.code).toBe("INVALID_TIME_RANGE");
  });

  it("handles timestamp with extra whitespace around -->", () => {
    const result = parseSRT("1\n00:00:01,000  -->  00:00:03,000\nText");
    expect(result.cues[0]?.startTime).toBe(1000);
    expect(result.cues[0]?.endTime).toBe(3000);
  });
});

// ---------------------------------------------------------------------------
// INVALID_FORMAT errors
// ---------------------------------------------------------------------------

describe("INVALID_FORMAT", () => {
  it("reports error for block with only one line", () => {
    const result = parseSRT("1");
    expect(result.errors[0]?.code).toBe("INVALID_FORMAT");
  });

  it("reports error for block with only two lines", () => {
    const result = parseSRT("1\n00:00:01,000 --> 00:00:03,000");
    expect(result.errors[0]?.code).toBe("MISSING_TEXT");
  });

  it("includes block line number in error", () => {
    const result = parseSRT("1");
    expect(result.errors[0]?.line).toBe(0);
  });

  it("includes rawBlock in error", () => {
    const result = parseSRT("1");
    expect(result.errors[0]?.rawBlock).toBe("1");
  });

  it("error severity is 'error'", () => {
    const result = parseSRT("1");
    expect(result.errors[0]?.severity).toBe("error");
  });

  it("continues parsing valid blocks after invalid one", () => {
    const result = parseSRT(makeSRT(["bad", VALID_BLOCK_1]));
    expect(result.cues).toHaveLength(1);
    expect(result.cues[0]?.id).toBe("1");
  });
});

// ---------------------------------------------------------------------------
// INVALID_TIMESTAMP errors
// ---------------------------------------------------------------------------

describe("INVALID_TIMESTAMP", () => {
  it("reports error when --> is missing", () => {
    const result = parseSRT("1\n00:00:01,000 00:00:03,000\nText");
    expect(result.errors[0]?.code).toBe("INVALID_TIMESTAMP");
  });

  it("reports error when start timestamp is malformed", () => {
    const result = parseSRT("1\nXX:XX:XX,000 --> 00:00:03,000\nText");
    expect(result.errors[0]?.code).toBe("INVALID_TIMESTAMP");
  });

  it("reports error when end timestamp is malformed", () => {
    const result = parseSRT("1\n00:00:01,000 --> XX:XX:XX,000\nText");
    expect(result.errors[0]?.code).toBe("INVALID_TIMESTAMP");
  });

  it("reports error when timestamp line is empty", () => {
    const result = parseSRT("1\n\nText");
    // Empty second line causes INVALID_FORMAT (lines[1] is falsy)
    expect(result.errors[0]?.code).toBe("INVALID_FORMAT");
  });

  it("includes cueId in error", () => {
    const result = parseSRT("1\nBAD TIMESTAMP\nText");
    expect(result.errors[0]?.cueId).toBe("1");
  });

  it("error severity is 'error'", () => {
    const result = parseSRT("1\nBAD TIMESTAMP\nText");
    expect(result.errors[0]?.severity).toBe("error");
  });

  it("skips cue with invalid timestamp but continues parsing", () => {
    const content = makeSRT(["1\nBAD\nText", VALID_BLOCK_2]);
    const result = parseSRT(content);
    expect(result.cues).toHaveLength(1);
    expect(result.cues[0]?.id).toBe("2");
  });
});

// ---------------------------------------------------------------------------
// INVALID_TIME_RANGE errors
// ---------------------------------------------------------------------------

describe("INVALID_TIME_RANGE", () => {
  it("reports error when start equals end time", () => {
    const result = parseSRT("1\n00:00:03,000 --> 00:00:03,000\nText");
    expect(result.errors[0]?.code).toBe("INVALID_TIME_RANGE");
  });

  it("reports error when start is after end time", () => {
    const result = parseSRT("1\n00:00:05,000 --> 00:00:03,000\nText");
    expect(result.errors[0]?.code).toBe("INVALID_TIME_RANGE");
  });

  it("error severity is 'error'", () => {
    const result = parseSRT("1\n00:00:05,000 --> 00:00:03,000\nText");
    expect(result.errors[0]?.severity).toBe("error");
  });

  it("skips the invalid cue but continues parsing", () => {
    const content = makeSRT([
      "1\n00:00:05,000 --> 00:00:03,000\nText",
      VALID_BLOCK_2,
    ]);
    const result = parseSRT(content);
    expect(result.cues).toHaveLength(1);
    expect(result.cues[0]?.id).toBe("2");
  });
});

// ---------------------------------------------------------------------------
// MISSING_TEXT errors
// ---------------------------------------------------------------------------

describe("MISSING_TEXT", () => {
  it("reports warning when text is empty", () => {
    const result = parseSRT("1\n00:00:01,000 --> 00:00:03,000\n");
    expect(result.errors[0]?.code).toBe("MISSING_TEXT");
  });

  it("warning severity is 'warning'", () => {
    const result = parseSRT("1\n00:00:01,000 --> 00:00:03,000\n");
    expect(result.errors[0]?.severity).toBe("warning");
  });

  it("skips empty text cue by default", () => {
    const result = parseSRT("1\n00:00:01,000 --> 00:00:03,000\n");
    expect(result.cues).toHaveLength(0);
  });

  it("includes empty text cue when allowEmptyText is true", () => {
    const result = parseSRT("1\n00:00:01,000 --> 00:00:03,000\n", {
      allowEmptyText: true,
    });
    expect(result.cues).toHaveLength(1);
    expect(result.cues[0]?.text).toBe("");
  });

  it("does not emit MISSING_TEXT error when allowEmptyText is true", () => {
    const result = parseSRT("1\n00:00:01,000 --> 00:00:03,000\n", {
      allowEmptyText: true,
    });
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// INVALID_CUE_ID errors
// ---------------------------------------------------------------------------

describe("INVALID_CUE_ID", () => {
  it("reports warning when cue ID is not numeric", () => {
    const result = parseSRT("abc\n00:00:01,000 --> 00:00:03,000\nText");
    expect(result.errors.some((e) => e.code === "INVALID_CUE_ID")).toBe(true);
  });

  it("warning severity is 'warning'", () => {
    const result = parseSRT("abc\n00:00:01,000 --> 00:00:03,000\nText");
    const err = result.errors.find((e) => e.code === "INVALID_CUE_ID");
    expect(err?.severity).toBe("warning");
  });

  it("still parses the cue despite invalid ID", () => {
    const result = parseSRT("abc\n00:00:01,000 --> 00:00:03,000\nText");
    expect(result.cues).toHaveLength(1);
    expect(result.cues[0]?.id).toBe("abc");
  });

  it("does not warn for numeric cue IDs", () => {
    const result = parseSRT(VALID_BLOCK_1);
    expect(result.errors.some((e) => e.code === "INVALID_CUE_ID")).toBe(false);
  });

  it("includes the invalid cueId in the error", () => {
    const result = parseSRT("abc\n00:00:01,000 --> 00:00:03,000\nText");
    const err = result.errors.find((e) => e.code === "INVALID_CUE_ID");
    expect(err?.cueId).toBe("abc");
  });
});

// ---------------------------------------------------------------------------
// OUT_OF_ORDER errors
// ---------------------------------------------------------------------------

describe("OUT_OF_ORDER", () => {
  it("does not check order by default", () => {
    const content = makeSRT([
      "1\n00:00:05,000 --> 00:00:07,000\nLate",
      "2\n00:00:01,000 --> 00:00:03,000\nEarly",
    ]);
    const result = parseSRT(content);
    expect(result.errors.some((e) => e.code === "OUT_OF_ORDER")).toBe(false);
  });

  it("reports warning when cue starts before previous cue ends with validateOrder", () => {
    const content = makeSRT([
      "1\n00:00:01,000 --> 00:00:05,000\nFirst",
      "2\n00:00:03,000 --> 00:00:07,000\nOverlap",
    ]);
    const result = parseSRT(content, { validateOrder: true });
    expect(result.errors.some((e) => e.code === "OUT_OF_ORDER")).toBe(true);
  });

  it("warning severity is 'warning'", () => {
    const content = makeSRT([
      "1\n00:00:01,000 --> 00:00:05,000\nFirst",
      "2\n00:00:03,000 --> 00:00:07,000\nOverlap",
    ]);
    const result = parseSRT(content, { validateOrder: true });
    const err = result.errors.find((e) => e.code === "OUT_OF_ORDER");
    expect(err?.severity).toBe("warning");
  });

  it("still includes the out-of-order cue in results", () => {
    const content = makeSRT([
      "1\n00:00:01,000 --> 00:00:05,000\nFirst",
      "2\n00:00:03,000 --> 00:00:07,000\nOverlap",
    ]);
    const result = parseSRT(content, { validateOrder: true });
    expect(result.cues).toHaveLength(2);
  });

  it("does not warn for non-overlapping cues", () => {
    const content = makeSRT([VALID_BLOCK_1, VALID_BLOCK_2, VALID_BLOCK_3]);
    const result = parseSRT(content, { validateOrder: true });
    expect(result.errors.some((e) => e.code === "OUT_OF_ORDER")).toBe(false);
  });

  it("does not warn when cue starts exactly when previous ends", () => {
    const content = makeSRT([
      "1\n00:00:01,000 --> 00:00:03,000\nFirst",
      "2\n00:00:03,000 --> 00:00:05,000\nSecond",
    ]);
    const result = parseSRT(content, { validateOrder: true });
    expect(result.errors.some((e) => e.code === "OUT_OF_ORDER")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// stopOnFirstError
// ---------------------------------------------------------------------------

describe("stopOnFirstError", () => {
  it("halts on first error and returns empty cues", () => {
    const content = makeSRT(["bad", VALID_BLOCK_1, VALID_BLOCK_2]);
    const result = parseSRT(content, { stopOnFirstError: true });
    expect(result.cues).toHaveLength(0);
  });

  it("returns errors collected up to the halt point", () => {
    const content = makeSRT(["bad", VALID_BLOCK_1]);
    const result = parseSRT(content, { stopOnFirstError: true });
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe("INVALID_FORMAT");
  });

  it("does not halt on errors when stopOnFirstError is false", () => {
    const content = makeSRT(["bad", VALID_BLOCK_1, VALID_BLOCK_2]);
    const result = parseSRT(content, { stopOnFirstError: false });
    expect(result.cues).toHaveLength(2);
  });

  it("halts on INVALID_TIMESTAMP", () => {
    const content = makeSRT(["1\nBAD\nText", VALID_BLOCK_2]);
    const result = parseSRT(content, { stopOnFirstError: true });
    expect(result.cues).toHaveLength(0);
    expect(result.errors[0]?.code).toBe("INVALID_TIMESTAMP");
  });

  it("halts on INVALID_TIME_RANGE", () => {
    const content = makeSRT([
      "1\n00:00:05,000 --> 00:00:01,000\nText",
      VALID_BLOCK_2,
    ]);
    const result = parseSRT(content, { stopOnFirstError: true });
    expect(result.cues).toHaveLength(0);
  });

  it("halts on MISSING_TEXT warning", () => {
    const content = makeSRT([
      "1\n00:00:01,000 --> 00:00:03,000\n",
      VALID_BLOCK_2,
    ]);
    const result = parseSRT(content, { stopOnFirstError: true });
    expect(result.cues).toHaveLength(0);
  });

  it("halts on INVALID_CUE_ID warning", () => {
    const content = makeSRT([
      "abc\n00:00:01,000 --> 00:00:03,000\nText",
      VALID_BLOCK_2,
    ]);
    const result = parseSRT(content, { stopOnFirstError: true });
    expect(result.cues).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Multiple errors in one parse
// ---------------------------------------------------------------------------

describe("multiple errors", () => {
  it("collects errors from multiple bad blocks", () => {
    const content = makeSRT(["bad1", "bad2", "bad3"]);
    const result = parseSRT(content);
    expect(result.errors).toHaveLength(3);
  });

  it("collects mixed error types", () => {
    const content = makeSRT([
      "bad",
      "1\nBAD TIMESTAMP\nText",
      "2\n00:00:05,000 --> 00:00:01,000\nText",
      VALID_BLOCK_3,
    ]);
    const result = parseSRT(content);
    const codes = result.errors.map((e) => e.code);
    expect(codes).toContain("INVALID_FORMAT");
    expect(codes).toContain("INVALID_TIMESTAMP");
    expect(codes).toContain("INVALID_TIME_RANGE");
    expect(result.cues).toHaveLength(1);
  });

  it("assigns correct line numbers to each error", () => {
    const content = makeSRT(["bad1", "bad2"]);
    const result = parseSRT(content);
    expect(result.errors[0]?.line).toBe(0);
    expect(result.errors[1]?.line).toBe(2);
  });
});

describe("stripTags option", () => {
  it("strips italic tags when stripTags is true", () => {
    const result = parseSRT("1\n00:00:01,000 --> 00:00:03,000\n<i>Hello</i>", {
      stripTags: true,
    });
    expect(result.cues[0]?.text).toBe("Hello");
  });

  it("strips bold tags when stripTags is true", () => {
    const result = parseSRT("1\n00:00:01,000 --> 00:00:03,000\n<b>Hello</b>", {
      stripTags: true,
    });
    expect(result.cues[0]?.text).toBe("Hello");
  });

  it("strips font tags when stripTags is true", () => {
    const result = parseSRT(
      '1\n00:00:01,000 --> 00:00:03,000\n<font color="red">Hello</font>',
      { stripTags: true },
    );
    expect(result.cues[0]?.text).toBe("Hello");
  });

  it("preserves tags when stripTags is false", () => {
    const result = parseSRT("1\n00:00:01,000 --> 00:00:03,000\n<i>Hello</i>", {
      stripTags: false,
    });
    expect(result.cues[0]?.text).toBe("<i>Hello</i>");
  });

  it("preserves tags by default", () => {
    const result = parseSRT("1\n00:00:01,000 --> 00:00:03,000\n<i>Hello</i>");
    expect(result.cues[0]?.text).toBe("<i>Hello</i>");
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("edge cases", () => {
  it("handles a single valid cue with trailing newlines", () => {
    const result = parseSRT(`${VALID_BLOCK_1}\n\n\n`);
    expect(result.cues).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it("handles extra blank lines between blocks", () => {
    const result = parseSRT(`${VALID_BLOCK_1}\n\n\n\n${VALID_BLOCK_2}`);
    // Extra blank lines produce empty blocks which fail INVALID_FORMAT
    // Valid cues should still parse
    expect(result.cues.length).toBeGreaterThanOrEqual(2);
  });

  it("trims leading and trailing whitespace from cue text", () => {
    const result = parseSRT("1\n00:00:01,000 --> 00:00:03,000\n  Hello  ");
    expect(result.cues[0]?.text).toBe("Hello");
  });

  it("handles cue text with special characters", () => {
    const result = parseSRT(
      '1\n00:00:01,000 --> 00:00:03,000\n<i>Hello</i> & "world"',
    );
    expect(result.cues[0]?.text).toBe('<i>Hello</i> & "world"');
  });

  it("handles unicode text", () => {
    const result = parseSRT("1\n00:00:01,000 --> 00:00:03,000\n日本語字幕");
    expect(result.cues[0]?.text).toBe("日本語字幕");
  });

  it("handles a very large number of cues", () => {
    const blocks = Array.from({ length: 1000 }, (_, i) => {
      const start = i * 2;
      const end = start + 1;
      const fmt = (s: number) => `00:00:${String(s % 60).padStart(2, "0")},000`;
      return `${i + 1}\n${fmt(start)} --> ${fmt(end)}\nLine ${i + 1}`;
    });
    const result = parseSRT(makeSRT(blocks));
    expect(result.cues).toHaveLength(1000);
    expect(result.errors).toHaveLength(0);
  });
});
