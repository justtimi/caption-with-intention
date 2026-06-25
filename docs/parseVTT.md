# `parseVTT`

Parses a WebVTT subtitle file into a structured list of cues and a list of parse errors. The parser is fault-tolerant by default — it collects errors and continues rather than throwing on malformed input.

---

## Table of Contents

- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [`parseVTT`](#parsevtt-1)
  - [`ParserOptions`](#parseroptions)
  - [`ParseResult`](#parseresult)
  - [`CaptionCue`](#captioncue)
  - [`VTTCueSettings`](#vttcuesettings)
  - [`ParseError`](#parseerror)
  - [`ParseErrorCode`](#parseerrorcode)
- [Utilities](#utilities)
  - [`stripVTTTags`](#stripvtttags)
  - [`parseVTTCueSettings`](#parsevttcuesettings)
- [Error Handling](#error-handling)
- [Spec Compliance](#spec-compliance)
- [Contributor Notes](#contributor-notes)

---

## Quick Start

```ts
import { parseVTT } from "@cue-engine/core";

const result = parseVTT(content);

if (result.errors.length > 0) {
  console.warn("Parse errors:", result.errors);
}

for (const cue of result.cues) {
  console.log(cue.startTime, cue.endTime, cue.text);
}
```

With options:

```ts
const result = parseVTT(content, {
  stripTags: true,
  validateOrder: true,
  stopOnFirstError: false,
});
```

---

## API Reference

### `parseVTT`

```ts
function parseVTT(content: string, options?: ParserOptions): ParseResult;
```

Parses a WebVTT string into cues and errors.

**Parameters**

| Parameter | Type            | Required | Description                 |
| --------- | --------------- | -------- | --------------------------- |
| `content` | `string`        | Yes      | The raw WebVTT file content |
| `options` | `ParserOptions` | No       | Parser behaviour options    |

**Returns** [`ParseResult`](#parseresult)

**Throws** `TypeError` if `content` is not a string.

**Behaviour**

- Strips a leading UTF-8 BOM if present
- Returns `{ cues: [], errors: [] }` for empty or whitespace-only input
- Returns a fatal `INVALID_FORMAT` error if the `WEBVTT` header is missing
- Silently skips `NOTE`, `STYLE`, and `REGION` blocks
- Assigns a deterministic fallback ID (`cue-{blockIndex}`) to cues without an explicit ID
- Cue settings on the timestamp line are parsed into a structured [`VTTCueSettings`](#vttcuesettings) object

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
| `stripTags`        | `false` | Strip VTT inline markup from cue text before storing it                       |

---

### `ParseResult`

```ts
interface ParseResult {
  cues: CaptionCue[];
  errors: ParseError[];
}
```

Always returned, even on failure. A result with `errors` entries does not mean parsing failed entirely — check `errors[n].severity` to assess impact. A `fatal` severity means no cues were produced.

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

| Field       | Type             | Description                                                                               |
| ----------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `id`        | `string`         | The cue ID from the file, or `cue-{blockIndex}` if none was present                       |
| `startTime` | `number`         | Cue start time in integer milliseconds                                                    |
| `endTime`   | `number`         | Cue end time in integer milliseconds                                                      |
| `text`      | `string`         | Cue text, optionally stripped of inline tags depending on `stripTags`                     |
| `settings`  | `VTTCueSettings` | Parsed cue positioning settings. Absent if no settings were present on the timestamp line |

---

### `VTTCueSettings`

```ts
type VTTCueSettings = {
  vertical?: "rl" | "lr";
  line?: string;
  position?: string;
  size?: string;
  align?: "start" | "center" | "end" | "left" | "right";
};
```

Structured representation of the cue settings that appear after the end timestamp on a VTT timestamp line. For example:

```
00:00:01.000 --> 00:00:03.000 align:center position:50% size:80%
```

Produces:

```ts
{
  align: "center",
  position: "50%",
  size: "80%"
}
```

Unknown setting keys are silently ignored. Invalid values for `align` and `vertical` are silently ignored and the field is left absent.

`line`, `position`, and `size` are stored as raw strings because their values can include percentage signs, line numbers, and alignment keywords (`50%`, `84%`, `auto`). Validation and parsing of those values is the renderer's responsibility.

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
| `cueId`    | `string`         | The cue ID associated with the error, if one was identified                                 |
| `line`     | `number`         | File-relative line number where the error occurred                                          |
| `severity` | `string`         | Impact level — see below                                                                    |
| `rawBlock` | `string`         | The raw block text that caused the error, useful for debugging                              |

**Severity levels**

| Severity  | Meaning                                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| `fatal`   | Parsing cannot continue. No cues are returned. Currently only emitted for a missing or invalid `WEBVTT` header |
| `error`   | The affected cue was skipped. Other cues are unaffected                                                        |
| `warning` | The affected cue was skipped or included with a note. Does not indicate data loss in most cases                |

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

| Code                 | Severity           | Cause                                                                               |
| -------------------- | ------------------ | ----------------------------------------------------------------------------------- |
| `INVALID_FORMAT`     | `fatal` or `error` | Missing `WEBVTT` header, or a block is missing its timestamp line                   |
| `INVALID_TIMESTAMP`  | `error`            | Timestamp line is malformed, missing `-->`, or timestamp values could not be parsed |
| `INVALID_TIME_RANGE` | `error`            | Start time is equal to or greater than end time                                     |
| `MISSING_TEXT`       | `warning`          | Cue has no text content                                                             |
| `INVALID_CUE_ID`     | `warning`          | Cue ID is present but empty or whitespace-only                                      |
| `OUT_OF_ORDER`       | `warning`          | Cue starts before the previous cue ends. Only emitted when `validateOrder: true`    |

---

## Utilities

### `stripVTTTags`

```ts
function stripVTTTags(text: string): string;
```

Strips VTT inline markup from a string, returning plain text. Used internally by `parseVTT` when `stripTags: true` is set, but also exported for standalone use.

**Tags handled**

| Tag             | Example                                | Result                                     |
| --------------- | -------------------------------------- | ------------------------------------------ |
| Timestamp       | `<00:01.500>`                          | Removed entirely                           |
| Ruby annotation | `<ruby>text<rt>annotation</rt></ruby>` | `<rt>` content removed, outer tag stripped |
| Voice span      | `<v Speaker>text</v>`                  | Tag stripped, content kept                 |
| Class           | `<c.classname>text</c>`                | Tag stripped, content kept                 |
| Formatting      | `<b>`, `<i>`, `<u>`                    | Tag stripped, content kept                 |
| Lang            | `<lang en>text</lang>`                 | Tag stripped, content kept                 |

Collapses multiple consecutive spaces left behind by removed tags, and trims the result.

**Example**

```ts
import { stripVTTTags } from "@cue-engine/core";

stripVTTTags("<v John><b>Hello</b> world</v>");
// → "Hello world"

stripVTTTags("<00:01.500>Hello");
// → "Hello"

stripVTTTags("<ruby>東京<rt>とうきょう</rt></ruby>");
// → "東京"
```

---

### `parseVTTCueSettings`

> **Internal utility.** Not exported from the public API. Documented here for contributors.

```ts
function parseVTTCueSettings(raw: string): VTTCueSettings;
```

Parses the settings string extracted from a VTT timestamp line into a [`VTTCueSettings`](#vttcuesettings) object.

Called internally by `parseVTT` after the end timestamp is extracted. Splits on whitespace, then splits each token on the first colon to extract key-value pairs. Unknown keys and invalid values are silently ignored.

**Example**

```ts
parseVTTCueSettings("align:center position:50% size:80%");
// → { align: "center", position: "50%", size: "80%" }

parseVTTCueSettings("vertical:rl line:10%");
// → { vertical: "rl", line: "10%" }

parseVTTCueSettings("unknown:value");
// → {}
```

---

## Error Handling

The parser never throws on malformed input — all parse failures are returned as `ParseError` entries in `result.errors`. The only exception is passing a non-string as `content`, which throws a `TypeError` immediately.

**Recommended pattern for consumers:**

```ts
const result = parseVTT(content);

const fatal = result.errors.find((e) => e.severity === "fatal");
if (fatal) {
  // File is not a valid VTT file at all
  throw new Error(`VTT parse failed: ${fatal.message}`);
}

const warnings = result.errors.filter((e) => e.severity === "warning");
if (warnings.length > 0) {
  // Non-critical issues — log and continue
  console.warn(warnings);
}

// result.cues is safe to use
```

---

## Spec Compliance

The parser follows the [W3C WebVTT specification](https://www.w3.org/TR/webvtt1/) with the following notes:

- Both `hh:mm:ss.mmm` and `mm:ss.mmm` timestamp formats are supported
- `NOTE`, `STYLE`, and `REGION` blocks are recognised and silently skipped
- Cue IDs are optional — cues without IDs receive a deterministic fallback ID of `cue-{blockIndex}` where `blockIndex` is the zero-based index of the block in the file
- Cue settings are parsed into a structured object. Unknown keys are ignored rather than erroring
- Inline tags are preserved by default. Pass `stripTags: true` to strip them

---

## Contributor Notes

### File locations

| File                               | Purpose                                                        |
| ---------------------------------- | -------------------------------------------------------------- |
| `src/parsers/parseVTT.ts`          | Main parser function                                           |
| `src/utils/parseTimestamp.ts`      | Shared timestamp parser used by both `parseVTT` and `parseSRT` |
| `src/utils/parseVTTCueSettings.ts` | Cue settings parser — internal only                            |
| `src/utils/stripVTTTags.ts`        | VTT inline tag stripper — exported                             |
| `src/types/CaptionCue.ts`          | Output cue type                                                |
| `src/types/VTTCueSettings.ts`      | Cue settings type                                              |
| `src/types/ParseResult.ts`         | Parser return type                                             |
| `src/types/ParseError.ts`          | Error type and error code union                                |
| `src/types/ParserOptions.ts`       | Options type shared by both parsers                            |

### Block processing pipeline

For each block in the file, the parser runs these steps in order:

1. Skip empty blocks and non-cue blocks — exact matches or blocks starting with `WEBVTT`, `NOTE`, `STYLE`, or `REGION` followed by a space or newline
2. Detect and extract optional cue ID from the first line
3. Validate the timestamp line is present
4. Split timestamp line on `-->` and validate both sides exist
5. Extract end timestamp and settings parts
6. Validate end timestamp is present
7. Parse settings string into `VTTCueSettings`
8. Parse start and end timestamps into integer milliseconds
9. Validate start time is less than end time
10. Optionally validate cue order against the previous cue
11. Assemble cue text, optionally stripping inline tags
12. Validate cue text is non-empty
13. Push the completed cue to the output array

Any step that fails pushes an error and skips the current cue via `continue`, unless `stopOnFirstError` is set.

### Line number tracking

File-relative line numbers are computed before the main loop by mapping each block to its starting line in the file. Error `line` values are `blockStartLine + index` where `index` is the offset within the block (0 for the ID line, 1 for the timestamp line).

### Adding a new cue setting

To support a new VTT cue setting key, add a `case` to the `switch` in `parseVTTCueSettings.ts` and add the corresponding field to `VTTCueSettings` in `src/types/VTTCueSettings.ts`. If the value has a constrained set of valid values, add a validation array alongside `VALID_ALIGN_VALUES` and `VALID_VERTICAL_VALUES`.
