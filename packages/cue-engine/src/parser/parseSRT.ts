import type { CaptionCue } from "../types/CaptionCue.js";
import type { ParseResult } from "../types/ParseResult.js";
import type { ParseError } from "../types/ParseError.js";
import type { ParserOptions } from "../types/ParserOptions.js";
import { parseTimestamp } from "../utils/parseTimestamp.js";

export function parseSRT(
  content: string,
  options: ParserOptions = {},
): ParseResult {
  const { strict = false, allowEmptyText = false } = options;

  const blocks = content.trim().split(/\r?\n\r?\n/);

  const cues: CaptionCue[] = [];
  const errors: ParseError[] = [];

  blocks.forEach((block, index) => {
    const lines = block.split(/\r?\n/);
    const lineNumber = index + 1;

    if (lines.length < 3 || !lines[0] || !lines[1]) {
      errors.push({
        code: "INVALID_FORMAT",
        message: "SRT block must contain id, timestamp, and text",
        line: lineNumber,
        rawBlock: block,
      });

      if (strict) return;
      return;
    }

    const cueId = lines[0].trim();
    const timestampLine = lines[1].trim();

    const [startRaw, endRaw] = timestampLine.split("-->").map((t) => t?.trim());

    if (!startRaw || !endRaw) {
      errors.push({
        code: "INVALID_TIMESTAMP",
        message: "Missing or malformed timestamp",
        cueId,
        line: lineNumber,
        rawBlock: block,
      });

      if (strict) return;
      return;
    }

    let startTime: number;
    let endTime: number;

    try {
      startTime = parseTimestamp(startRaw);
      endTime = parseTimestamp(endRaw);
    } catch {
      errors.push({
        code: "INVALID_TIMESTAMP",
        message: "Failed to parse timestamp",
        cueId,
        line: lineNumber,
        rawBlock: block,
      });

      if (strict) return;
      return;
    }

    if (startTime >= endTime) {
      errors.push({
        code: "INVALID_TIME_RANGE",
        message: "Start time must be less than end time",
        cueId,
        line: lineNumber,
        rawBlock: block,
      });

      if (strict) return;
      return;
    }

    const text = lines.slice(2).join("\n").trim();

    if (!text && !allowEmptyText) {
      errors.push({
        code: "MISSING_TEXT",
        message: "Caption text is empty",
        cueId,
        line: lineNumber,
        rawBlock: block,
      });

      if (strict) return;
      return;
    }

    cues.push({
      id: cueId,
      startTime,
      endTime,
      text,
    });
  });

  return {
    cues,
    errors,
  };
}
