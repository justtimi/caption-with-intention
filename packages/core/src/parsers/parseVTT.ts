import type { ParseError } from "../types/ParseError.js";
import type { ParserOptions } from "../types/ParserOptions.js";
import { parseTimestamp } from "../utils/parseTimestamp.js";
import type { ParseResult } from "../types/ParseResult.js";

type RawVTTCue = {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  rawSettings?: string | undefined;
};

export function parseVTT(
  content: string,
  options: ParserOptions = {},
): ParseResult {
  if (typeof content !== "string") {
    throw new TypeError(`parseVTT: expected string, got ${typeof content}`);
  }
  const {
    stopOnFirstError = false,
    allowEmptyText = false,
    validateOrder = false,
  } = options;
  const normalised = content.replace(/^\uFEFF/, "").trim();

  if (!normalised) {
    return { cues: [], errors: [] };
  }

  const cues: RawVTTCue[] = [];
  const errors: ParseError[] = [];

  const firstNonEmptyLine = normalised
    .split(/\r?\n/)
    .find((l) => l.trim() !== "");

  if (!firstNonEmptyLine?.startsWith("WEBVTT")) {
    return {
      cues: [],
      errors: [
        {
          code: "INVALID_FORMAT",
          message: "Invalid WebVTT header",
          severity: "fatal",
          line: 0,
        },
      ],
    };
  }

  const blocks = normalised.trim().split(/\r?\n\r?\n/);

  let currentLine = 0;
  const blockStartLines: number[] = blocks.map((block) => {
    const start = currentLine;
    currentLine += block.split(/\r?\n/).length + 1;
    return start;
  });

  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
    const block = blocks[blockIndex];
    if (block === undefined) continue;
    const blockStartLine = blockStartLines[blockIndex] ?? 0;

    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;
    if (trimmedBlock.startsWith("WEBVTT")) continue;
    if (trimmedBlock.startsWith("NOTE")) continue;
    if (trimmedBlock.startsWith("STYLE")) continue;
    if (trimmedBlock.startsWith("REGION")) continue;

    const blockLines = trimmedBlock.split(/\r?\n/);

    let index = 0;
    let id: string | undefined;

    const firstLine = blockLines[0] ?? "";
    const firstLineIsCueId =
      firstLine.trim() !== "" && !firstLine.includes("-->");

    if (firstLineIsCueId) {
      id = firstLine.trim();
      index++;
    }

    const timestampLine = blockLines[index];

    if (!timestampLine) {
      errors.push({
        code: "INVALID_FORMAT",
        message: id
          ? `Incomplete cue block: found ID "${id}" but no timestamp line`
          : "Missing timestamp line",
        line: blockStartLine + index,
        rawBlock: trimmedBlock,
        severity: "error",
      });
      if (stopOnFirstError) {
        return { cues: [], errors };
      }
      continue;
    }

    const [startRaw, rightSide] = timestampLine
      .split("-->")
      .map((s) => s.trim());

    if (!startRaw || !rightSide) {
      errors.push({
        code: "INVALID_TIMESTAMP",
        message: "Missing or malformed timestamp",
        cueId: id,
        line: blockStartLine + index,
        rawBlock: trimmedBlock,
        severity: "error",
      });
      if (stopOnFirstError) {
        return { cues: [], errors };
      }
      continue;
    }

    const [endRaw, ...settingsParts] = rightSide.split(/\s+/);
    const rawSettings =
      settingsParts.length > 0 ? settingsParts.join(" ") : undefined;

    if (!endRaw) {
      errors.push({
        code: "INVALID_TIMESTAMP",
        message: "Missing end timestamp",
        cueId: id,
        line: blockStartLine + index,
        rawBlock: trimmedBlock,
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
        cueId: id,
        line: blockStartLine + index,
        rawBlock: trimmedBlock,
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
        cueId: id,
        line: blockStartLine + index,
        rawBlock: trimmedBlock,
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
          message: `Cue ${id} starts before previous cue ends`,
          cueId: id,
          line: blockStartLine + index,
          rawBlock: trimmedBlock,
          severity: "warning",
        });

        if (stopOnFirstError) {
          return { cues: [], errors };
        }
      }
    }

    const text = blockLines
      .slice(index + 1)
      .join("\n")
      .trim();

    if (!text && !allowEmptyText) {
      errors.push({
        code: "MISSING_TEXT",
        message: "Caption text is empty",
        cueId: id,
        line: blockStartLine + index,
        rawBlock: trimmedBlock,
        severity: "warning",
      });
      if (stopOnFirstError) {
        return { cues: [], errors };
      }
      continue;
    }

    cues.push({
      id: id ?? `cue-${blockIndex}`,
      startTime,
      endTime,
      text,
      rawSettings,
    });
  }

  return {
    cues: cues.map(({ id, startTime, endTime, text, rawSettings }) => ({
      id,
      startTime,
      endTime,
      text,
      ...(rawSettings !== undefined && { rawSettings }),
    })),
    errors,
  };
}
