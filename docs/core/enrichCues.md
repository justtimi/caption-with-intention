# `enrichCues`

Transforms parsed `CaptionCue[]` output into `EnrichedCue[]`, cues augmented with word-level tokenization and a placeholder intent state. This is the first step of the offline preparation pipeline, run once after parsing and before the timeline controller consumes the cues.

---

## Table of Contents

- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [`enrichCues`](#enrichcues-1)
  - [`EnrichedCue`](#enrichedcue)
  - [`WordToken`](#wordtoken)
  - [`IntentState`](#intentstate)
- [Utilities](#utilities)
  - [`presplit`](#presplit)
- [Design Notes](#design-notes)
- [Contributor Notes](#contributor-notes)

---

## Quick Start

```ts
import { parseVTT, enrichCues } from "@cue-engine/core";

const { cues } = parseVTT(content);
const enriched = enrichCues(cues);

for (const cue of enriched) {
  console.log(cue.words, cue.intent);
}
```

---

## API Reference

### `enrichCues`

```ts
function enrichCues(cues: CaptionCue[]): EnrichedCue[];
```

Converts each `CaptionCue` into an `EnrichedCue` by tokenizing its text into words and attaching a default, neutral intent state.

**Parameters**

| Parameter | Type           | Required | Description             |
| --------- | -------------- | -------- | ----------------------- |
| `cues`    | `CaptionCue[]` | Yes      | Parser output to enrich |

**Returns** `EnrichedCue[]`, one enriched cue per input cue, in the same order.

**Behaviour**

- Calls [`presplit`](#presplit) on each cue's `text` to produce `words`
- Attaches a fixed default `intent` object to every cue: `{ intensity: "normal", pace: "normal", confidence: 0, source: "default" }`
- Spreads all original `CaptionCue` fields (`id`, `startTime`, `endTime`, `text`, `settings`) onto the result unchanged
- Does not mutate the input array or its cues

**Note:** the intent produced here is a placeholder, not an analysis result. `confidence: 0` and `source: "default"` both signal that no inference has been run yet. Once the intent engine ships, `enrichCues` will call it in place of the fixed default object.

---

### `EnrichedCue`

```ts
type EnrichedCue = CaptionCue & {
  words: WordToken[];
  intent: IntentState;
  speakerId?: string;
};
```

`EnrichedCue` is defined as an intersection with `CaptionCue` rather than a standalone type, since it is conceptually a `CaptionCue` with additional fields layered on. This means every field on `CaptionCue`, including `settings`, is available on `EnrichedCue` automatically, without being redeclared.

| Field       | Type          | Description                                                        |
| ----------- | ------------- | ------------------------------------------------------------------ |
| `words`     | `WordToken[]` | Word-level tokenization of `text`, produced by `presplit`          |
| `intent`    | `IntentState` | Current intent state for the cue, placeholder until Week 3         |
| `speakerId` | `string`      | Optional. Not populated by `enrichCues` yet, reserved for phase 2+ |

---

### `WordToken`

```ts
type WordToken = {
  word: string;
  startTime?: number;
};
```

| Field       | Type     | Description                                                             |
| ----------- | -------- | ----------------------------------------------------------------------- |
| `word`      | `string` | A single word from the cue's text, punctuation attached                 |
| `startTime` | `number` | Optional. Not populated by `enrichCues`, reserved for word-level timing |

---

### `IntentState`

```ts
type IntentState = {
  intensity: "whisper" | "normal" | "loud" | "emphasis";
  pace: "slow" | "normal" | "fast";
  confidence: number;
  source: "manual" | "text" | "audio" | "ml" | "corrected" | "default";
};
```

| Field        | Type     | Description                                                               |
| ------------ | -------- | ------------------------------------------------------------------------- |
| `intensity`  | `string` | Expressive loudness/emphasis level                                        |
| `pace`       | `string` | Expressive speed                                                          |
| `confidence` | `number` | How confident the source is in this intent, `0`–`1`. `0` means unanalyzed |
| `source`     | `string` | Where the intent came from. `"default"` means no analysis has run yet     |

`"default"` was added to the `source` union specifically to support `enrichCues`'s placeholder output, before this change there was no valid value to express "no analysis has been performed."

---

## Utilities

### `presplit`

> **Internal utility.** Not exported from the public API. Documented here for contributors.

```ts
function presplit(text: string): WordToken[];
```

Splits a cue's `text` into an array of `WordToken`s, one per word.

**Behaviour**

- Splits on whitespace (`/\s+/`)
- Trims leading/trailing whitespace before splitting
- Punctuation stays attached to its adjacent word (no punctuation stripping)
- `startTime` is left unset on every token, word-level timing is not computed at this stage

**Example**

```ts
presplit("Hello, world!");
// [{ word: "Hello," }, { word: "world!" }]
```

---

## Design Notes

### Why tokenization happens once, offline

Word tokenization is a pure function of cue text, it never changes once a cue is parsed. Running it once in `enrichCues`, as part of the offline preparation pipeline, means `TimelineController` never has to re-split text on every animation frame. `TimelineController.tick()` only ever indexes into the already-computed `words` array via `visibleWordIndex`.

### Why intent is a placeholder for now

The intent engine (Week 3) needs real signal detection, bracket annotations, punctuation cues, lexicon matching, which doesn't exist yet. Rather than leave `intent` undefined and push a null check onto every consumer, `enrichCues` attaches a fixed neutral default. This keeps `EnrichedCue` a fully-formed type from Week 2 onward, and means the only thing that changes when the intent engine ships is what populates `intent`, not the shape of the data itself.

---

## Contributor Notes

### File locations

| File                            | Purpose                                  |
| ------------------------------- | ---------------------------------------- |
| `src/preparation/enrichCues.ts` | Main enrichment function                 |
| `src/preparation/presplit.ts`   | Word tokenization utility, internal only |
| `src/types/EnrichedCue.ts`      | Output cue type                          |
| `src/types/IntentState.ts`      | Intent state type                        |

### Replacing the placeholder intent

When the intent engine ships, the fixed intent object inside `enrichCues`'s loop will be replaced with a call to the engine, passed the cue's `text` and `words`. The shape of `IntentState` should not need to change, only `intensity`, `pace`, `confidence`, and `source` will start reflecting real analysis instead of the `"default"` placeholder.
