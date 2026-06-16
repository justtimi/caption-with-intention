import type { ParseResult } from "../types/ParseResult.js";
import type { ParseError } from "../types/ParseError.js";
import type { ParserOptions } from "../types/ParserOptions.js";
import { parseTimestamp } from "../utils/parseTimestamp.js";

type CaptionCue = {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
};

export function parseSRT(
  content: string,
  options: ParserOptions = {},
): ParseResult {
  const { strict = false, allowEmptyText = false } = options;

  const blocks = content.trim().split(/\r?\n\r?\n/);

  const cues: CaptionCue[] = [];
  const errors: ParseError[] = [];

  let hasFatalError = false;

  function pushError(error: ParseError) {
    errors.push(error);
  }

  for (let index = 0; index < blocks.length; index++) {
  const block = blocks[index];
    const lines = block.split(/\r?\n/);
    const blockNumber = index + 1;

    if (lines.length < 3 || !lines[0] || !lines[1]) {
      pushError({
        code: "INVALID_FORMAT",
        message: "SRT block must contain id, timestamp, and text",
        blockLine: blockNumber,
        rawBlock: block,
        severity: "error",
      });

      if (strict) {
        hasFatalError = true;
        break;
      }

      return;
    }

    const cueId = lines[0].trim();
    const timestampLine = lines[1].trim();

    const [startRaw, endRaw] = timestampLine.split("-->").map((t) => t?.trim());

    if (!startRaw || !endRaw) {
      pushError({
        code: "INVALID_TIMESTAMP",
        message: "Missing or malformed timestamp",
        cueId,
        blockLine: blockNumber,
        rawBlock: block,
      });

      if (strict) {
        hasFatalError = true;
        break;
      }
      return;
    }

    let startTime: number;
    let endTime: number;

    try {
      startTime = parseTimestamp(startRaw);
      endTime = parseTimestamp(endRaw);
    } catch {
      pushError({
        code: "INVALID_TIMESTAMP",
        message: "Failed to parse timestamp",
        cueId,
        blockLine: blockNumber,
        rawBlock: block,
      });

      if (strict) return;
      return;
    }

    if (startTime >= endTime) {
      pushError({
        code: "INVALID_TIME_RANGE",
        message: "Start time must be less than end time",
        cueId,
        blockLine: blockNumber,
        rawBlock: block,
      });

      if (strict) return;
      return;
    }

    const text = lines.slice(2).join("\n").trim();

    if (!text && !allowEmptyText) {
      pushError({
        code: "MISSING_TEXT",
        message: "Caption text is empty",
        cueId,
        blockLine: blockNumber,
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
  if (hasFatalError) {
    return { cues, errors };
  }

  return {
    cues,
    errors,
  };
}
