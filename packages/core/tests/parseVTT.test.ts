import { describe, it, expect } from "vitest";
import { parseVTT } from "../src/parsers/parseVTT.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeVTT(blocks: string[]): string {
  return ["WEBVTT", ...blocks].join("\n\n");
}

const VALID_BLOCK_1 = "00:00:01.000 --> 00:00:03.000\nHello world";
const VALID_BLOCK_2 = "00:00:04.000 --> 00:00:06.000\nGoodbye world";
const VALID_BLOCK_3 = "00:00:07.000 --> 00:00:09.000\nThird line";

const VALID_BLOCK_1_WITH_ID =
  "cue-1\n00:00:01.000 --> 00:00:03.000\nHello world";
const VALID_BLOCK_2_WITH_ID =
  "cue-2\n00:00:04.000 --> 00:00:06.000\nGoodbye world";

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

describe("input validation", () => {
  it("throws TypeError when content is a number", () => {
    // @ts-expect-error — intentional runtime misuse
    expect(() => parseVTT(42)).toThrow(TypeError);
  });

  it("throws TypeError when content is null", () => {
    // @ts-expect-error
    expect(() => parseVTT(null)).toThrow(TypeError);
  });

  it("throws TypeError when content is undefined", () => {
    // @ts-expect-error
    expect(() => parseVTT(undefined)).toThrow(TypeError);
  });

  it("throws TypeError when content is an object", () => {
    // @ts-expect-error
    expect(() => parseVTT({})).toThrow(TypeError);
  });

  it("TypeError message includes the actual type received", () => {
    try {
      // @ts-expect-error
      parseVTT(123);
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
    const result = parseVTT("");
    expect(result.cues).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("returns empty result for whitespace-only string", () => {
    const result = parseVTT("   \n\n\t  ");
    expect(result.cues).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("returns empty result for newlines only", () => {
    const result = parseVTT("\n\n\n");
    expect(result.cues).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// BOM handling
// ---------------------------------------------------------------------------

describe("BOM handling", () => {
  it("strips UTF-8 BOM and parses successfully", () => {
    const result = parseVTT(`\uFEFFWEBVTT\n\n${VALID_BLOCK_1}`);
    expect(result.cues).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it("does not corrupt cue text when BOM is present", () => {
    const result = parseVTT(`\uFEFFWEBVTT\n\n${VALID_BLOCK_1}`);
    expect(result.cues[0]?.text).toBe("Hello world");
  });

  it("handles content without BOM normally", () => {
    const result = parseVTT(makeVTT([VALID_BLOCK_1]));
    expect(result.cues).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Header validation
// ---------------------------------------------------------------------------

describe("header validation", () => {
  it("returns fatal error when WEBVTT header is missing", () => {
    const result = parseVTT("00:00:01.000 --> 00:00:03.000\nHello");
    expect(result.errors[0]?.code).toBe("INVALID_FORMAT");
    expect(result.errors[0]?.severity).toBe("fatal");
    expect(result.cues).toHaveLength(0);
  });

  it("returns fatal error when header is wrong string", () => {
    const result = parseVTT("WEBTT\n\n" + VALID_BLOCK_1);
    expect(result.errors[0]?.code).toBe("INVALID_FORMAT");
    expect(result.errors[0]?.severity).toBe("fatal");
  });

  it("accepts WEBVTT with metadata on the same line", () => {
    const result = parseVTT(
      `WEBVTT - This is a caption file\n\n${VALID_BLOCK_1}`,
    );
    expect(result.cues).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts WEBVTT with a blank line before cues", () => {
    const result = parseVTT(`WEBVTT\n\n${VALID_BLOCK_1}`);
    expect(result.cues).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Block filtering
// ---------------------------------------------------------------------------

describe("block filtering", () => {
  it("silently skips NOTE blocks", () => {
    const result = parseVTT(
      `WEBVTT\n\nNOTE This is a comment\n\n${VALID_BLOCK_1}`,
    );
    expect(result.cues).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it("silently skips multiline NOTE blocks", () => {
    const result = parseVTT(
      `WEBVTT\n\nNOTE\nThis is a\nmultiline comment\n\n${VALID_BLOCK_1}`,
    );
    expect(result.cues).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it("silently skips STYLE blocks", () => {
    const result = parseVTT(
      `WEBVTT\n\nSTYLE\n::cue { color: red; }\n\n${VALID_BLOCK_1}`,
    );
    expect(result.cues).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it("silently skips REGION blocks", () => {
    const result = parseVTT(`WEBVTT\n\nREGION\nid:fred\n\n${VALID_BLOCK_1}`);
    expect(result.cues).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it("skips multiple non-cue blocks without errors", () => {
    const result = parseVTT(
      `WEBVTT\n\nNOTE comment\n\nSTYLE\n::cue {}\n\n${VALID_BLOCK_1}\n\nNOTE end\n\n${VALID_BLOCK_2}`,
    );
    expect(result.cues).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Valid input — single cue (no ID)
// ---------------------------------------------------------------------------

describe("valid single cue without ID", () => {
  it("parses a single valid cue", () => {
    const result = parseVTT(makeVTT([VALID_BLOCK_1]));
    expect(result.cues).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it("assigns a generated id when no cue ID is present", () => {
    const result = parseVTT(makeVTT([VALID_BLOCK_1]));
    expect(typeof result.cues[0]?.id).toBe("string");
    expect(result.cues[0]?.id.length).toBeGreaterThan(0);
  });

  it("returns startTime in milliseconds", () => {
    const result = parseVTT(makeVTT([VALID_BLOCK_1]));
    expect(result.cues[0]?.startTime).toBe(1000);
  });

  it("returns endTime in milliseconds", () => {
    const result = parseVTT(makeVTT([VALID_BLOCK_1]));
    expect(result.cues[0]?.endTime).toBe(3000);
  });

  it("returns correct text", () => {
    const result = parseVTT(makeVTT([VALID_BLOCK_1]));
    expect(result.cues[0]?.text).toBe("Hello world");
  });

  it("generates deterministic IDs based on block index", () => {
  const result = parseVTT(makeVTT([VALID_BLOCK_1, VALID_BLOCK_2]));
  expect(result.cues[0]?.id).toBe("cue-1");
  expect(result.cues[1]?.id).toBe("cue-2");
});
});

// ---------------------------------------------------------------------------
// Valid input — single cue (with ID)
// ---------------------------------------------------------------------------

describe("valid single cue with ID", () => {
  it("parses a cue with an explicit string ID", () => {
    const result = parseVTT(makeVTT([VALID_BLOCK_1_WITH_ID]));
    expect(result.cues).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it("preserves the explicit cue ID", () => {
    const result = parseVTT(makeVTT([VALID_BLOCK_1_WITH_ID]));
    expect(result.cues[0]?.id).toBe("cue-1");
  });

  it("accepts numeric string IDs", () => {
    const result = parseVTT(
      makeVTT(["1\n00:00:01.000 --> 00:00:03.000\nText"]),
    );
    expect(result.cues[0]?.id).toBe("1");
    expect(result.errors).toHaveLength(0);
  });

  it("accepts freeform string IDs without warning", () => {
    const result = parseVTT(
      makeVTT(["intro-caption\n00:00:01.000 --> 00:00:03.000\nText"]),
    );
    expect(result.cues[0]?.id).toBe("intro-caption");
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Valid input — multiple cues
// ---------------------------------------------------------------------------

describe("valid multiple cues", () => {
  it("parses multiple valid cues", () => {
    const result = parseVTT(
      makeVTT([VALID_BLOCK_1, VALID_BLOCK_2, VALID_BLOCK_3]),
    );
    expect(result.cues).toHaveLength(3);
    expect(result.errors).toHaveLength(0);
  });

  it("preserves cue order", () => {
    const result = parseVTT(
      makeVTT([VALID_BLOCK_1_WITH_ID, VALID_BLOCK_2_WITH_ID]),
    );
    expect(result.cues[0]?.id).toBe("cue-1");
    expect(result.cues[1]?.id).toBe("cue-2");
  });

  it("handles Windows-style line endings (CRLF)", () => {
    const content =
      "WEBVTT\r\n\r\n00:00:01.000 --> 00:00:03.000\r\nHello world\r\n\r\n00:00:04.000 --> 00:00:06.000\r\nGoodbye";
    const result = parseVTT(content);
    expect(result.cues).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it("handles mixed line endings", () => {
    const content =
      "WEBVTT\r\n\r\n00:00:01.000 --> 00:00:03.000\r\nHello\n\n00:00:04.000 --> 00:00:06.000\nWorld";
    const result = parseVTT(content);
    expect(result.cues).toHaveLength(2);
  });

  it("handles multi-line cue text", () => {
    const block =
      "00:00:01.000 --> 00:00:03.000\nLine one\nLine two\nLine three";
    const result = parseVTT(makeVTT([block]));
    expect(result.cues[0]?.text).toBe("Line one\nLine two\nLine three");
  });
});

// ---------------------------------------------------------------------------
// Cue settings
// ---------------------------------------------------------------------------

describe("cue settings", () => {
  it("strips cue settings and does not corrupt timestamps", () => {
    const block = "00:00:01.000 --> 00:00:03.000 align:center";
    const result = parseVTT(makeVTT([block + "\nText"]));
    expect(result.cues[0]?.startTime).toBe(1000);
    expect(result.cues[0]?.endTime).toBe(3000);
  });

  it("handles multiple cue settings", () => {
    const block =
      "00:00:01.000 --> 00:00:03.000 align:center position:50% line:84%\nText";
    const result = parseVTT(makeVTT([block]));
    expect(result.cues[0]?.startTime).toBe(1000);
    expect(result.cues[0]?.endTime).toBe(3000);
    expect(result.cues[0]?.text).toBe("Text");
    expect(result.errors).toHaveLength(0);
  });

  it("parses cue text correctly when settings are present", () => {
    const block = "00:00:01.000 --> 00:00:03.000 size:80%\nHello settings";
    const result = parseVTT(makeVTT([block]));
    expect(result.cues[0]?.text).toBe("Hello settings");
  });
});

// ---------------------------------------------------------------------------
// Timestamp parsing
// ---------------------------------------------------------------------------

describe("timestamp parsing", () => {
  it("parses zero timestamp correctly", () => {
    const result = parseVTT(makeVTT(["00:00:00.000 --> 00:00:01.000\nText"]));
    expect(result.cues[0]?.startTime).toBe(0);
  });

  it("parses hours correctly", () => {
    const result = parseVTT(makeVTT(["01:00:00.000 --> 02:00:00.000\nText"]));
    expect(result.cues[0]?.startTime).toBe(3600000);
    expect(result.cues[0]?.endTime).toBe(7200000);
  });

  it("parses milliseconds correctly", () => {
    const result = parseVTT(makeVTT(["00:00:00.500 --> 00:00:00.750\nText"]));
    expect(result.cues[0]?.startTime).toBe(500);
    expect(result.cues[0]?.endTime).toBe(750);
  });

  it("accepts dot as millisecond separator", () => {
    const result = parseVTT(makeVTT(["00:00:01.000 --> 00:00:03.000\nText"]));
    expect(result.cues[0]?.startTime).toBe(1000);
    expect(result.cues[0]?.endTime).toBe(3000);
  });

  it("handles optional hours — mm:ss.mmm format", () => {
    const result = parseVTT(makeVTT(["00:01.000 --> 00:03.000\nText"]));
    expect(result.cues[0]?.startTime).toBe(1000);
    expect(result.cues[0]?.endTime).toBe(3000);
  });

  it("handles large hour values", () => {
    const result = parseVTT(makeVTT(["99:59:59.999 --> 99:59:59.999\nText"]));
    expect(result.errors[0]?.code).toBe("INVALID_TIME_RANGE");
  });

  it("handles timestamp with extra whitespace around -->", () => {
    const result = parseVTT(makeVTT(["00:00:01.000  -->  00:00:03.000\nText"]));
    expect(result.cues[0]?.startTime).toBe(1000);
    expect(result.cues[0]?.endTime).toBe(3000);
  });
});

// ---------------------------------------------------------------------------
// INVALID_FORMAT errors
// ---------------------------------------------------------------------------

describe("INVALID_FORMAT", () => {
  it("reports error for block with no timestamp line", () => {
    const result = parseVTT(makeVTT(["just some text without arrow"]));
    expect(result.errors[0]?.code).toBe("INVALID_FORMAT");
  });

  it("includes rawBlock in error", () => {
    const result = parseVTT(
      makeVTT(["no-timestamp-here\nnot-a-timestamp\nText"]),
    );
    expect(result.errors[0]?.rawBlock).toBeDefined();
  });

  it("error severity is 'error'", () => {
    const result = parseVTT(
      makeVTT(["no-timestamp-here\nnot-a-timestamp\nText"]),
    );
    expect(result.errors[0]?.severity).toBe("error");
  });
});

// ---------------------------------------------------------------------------
// INVALID_TIMESTAMP errors
// ---------------------------------------------------------------------------

describe("INVALID_TIMESTAMP", () => {
  it("reports error when --> is missing", () => {
    const result = parseVTT(makeVTT(["00:00:01.000 00:00:03.000\nText"]));
    expect(result.errors[0]?.code).toBe("INVALID_TIMESTAMP");
  });

  it("reports error when start timestamp is malformed", () => {
    const result = parseVTT(makeVTT(["XX:XX:XX.000 --> 00:00:03.000\nText"]));
    expect(result.errors[0]?.code).toBe("INVALID_TIMESTAMP");
  });

  it("reports error when end timestamp is malformed", () => {
    const result = parseVTT(makeVTT(["00:00:01.000 --> XX:XX:XX.000\nText"]));
    expect(result.errors[0]?.code).toBe("INVALID_TIMESTAMP");
  });

  it("error severity is 'error'", () => {
    const result = parseVTT(makeVTT(["00:00:01.000 00:00:03.000\nText"]));
    expect(result.errors[0]?.severity).toBe("error");
  });

  it("skips cue with invalid timestamp but continues parsing", () => {
    const result = parseVTT(
      makeVTT(["XX:XX:XX.000 --> 00:00:03.000\nBad", VALID_BLOCK_2]),
    );
    expect(result.cues).toHaveLength(1);
    expect(result.cues[0]?.text).toBe("Goodbye world");
  });
});

// ---------------------------------------------------------------------------
// INVALID_TIME_RANGE errors
// ---------------------------------------------------------------------------

describe("INVALID_TIME_RANGE", () => {
  it("reports error when start equals end time", () => {
    const result = parseVTT(makeVTT(["00:00:03.000 --> 00:00:03.000\nText"]));
    expect(result.errors[0]?.code).toBe("INVALID_TIME_RANGE");
  });

  it("reports error when start is after end time", () => {
    const result = parseVTT(makeVTT(["00:00:05.000 --> 00:00:03.000\nText"]));
    expect(result.errors[0]?.code).toBe("INVALID_TIME_RANGE");
  });

  it("error severity is 'error'", () => {
    const result = parseVTT(makeVTT(["00:00:05.000 --> 00:00:03.000\nText"]));
    expect(result.errors[0]?.severity).toBe("error");
  });

  it("skips the invalid cue but continues parsing", () => {
    const result = parseVTT(
      makeVTT(["00:00:05.000 --> 00:00:03.000\nText", VALID_BLOCK_2]),
    );
    expect(result.cues).toHaveLength(1);
    expect(result.cues[0]?.text).toBe("Goodbye world");
  });
});

// ---------------------------------------------------------------------------
// MISSING_TEXT errors
// ---------------------------------------------------------------------------

describe("MISSING_TEXT", () => {
  it("reports warning when text is empty", () => {
    const result = parseVTT(makeVTT(["00:00:01.000 --> 00:00:03.000\n"]));
    expect(result.errors[0]?.code).toBe("MISSING_TEXT");
  });

  it("warning severity is 'warning'", () => {
    const result = parseVTT(makeVTT(["00:00:01.000 --> 00:00:03.000\n"]));
    expect(result.errors[0]?.severity).toBe("warning");
  });

  it("skips empty text cue by default", () => {
    const result = parseVTT(makeVTT(["00:00:01.000 --> 00:00:03.000\n"]));
    expect(result.cues).toHaveLength(0);
  });

  it("includes empty text cue when allowEmptyText is true", () => {
    const result = parseVTT(makeVTT(["00:00:01.000 --> 00:00:03.000\n"]), {
      allowEmptyText: true,
    });
    expect(result.cues).toHaveLength(1);
    expect(result.cues[0]?.text).toBe("");
  });

  it("does not emit MISSING_TEXT error when allowEmptyText is true", () => {
    const result = parseVTT(makeVTT(["00:00:01.000 --> 00:00:03.000\n"]), {
      allowEmptyText: true,
    });
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// OUT_OF_ORDER errors
// ---------------------------------------------------------------------------

describe("OUT_OF_ORDER", () => {
  it("does not check order by default", () => {
    const result = parseVTT(
      makeVTT([
        "00:00:05.000 --> 00:00:07.000\nLate",
        "00:00:01.000 --> 00:00:03.000\nEarly",
      ]),
    );
    expect(result.errors.some((e) => e.code === "OUT_OF_ORDER")).toBe(false);
  });

  it("reports warning when cue starts before previous cue ends with validateOrder", () => {
    const result = parseVTT(
      makeVTT([
        "00:00:01.000 --> 00:00:05.000\nFirst",
        "00:00:03.000 --> 00:00:07.000\nOverlap",
      ]),
      { validateOrder: true },
    );
    expect(result.errors.some((e) => e.code === "OUT_OF_ORDER")).toBe(true);
  });

  it("warning severity is 'warning'", () => {
    const result = parseVTT(
      makeVTT([
        "00:00:01.000 --> 00:00:05.000\nFirst",
        "00:00:03.000 --> 00:00:07.000\nOverlap",
      ]),
      { validateOrder: true },
    );
    const err = result.errors.find((e) => e.code === "OUT_OF_ORDER");
    expect(err?.severity).toBe("warning");
  });

  it("still includes the out-of-order cue in results", () => {
    const result = parseVTT(
      makeVTT([
        "00:00:01.000 --> 00:00:05.000\nFirst",
        "00:00:03.000 --> 00:00:07.000\nOverlap",
      ]),
      { validateOrder: true },
    );
    expect(result.cues).toHaveLength(2);
  });

  it("does not warn for non-overlapping cues", () => {
    const result = parseVTT(
      makeVTT([VALID_BLOCK_1, VALID_BLOCK_2, VALID_BLOCK_3]),
      {
        validateOrder: true,
      },
    );
    expect(result.errors.some((e) => e.code === "OUT_OF_ORDER")).toBe(false);
  });

  it("does not warn when cue starts exactly when previous ends", () => {
    const result = parseVTT(
      makeVTT([
        "00:00:01.000 --> 00:00:03.000\nFirst",
        "00:00:03.000 --> 00:00:05.000\nSecond",
      ]),
      { validateOrder: true },
    );
    expect(result.errors.some((e) => e.code === "OUT_OF_ORDER")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// stopOnFirstError
// ---------------------------------------------------------------------------

describe("stopOnFirstError", () => {
  it("halts on first error and returns empty cues", () => {
    const result = parseVTT(
      makeVTT([
        "bad-block\nnot-a-timestamp\nText",
        VALID_BLOCK_1,
        VALID_BLOCK_2,
      ]),
      { stopOnFirstError: true },
    );
    expect(result.cues).toHaveLength(0);
  });

  it("returns errors collected up to the halt point", () => {
    const result = parseVTT(
      makeVTT(["bad-block\nnot-a-timestamp\nText", VALID_BLOCK_1]),
      { stopOnFirstError: true },
    );
    expect(result.errors).toHaveLength(1);
  });

  it("does not halt on errors when stopOnFirstError is false", () => {
    const result = parseVTT(
      makeVTT([
        "XX:XX:XX.000 --> 00:00:03.000\nBad",
        VALID_BLOCK_1,
        VALID_BLOCK_2,
      ]),
      { stopOnFirstError: false },
    );
    expect(result.cues).toHaveLength(2);
  });

  it("halts on INVALID_TIMESTAMP", () => {
    const result = parseVTT(
      makeVTT(["XX:XX:XX.000 --> 00:00:03.000\nBad", VALID_BLOCK_2]),
      { stopOnFirstError: true },
    );
    expect(result.cues).toHaveLength(0);
    expect(result.errors[0]?.code).toBe("INVALID_TIMESTAMP");
  });

  it("halts on INVALID_TIME_RANGE", () => {
    const result = parseVTT(
      makeVTT(["00:00:05.000 --> 00:00:01.000\nText", VALID_BLOCK_2]),
      { stopOnFirstError: true },
    );
    expect(result.cues).toHaveLength(0);
  });

  it("halts on MISSING_TEXT warning", () => {
    const result = parseVTT(
      makeVTT(["00:00:01.000 --> 00:00:03.000\n", VALID_BLOCK_2]),
      { stopOnFirstError: true },
    );
    expect(result.cues).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Multiple errors in one parse
// ---------------------------------------------------------------------------

describe("multiple errors", () => {
  it("collects errors from multiple bad blocks", () => {
    const result = parseVTT(
      makeVTT([
        "bad1\nnot-a-timestamp\nText",
        "bad2\nnot-a-timestamp\nText",
        "bad3\nnot-a-timestamp\nText",
      ]),
    );
    expect(result.errors).toHaveLength(3);
  });

  it("collects mixed error types", () => {
    const result = parseVTT(
      makeVTT([
        "00:00:05.000 --> 00:00:01.000\nBad range", // INVALID_TIME_RANGE
        "XX:XX:XX.000 --> 00:00:03.000\nBad timestamp", // INVALID_TIMESTAMP
        VALID_BLOCK_3,
      ]),
    );
    const codes = result.errors.map((e) => e.code);
    expect(codes).toContain("INVALID_TIMESTAMP");
    expect(codes).toContain("INVALID_TIME_RANGE");
    expect(result.cues).toHaveLength(1);
  });
});

describe("cue settings parsing", () => {
  it("parses align setting into settings object", () => {
    const result = parseVTT(makeVTT(["00:00:01.000 --> 00:00:03.000 align:center\nText"]));
    expect(result.cues[0]?.settings?.align).toBe("center");
  });

  it("parses multiple settings into settings object", () => {
    const result = parseVTT(makeVTT(["00:00:01.000 --> 00:00:03.000 align:start position:50% size:80%\nText"]));
    expect(result.cues[0]?.settings?.align).toBe("start");
    expect(result.cues[0]?.settings?.position).toBe("50%");
    expect(result.cues[0]?.settings?.size).toBe("80%");
  });

  it("settings is undefined when no settings are present", () => {
    const result = parseVTT(makeVTT([VALID_BLOCK_1]));
    expect(result.cues[0]?.settings).toBeUndefined();
  });

  it("ignores unknown setting keys", () => {
    const result = parseVTT(makeVTT(["00:00:01.000 --> 00:00:03.000 unknown:value\nText"]));
    expect(result.cues[0]?.settings).toEqual({});
  });

  it("ignores invalid align values", () => {
    const result = parseVTT(makeVTT(["00:00:01.000 --> 00:00:03.000 align:invalid\nText"]));
    expect(result.cues[0]?.settings?.align).toBeUndefined();
  });

  it("parses vertical setting", () => {
    const result = parseVTT(makeVTT(["00:00:01.000 --> 00:00:03.000 vertical:rl\nText"]));
    expect(result.cues[0]?.settings?.vertical).toBe("rl");
  });
});

describe("stripTags option", () => {
  it("strips bold tags when stripTags is true", () => {
    const result = parseVTT(makeVTT(["00:00:01.000 --> 00:00:03.000\n<b>Hello</b>"]), { stripTags: true });
    expect(result.cues[0]?.text).toBe("Hello");
  });

  it("strips voice spans when stripTags is true", () => {
    const result = parseVTT(makeVTT(["00:00:01.000 --> 00:00:03.000\n<v Speaker>Hello</v>"]), { stripTags: true });
    expect(result.cues[0]?.text).toBe("Hello");
  });

  it("strips timestamp tags when stripTags is true", () => {
    const result = parseVTT(makeVTT(["00:00:01.000 --> 00:00:03.000\n<00:01.500>Hello"]), { stripTags: true });
    expect(result.cues[0]?.text).toBe("Hello");
  });

  it("preserves tags when stripTags is false", () => {
    const result = parseVTT(makeVTT(["00:00:01.000 --> 00:00:03.000\n<b>Hello</b>"]), { stripTags: false });
    expect(result.cues[0]?.text).toBe("<b>Hello</b>");
  });

  it("preserves tags by default", () => {
    const result = parseVTT(makeVTT(["00:00:01.000 --> 00:00:03.000\n<b>Hello</b>"]));
    expect(result.cues[0]?.text).toBe("<b>Hello</b>");
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("edge cases", () => {
  it("handles a single valid cue with trailing newlines", () => {
    const result = parseVTT(`${makeVTT([VALID_BLOCK_1])}\n\n\n`);
    expect(result.cues).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it("trims leading and trailing whitespace from cue text", () => {
    const result = parseVTT(
      makeVTT(["00:00:01.000 --> 00:00:03.000\n  Hello  "]),
    );
    expect(result.cues[0]?.text).toBe("Hello");
  });

  it("handles cue text with special characters", () => {
    const result = parseVTT(
      makeVTT(['00:00:01.000 --> 00:00:03.000\n<i>Hello</i> & "world"']),
    );
    expect(result.cues[0]?.text).toBe('<i>Hello</i> & "world"');
  });

  it("handles unicode text", () => {
    const result = parseVTT(
      makeVTT(["00:00:01.000 --> 00:00:03.000\n日本語字幕"]),
    );
    expect(result.cues[0]?.text).toBe("日本語字幕");
  });

  it("handles a very large number of cues", () => {
    const blocks = Array.from({ length: 1000 }, (_, i) => {
      const start = i * 2;
      const end = start + 1;
      const fmt = (s: number) => `00:00:${String(s % 60).padStart(2, "0")}.000`;
      return `${fmt(start)} --> ${fmt(end)}\nLine ${i + 1}`;
    });
    const result = parseVTT(makeVTT(blocks));
    expect(result.cues).toHaveLength(1000);
    expect(result.errors).toHaveLength(0);
  });

  it("each generated cue ID is unique when no IDs are provided", () => {
    const result = parseVTT(
      makeVTT([VALID_BLOCK_1, VALID_BLOCK_2, VALID_BLOCK_3]),
    );
    const ids = result.cues.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(3);
  });
});
