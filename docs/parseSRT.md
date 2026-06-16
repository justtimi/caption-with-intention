# parseSRT

Parses an SRT subtitle file into structured caption cues with optional error reporting.

---

## Overview

`parseSRT` converts raw `.srt` subtitle content into a structured format that can be used for synchronized video caption rendering. It also returns detailed parsing errors instead of failing silently.

This function is part of the `cue-engine` core parsing layer and is designed to be **framework-agnostic, deterministic, and fault-tolerant**.

---

## Import

```ts
import { parseSRT } from "@captions/cue-engine";
```

---

## Signature

```ts
parseSRT(
  content: string,
  options?: ParserOptions
): ParseResult
```

---

## Parameters

### `content: string`

Raw SRT file content as a string. Must be a string — passing any other type throws a `TypeError`.

UTF-8 BOM characters are stripped automatically before parsing.

Example:

```
1
00:00:01,000 --> 00:00:03,000
Hello world
```

---

### `options` (optional)

```ts
interface ParserOptions {
  stopOnFirstError?: boolean;
  allowEmptyText?: boolean;
  validateOrder?: boolean;
}
```

#### `stopOnFirstError`

- Default: `false`
- If `true`, parsing halts immediately on the first error and returns `{ cues: [], errors }` with only the errors collected up to that point.

---

#### `allowEmptyText`

- Default: `false`
- If `true`, cues with empty text are included in results rather than skipped with a `MISSING_TEXT` warning.

---

#### `validateOrder`

- Default: `false`
- If `true`, emits an `OUT_OF_ORDER` warning when a cue's start time begins before the previous cue's end time.

---

## Returns

```ts
interface ParseResult {
  cues: CaptionCue[];
  errors: ParseError[];
}
```

---

## CaptionCue

```ts
interface CaptionCue {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}
```

All timestamps are returned in **milliseconds**.

---

## ParseError

```ts
interface ParseError {
  code: ParseErrorCode;
  message: string;
  severity: "warning" | "error" | "fatal";
  cueId?: string;
  line?: number;
  rawBlock?: string;
}
```

---

## Error Codes

| Code               | Severity | Meaning                                         |
| ------------------ | -------- | ----------------------------------------------- |
| INVALID_FORMAT     | error    | Cue block is missing required lines             |
| INVALID_TIMESTAMP  | error    | Timestamp is missing, malformed, or unparseable |
| INVALID_TIME_RANGE | error    | Start time is greater than or equal to end time |
| MISSING_TEXT       | warning  | Caption text is empty                           |
| INVALID_CUE_ID     | warning  | Cue ID is not a valid sequence number           |
| OUT_OF_ORDER       | warning  | Cue starts before the previous cue ends         |

---

## Behavior

### Valid input

```ts
const result = parseSRT(file);
console.log(result.cues);
```

Returns parsed captions.

---

### Invalid input handling

Invalid cues do NOT break the entire parse operation. Instead:

- Valid cues are still returned
- Errors are collected in `errors[]`
- Each error includes a `severity` field — `"warning"` for recoverable issues, `"error"` for cues that must be skipped

---

### Example output

```ts
{
  cues: [
    {
      id: "1",
      startTime: 1000,
      endTime: 3000,
      text: "Hello world"
    }
  ],
  errors: []
}
```

---

## stopOnFirstError behavior

```ts
parseSRT(content, { stopOnFirstError: true });
```

When `stopOnFirstError` is `true`:

- Parsing halts immediately on the first error or warning
- Returns `{ cues: [], errors }` — no partial cue output
- Useful for strict validation pipelines where partial results are not acceptable

---

## Design Principles

- No runtime dependencies
- No DOM or UI coupling
- Deterministic output
- Fault-tolerant parsing — invalid cues are skipped and reported, not thrown
- Throws `TypeError` on programmer errors (non-string input)
- Designed for real-time caption rendering systems

---

## Notes

This parser is optimized for use in real-time video caption systems where:

- partial file corruption is expected
- playback must not fail due to bad subtitle data
- downstream rendering systems require clean cue streams
