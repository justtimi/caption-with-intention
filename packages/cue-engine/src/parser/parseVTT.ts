import type { ParseError } from "../types/ParseError.js";

type RawVTTCue = {
  id?: string;
  start: string;
  end: string;
  text: string;
  settings?: string;
};

export function parseVTT(content: string) {
  const cues: RawVTTCue[] = [];
  const errors: ParseError[] = [];

  const allLines = content.split(/\r?\n/);

  const firstNonEmptyLine = allLines.find((l) => l.trim() !== "");

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

  const blocks = content.trim().split(/\r?\n\r?\n/);

  for (const block of blocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;
    if (trimmedBlock.startsWith("WEBVTT")) continue;
    if (trimmedBlock.startsWith("NOTE")) continue;
    if (trimmedBlock.startsWith("STYLE")) continue;

    const blockLines = trimmedBlock.split(/\r?\n/);

    let index = 0;
    let id: string | undefined;

    if (!blockLines[0]?.includes("-->")) {
      id = blockLines[0];
      index++;
    }
  }

  return { cues, errors };
}
