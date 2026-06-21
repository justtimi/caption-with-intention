import type { ParseResult } from "../types/ParseResult.js";
import type { ParseError } from "../types/ParseError.js";
import type { ParserOptions } from "../types/ParserOptions.js";
import { parseTimestamp } from "../utils/parseTimestamp.js";
import type { CaptionCue } from "../types/CaptionCue.js";
import { stripSRTTags } from "../utils/stripSRTTags.js";

export function parseSRT(
  content: string,
  options: ParserOptions = {},
): ParseResult {
  if (typeof content !== "string") {
    throw new TypeError(`parseSRT: expected string, got ${typeof content}`);
  }

  const {
    stopOnFirstError = false,
    allowEmptyText = false,
    validateOrder = false,
    stripTags = false,
  } = options;

  const normalised = content.replace(/^\uFEFF/, "").trim();

  if (!normalised) {
    return { cues: [], errors: [] };
  }

  const blocks = normalised.split(/\r?\n\r?\n/);

  let currentLine = 0;
  const blockStartLines: number[] = blocks.map((block) => {
    const start = currentLine;
    currentLine += block.split(/\r?\n/).length + 1;
    return start;
  });

  const cues: CaptionCue[] = [];
  const errors: ParseError[] = [];

  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index];
    if (block === undefined) continue;
    const blockStartLine = blockStartLines[index] ?? 0;
    const lines = block.split(/\r?\n/);

    if (lines.length < 2 || !lines[0] || !lines[1]) {
      errors.push({
        code: "INVALID_FORMAT",
        message: "SRT block must contain id, timestamp, and text",
        line: blockStartLine,
        rawBlock: block,
        severity: "error",
      });

      if (stopOnFirstError) {
        return { cues: [], errors };
      }

      continue;
    }

    const cueId = lines[0].trim();

    if (!/^\d+$/.test(cueId)) {
      errors.push({
        code: "INVALID_CUE_ID",
        message: `Cue ID "${cueId}" is not a valid sequence number`,
        cueId,
        line: blockStartLine,
        rawBlock: block,
        severity: "warning",
      });

      if (stopOnFirstError) {
        return { cues: [], errors };
      }
    }

    const timestampLine = lines[1].trim();

    const [startRaw, endRaw] = timestampLine.split("-->").map((t) => t?.trim());

    if (!startRaw || !endRaw) {
      errors.push({
        code: "INVALID_TIMESTAMP",
        message: "Missing or malformed timestamp",
        cueId,
        line: blockStartLine + 1,
        rawBlock: block,
        severity: "error",
      });

      if (stopOnFirstError) {
        return { cues: [], errors };
      }
      continue;
    }

    let startTime: number;
    let endTime: number;

    try {
      startTime = parseTimestamp(startRaw);
      endTime = parseTimestamp(endRaw);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      errors.push({
        code: "INVALID_TIMESTAMP",
        message: `Invalid timestamp: ${reason}`,
        cueId,
        line: blockStartLine + 1,
        rawBlock: block,
        severity: "error",
      });

      if (stopOnFirstError) {
        return { cues: [], errors };
      }
      continue;
    }

    if (startTime >= endTime) {
      errors.push({
        code: "INVALID_TIME_RANGE",
        message: "Start time must be less than end time",
        cueId,
        line: blockStartLine + 1,
        rawBlock: block,
        severity: "error",
      });

      if (stopOnFirstError) {
        return { cues: [], errors };
      }
      continue;
    }

    if (validateOrder && cues.length > 0) {
      const lastCue = cues[cues.length - 1];
      if (lastCue !== undefined && startTime < lastCue.endTime) {
        errors.push({
          code: "OUT_OF_ORDER",
          message: `Cue ${cueId} starts before previous cue ends`,
          cueId,
          line: blockStartLine,
          rawBlock: block,
          severity: "warning",
        });

        if (stopOnFirstError) {
          return { cues: [], errors };
        }
      }
    }

    const rawText = lines.slice(2).join("\n").trim();
    const text = stripTags ? stripSRTTags(rawText) : rawText;

    if (!text && !allowEmptyText) {
      errors.push({
        code: "MISSING_TEXT",
        message: "Caption text is empty",
        cueId,
        line: blockStartLine,
        rawBlock: block,
        severity: "warning",
      });

      if (stopOnFirstError) {
        return { cues: [], errors };
      }
      continue;
    }

    cues.push({
      id: cueId,
      startTime,
      endTime,
      text,
    });
  }

  return {
    cues,
    errors,
  };
}
