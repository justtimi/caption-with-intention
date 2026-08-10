# `parseSRT`

Parses an SRT subtitle file into a structured list of cues and a list of parse errors. The parser is fault-tolerant by default — it collects errors and continues rather than throwing on malformed input.

---

## Table of Contents

- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [`parseSRT`](#parsesrt-1)
  - [`ParserOptions`](#parseroptions)
  - [`ParseResult`](#parseresult)
  - [`CaptionCue`](#captioncue)
  - [`ParseError`](#parseerror)
  - [`ParseErrorCode`](#parseerrorcode)
- [Utilities](#utilities)
  - [`stripSRTTags`](#stripsrttags)
- [Error Handling](#error-handling)
- [Format Notes](#format-notes)
- [Contributor Notes](#contributor-notes)

---

## Quick Start

```ts
import { parseSRT } from "@cue-engine/core";

const result = parseSRT(content);

if (result.errors.length > 0) {
  console.warn("Parse errors:", result.errors);
}

for (const cue of result.cues) {
  console.log(cue.startTime, cue.endTime, cue.text);
}
```

With options:

```ts
const result = parseSRT(content, {
  stripTags: true,
  validateOrder: true,
  stopOnFirstError: false,
});
```

---

## API Reference

### `parseSRT`

```ts
function parseSRT(content: string, options?: ParserOptions): ParseResult;
```

Parses an SRT string into cues and errors.

**Parameters**

| Parameter | Type            | Required | Description              |
| --------- | --------------- | -------- | ------------------------ |
| `content` | `string`        | Yes      | The raw SRT file content |
| `options` | `ParserOptions` | No       | Parser behaviour options |

**Returns** [`ParseResult`](#parseresult)

**Throws** `TypeError` if `content` is not a string.

**Behaviour**

- Strips a leading UTF-8 BOM if present
- Returns `{ cues: [], errors: [] }` for empty or whitespace-only input
- Each block must contain a sequence number, a timestamp line, and text — missing any of these produces an error
- Sequence numbers that are not numeric integers produce an `INVALID_CUE_ID` warning but the cue is still parsed
- Cue IDs are preserved exactly as they appear in the file — no fallback ID is generated since SRT sequence numbers are mandatory

---

### `ParserOptions`

```ts
interface ParserOptions {
  stopOnFirstError?: boolean;
  allowEmptyText?: boolean;
  validateOrder?: boolean;
  stripTags?: boolean;
}
```

All options are optional and default to `false`.

| Option             | Default | Description                                                                   |
| ------------------ | ------- | ----------------------------------------------------------------------------- |
| `stopOnFirstError` | `false` | Halt parsing on the first error and return immediately with empty cues        |
| `allowEmptyText`   | `false` | Include cues with empty text in the output instead of skipping them           |
| `validateOrder`    | `false` | Emit an `OUT_OF_ORDER` warning when a cue starts before the previous cue ends |
| `stripTags`        | `false` | Strip HTML-like inline tags from cue text before storing it                   |

---

### `ParseResult`

```ts
interface ParseResult {
  cues: CaptionCue[];
  errors: ParseError[];
}
```

Always returned, even on failure. A result with `errors` entries does not mean parsing failed entirely — check `errors[n].severity` to assess impact.

---

### `CaptionCue`

```ts
type CaptionCue = {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  settings?: VTTCueSettings;
};
```

| Field       | Type             | Description                                                           |
| ----------- | ---------------- | --------------------------------------------------------------------- |
| `id`        | `string`         | The sequence number from the SRT block, preserved as a string         |
| `startTime` | `number`         | Cue start time in integer milliseconds                                |
| `endTime`   | `number`         | Cue end time in integer milliseconds                                  |
| `text`      | `string`         | Cue text, optionally stripped of inline tags depending on `stripTags` |
| `settings`  | `VTTCueSettings` | Always absent for SRT cues — SRT has no cue settings syntax           |

---

### `ParseError`

```ts
interface ParseError {
  code: ParseErrorCode;
  message: string;
  cueId?: string;
  line?: number;
  severity: "warning" | "error" | "fatal";
  rawBlock?: string;
}
```

| Field      | Type             | Description                                                                                 |
| ---------- | ---------------- | ------------------------------------------------------------------------------------------- |
| `code`     | `ParseErrorCode` | Machine-readable error code                                                                 |
| `message`  | `string`         | Human-readable description including relevant context such as the raw timestamp that failed |
| `cueId`    | `string`         | The sequence number associated with the error, if one was identified                        |
| `line`     | `number`         | File-relative line number where the error occurred                                          |
| `severity` | `string`         | Impact level — see below                                                                    |
| `rawBlock` | `string`         | The raw block text that caused the error, useful for debugging                              |

**Severity levels**

| Severity  | Meaning                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------- |
| `fatal`   | Not currently emitted by `parseSRT` — SRT has no equivalent of the VTT header requirement       |
| `error`   | The affected cue was skipped. Other cues are unaffected                                         |
| `warning` | The affected cue was skipped or included with a note. Does not indicate data loss in most cases |

---

### `ParseErrorCode`

```ts
type ParseErrorCode =
  | "INVALID_FORMAT"
  | "INVALID_TIMESTAMP"
  | "MISSING_TEXT"
  | "INVALID_TIME_RANGE"
  | "INVALID_CUE_ID"
  | "OUT_OF_ORDER";
```

| Code                 | Severity  | Cause                                                                                       |
| -------------------- | --------- | ------------------------------------------------------------------------------------------- |
| `INVALID_FORMAT`     | `error`   | Block is missing required lines — must have at least a sequence number and a timestamp line |
| `INVALID_TIMESTAMP`  | `error`   | Timestamp line is malformed, missing `-->`, or timestamp values could not be parsed         |
| `INVALID_TIME_RANGE` | `error`   | Start time is equal to or greater than end time                                             |
| `MISSING_TEXT`       | `warning` | Cue has no text content                                                                     |
| `INVALID_CUE_ID`     | `warning` | Sequence number is not a valid integer. The cue is still parsed                             |
| `OUT_OF_ORDER`       | `warning` | Cue starts before the previous cue ends. Only emitted when `validateOrder: true`            |

---

## Utilities

### `stripSRTTags`

```ts
function stripSRTTags(text: string): string;
```

Strips HTML-like inline tags from SRT cue text, returning plain text. Used internally by `parseSRT` when `stripTags: true` is set, but also exported for standalone use.

SRT has no formal inline tag specification, but HTML-like tags appear widely in real-world files — most commonly `<i>`, `<b>`, `<u>`, and `<font color="...">`.

The stripper removes all content between `<` and `>`, collapses multiple consecutive spaces left behind by removed tags, and trims the result.

**Example**

```ts
import { stripSRTTags } from "@cue-engine/core";

stripSRTTags("<i>Hello</i> world");
// → "Hello world"

stripSRTTags('<font color="red">Warning</font>');
// → "Warning"

stripSRTTags("<b>Bold</b> and <i>italic</i>");
// → "Bold and italic"
```

Note that `stripSRTTags` is a general HTML tag stripper. It does not understand VTT-specific markup such as timestamp tags or voice spans — use [`stripVTTTags`](./parseVTT.md#stripvtttags) for VTT content.

---

## Error Handling

The parser never throws on malformed input — all parse failures are returned as `ParseError` entries in `result.errors`. The only exception is passing a non-string as `content`, which throws a `TypeError` immediately.

**Recommended pattern for consumers:**

```ts
const result = parseSRT(content);

const errors = result.errors.filter((e) => e.severity === "error");
if (errors.length > 0) {
  // Some cues were skipped — decide whether to proceed
  console.warn("Skipped cues:", errors);
}

const warnings = result.errors.filter((e) => e.severity === "warning");
if (warnings.length > 0) {
  // Non-critical issues — log and continue
  console.warn(warnings);
}

// result.cues is safe to use
```

---

## Format Notes

SRT is a simpler format than VTT with fewer official features. Key differences that affect parser behaviour:

- **No header** — SRT files have no required header line. The first block is expected to start with a sequence number
- **No cue settings** — SRT timestamps do not support positioning settings. The `settings` field on `CaptionCue` is never populated by `parseSRT`
- **Comma as millisecond separator** — SRT timestamps use a comma (`00:00:01,000`) while VTT uses a dot. Both separators are accepted by `parseTimestamp`
- **Mandatory sequence numbers** — every block must start with a sequence number. Non-numeric IDs produce an `INVALID_CUE_ID` warning but do not prevent the cue from being parsed
- **No special block types** — SRT has no equivalent of VTT's `NOTE`, `STYLE`, or `REGION` blocks

---

## Contributor Notes

### File locations

| File                          | Purpose                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `src/parsers/parseSRT.ts`     | Main parser function                                           |
| `src/utils/parseTimestamp.ts` | Shared timestamp parser used by both `parseSRT` and `parseVTT` |
| `src/utils/stripSRTTags.ts`   | SRT inline tag stripper — exported                             |
| `src/types/CaptionCue.ts`     | Output cue type                                                |
| `src/types/ParseResult.ts`    | Parser return type                                             |
| `src/types/ParseError.ts`     | Error type and error code union                                |
| `src/types/ParserOptions.ts`  | Options type shared by both parsers                            |

### Block processing pipeline

For each block in the file, the parser runs these steps in order:

1. Validate the block has at least two lines — a sequence number and a timestamp line
2. Extract and validate the sequence number. Emit `INVALID_CUE_ID` warning if not numeric, but continue
3. Extract the timestamp line and split on `-->`
4. Validate both start and end timestamp strings are present
5. Parse start and end timestamps into integer milliseconds
6. Validate start time is less than end time
7. Assemble cue text from remaining lines, optionally stripping inline tags
8. Validate cue text is non-empty
9. Push the completed cue and the blockIndex to the output array

Any step from 4 onward that fails pushes an error and skips the current cue via `continue`, unless `stopOnFirstError` is set.

### Sorting and order validation

In order for the timeline controller to implement the cue data received correctly, the ouput from the parser has to be sorted. In the post sorting, cues are sorted by `startTime` in ascending order, with the Schwartzian transform, with the `blockIndex` as the tie-breaker.

As a result of this, the report gotten from `validateOrder` is now wrong, because now the cues are in chronological order and the check in the loop works in file order, which is meaningless after sorting, so the check only makes sense as a post-sort pass.
So we shift the validation check from inside the loop to after the sorting.
Then we return the completed cues array and errors, if any, in an object.

### Line number tracking

File-relative line numbers are computed before the main loop by mapping each block to its starting line in the file. Block-level errors use `blockStartLine`. Timestamp errors use `blockStartLine + 1` since the timestamp is always on the second line of a valid SRT block.

### `haltIfNeeded` helper

Both `parseSRT` and `parseVTT` use a shared internal pattern for `stopOnFirstError` handling:

```ts
const haltIfNeeded = (): ParseResult | null =>
  stopOnFirstError ? { cues: [], errors } : null;
```

Called after every `errors.push()`. If it returns a value, the parser returns immediately. This avoids repeating the `if (stopOnFirstError) return` pattern at every error site.
