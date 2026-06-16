# parseSRT

Parses an SRT subtitle file into structured caption cues with optional error reporting.

---

## Overview

`parseSRT` converts raw `.srt` subtitle content into a structured format that can be used for synchronized video caption rendering. It also returns detailed parsing errors instead of failing silently.

This function is part of the `cue-engine` core parsing layer and is designed to be **framework-agnostic, deterministic, and fault-tolerant**.

---

## Import

```ts
import { parseSRT } from "@cue-engine/core";
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

Raw SRT file content as a string.

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
  strict?: boolean;
  allowEmptyText?: boolean;
}
```

#### `strict`

* Default: `false`
* If `true`, parsing stops processing a cue immediately when an error is encountered in that cue.

---

#### `allowEmptyText`

* Default: `false`
* If `true`, allows cues with empty text to be included in results.

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
  cueId?: string;
  line?: number;
  rawBlock: string;
}
```

---

## Error Codes

| Code               | Meaning                                         |
| ------------------ | ----------------------------------------------- |
| INVALID_FORMAT     | Cue block structure is invalid                  |
| INVALID_TIMESTAMP  | Timestamp could not be parsed                   |
| MISSING_TEXT       | Caption text is missing                         |
| INVALID_TIME_RANGE | Start time is greater than or equal to end time |

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

* Valid cues are still returned
* Errors are collected in `errors[]`

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

## Strict mode behavior

```ts
parseSRT(content, { strict: true });
```

In strict mode:

* malformed cues are skipped more aggressively
* parsing is less tolerant of bad input

---

## Design Principles

* No runtime dependencies
* No DOM or UI coupling
* Deterministic output
* Fail-safe parsing (no thrown errors for bad input)
* Designed for real-time caption rendering systems

---

## Notes

This parser is optimized for use in real-time video caption systems where:

* partial file corruption is expected
* playback must not fail due to bad subtitle data
* downstream rendering systems require clean cue streams
