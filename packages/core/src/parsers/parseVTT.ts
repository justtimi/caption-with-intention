import type { ParseError } from "../types/ParseError.js";
import type { ParserOptions } from "../types/ParserOptions.js";
import { parseTimestamp } from "../utils/parseTimestamp.js";
import type { ParseResult } from "../types/ParseResult.js";
import { stripVTTTags } from "../utils/stripVTTTags.js";
import { parseVTTCueSettings } from "../utils/parseVTTCueSettings.js";
import type { CaptionCue } from "../types/CaptionCue.js";

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
    stripTags = false,
  } = options;

  const normalised = content.replace(/^\uFEFF/, "").trim();

  if (!normalised) {
    return { cues: [], errors: [] };
  }

  const errors: ParseError[] = [];

  const haltIfNeeded = (): ParseResult | null =>
    stopOnFirstError ? { cues: [], errors } : null;

  const firstNonEmptyLine = normalised
    .split(/\r?\n/)
    .find((l) => l.trim() !== "");

  if (!firstNonEmptyLine || !/^WEBVTT(\s|$)/.test(firstNonEmptyLine)) {
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

  const blocks = normalised.split(/\r?\n\s*\r?\n/);

  let currentLine = 0;
  const blockStartLines: number[] = blocks.map((block) => {
    const start = currentLine;
    currentLine += block.split(/\r?\n/).length + 1;
    return start;
  });

  let tempArray: { cue: CaptionCue; blockIndex: number }[] = [];

  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
    const block = blocks[blockIndex];
    if (block === undefined) continue;
    const blockStartLine = blockStartLines[blockIndex] ?? 0;

    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;
    if (
      trimmedBlock === "WEBVTT" ||
      trimmedBlock.startsWith("WEBVTT ") ||
      trimmedBlock.startsWith("WEBVTT\n")
    )
      continue;
    if (
      trimmedBlock === "NOTE" ||
      trimmedBlock.startsWith("NOTE ") ||
      trimmedBlock.startsWith("NOTE\n")
    )
      continue;
    if (
      trimmedBlock === "STYLE" ||
      trimmedBlock.startsWith("STYLE ") ||
      trimmedBlock.startsWith("STYLE\n")
    )
      continue;
    if (
      trimmedBlock === "REGION" ||
      trimmedBlock.startsWith("REGION ") ||
      trimmedBlock.startsWith("REGION\n")
    )
      continue;

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
      const halted = haltIfNeeded();
      if (halted) return halted;
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
      const halted = haltIfNeeded();
      if (halted) return halted;
      continue;
    }

    const [endRaw, ...settingsParts] = rightSide.split(/\s+/);

    if (!endRaw) {
      errors.push({
        code: "INVALID_TIMESTAMP",
        message: "Missing end timestamp",
        cueId: id,
        line: blockStartLine + index,
        rawBlock: trimmedBlock,
        severity: "error",
      });
      const halted = haltIfNeeded();
      if (halted) return halted;
      continue;
    }

    const settings =
      settingsParts.length > 0
        ? parseVTTCueSettings(settingsParts.join(" "))
        : undefined;

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
      const halted = haltIfNeeded();
      if (halted) return halted;
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
      const halted = haltIfNeeded();
      if (halted) return halted;
      continue;
    }

    const rawText = blockLines
      .slice(index + 1)
      .join("\n")
      .trim();

    const text = stripTags ? stripVTTTags(rawText) : rawText;

    if (!text && !allowEmptyText) {
      errors.push({
        code: "MISSING_TEXT",
        message: "Caption text is empty",
        cueId: id,
        line: blockStartLine + index,
        rawBlock: trimmedBlock,
        severity: "warning",
      });
      const halted = haltIfNeeded();
      if (halted) return halted;
      continue;
    }

    tempArray.push({
      cue: {
        id: id ?? `cue-${blockIndex}`,
        startTime,
        endTime,
        text,
        ...(settings !== undefined && { settings }),
      },
      blockIndex,
    });
  }

  tempArray.sort((a, b) => {
    const diff = a.cue.startTime - b.cue.startTime;

    if (diff !== 0) return diff;
    return a.blockIndex - b.blockIndex;
  });

  if (validateOrder && tempArray.length > 0) {
    for (let i = 0; i < tempArray.length; i++) {
      const currentCue = tempArray[i];
      if (currentCue === undefined) continue;
      const prevCue = tempArray[i - 1];
      const trimmedBlock = blocks[currentCue.blockIndex];
      const blockStartLine = blockStartLines[currentCue.blockIndex] ?? 0;
      const id = currentCue.cue.id;

      if (
        prevCue !== undefined &&
        currentCue.cue.startTime < prevCue.cue.endTime
      ) {
        errors.push({
          code: "OUT_OF_ORDER",
          message: `Cue ${id} starts before previous cue ends`,
          cueId: id,
          line: blockStartLine,
          rawBlock: trimmedBlock,
          severity: "warning",
        });

        if (stopOnFirstError) return { cues: [], errors };
      }
    }
  }

  const result = tempArray.map((temp) => temp.cue);

  return { cues: result, errors };
}
