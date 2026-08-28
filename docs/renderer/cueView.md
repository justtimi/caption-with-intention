# `createCueView`

Creates a `CueView`: a small DOM controller that renders a single caption cue as one `<span>` per word, and exposes an imperative API for marking words visible up to a given index (for word-by-word highlighting).

---

## Table of Contents

- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [`createCueView`](#createcueview-1)
  - [`CueView`](#cueview)
    - [`setCue`](#setcue)
    - [`updateVisibleWord`](#updatevisibleword)
    - [`clear`](#clear)
- [Word Visibility Model](#word-visibility-model)
- [DOM Output](#dom-output)
- [Contributor Notes](#contributor-notes)

---

## Quick Start

```ts
const view = createCueView(document.getElementById("captions")!);

view.setCue(cue); // cue: EnrichedCue
view.updateVisibleWord(0, false);
view.updateVisibleWord(1, false);
// ...
view.clear();
```

---

## API Reference

### `createCueView`

```ts
function createCueView(container: HTMLElement): CueView;
```

Creates a `CueView` bound to `container`.

**Parameters**

| Parameter   | Type          | Required | Description                                      |
| ----------- | ------------- | -------- | ------------------------------------------------ |
| `container` | `HTMLElement` | Yes      | The element the cue view will render itself into |

**Returns** [`CueView`](#cueview)

**Behaviour**

- Creates a single root `<div>` and appends it to `container` immediately, once, on creation
- The root `<div>` stays in `container` for the lifetime of the returned `CueView`, `clear()` empties it but never removes it from `container`
- Word `<span>` elements are recreated on every `setCue()` call; nothing is reused across cues

---

### `CueView`

```ts
interface CueView {
  setCue(cue: EnrichedCue): void;
  updateVisibleWord(index: number, reduceMotion: boolean): void;
  clear(): void;
}
```

#### `setCue`

```ts
setCue(cue: EnrichedCue): void;
```

Renders a new cue, replacing whatever was previously shown.

| Parameter | Type          | Description                                                                                                   |
| --------- | ------------- | ------------------------------------------------------------------------------------------------------------- |
| `cue`     | `EnrichedCue` | The cue to render. Only `cue.words` is read; each word token's `word` string becomes the text of one `<span>` |

**Behaviour**

- Clears any existing word spans and resets visibility state before rendering (equivalent to calling `clear()` first)
- Creates one `<span>` per entry in `cue.words`, in order, and appends each to the root element
- Newly created spans have no `data-visible` or `data-reduce-motion` attributes until `updateVisibleWord` is called
- Does not itself mark any word visible, call `updateVisibleWord` afterward to reveal words
- For cues with no words, no spans are created (existing state is still cleared)

#### `updateVisibleWord`

```ts
updateVisibleWord(index: number, reduceMotion: boolean): void;
```

Advances or rewinds which words are marked visible, up to and including `index`.

| Parameter      | Type      | Description                                                                                                    |
| -------------- | --------- | -------------------------------------------------------------------------------------------------------------- |
| `index`        | `number`  | The index (into the current cue's words) that should now be the last visible word. `-1` means no words visible |
| `reduceMotion` | `boolean` | Written onto every word touched by this call as `data-reduce-motion`                                           |

**Behaviour**

- Clamps `index` to the valid range for the current cue: `[-1, wordSpans.length - 1]`
- Only touches the spans **between** the previous index and the new one (see [Word Visibility Model](#word-visibility-model)), words outside that range keep whatever attributes they already had
- Calling with the same `index` as the previous call is a no-op; no spans are touched and no attributes change
- If called before `setCue` (no words rendered), it updates internal state but has no visible effect
- `reduceMotion` is only applied to spans touched by _this_ call. It is not retroactively applied to spans set by earlier calls with a different `reduceMotion` value

#### `clear`

```ts
clear(): void;
```

Removes all rendered words and resets visibility state.

**Behaviour**

- Removes all child spans from the root element
- Empties the internal word span list
- Resets the visible-word index back to `-1`
- Does not remove the root `<div>` from `container`
- Calling clear() multiple times in a row is safe and produces no errors

---

## Word Visibility Model

`updateVisibleWord` doesn't set an absolute state on every span each time it's called, it diffs against the _previous_ call and only updates the spans in between. This makes it cheap to call on every animation frame or timeupdate tick, but means callers should never call it out of order relative to how they want visibility to progress.

- **Moving forward** (`index` greater than the previous call's index): every span from `previous + 1` up to and including `index` gets `data-visible="true"`
- **Moving backward** (`index` less than the previous call's index): every span from `index + 1` up to and including `previous` gets `data-visible="false"`
- The span at the _old_ index is never re-touched by the call that moves away from it, it keeps the attributes it already had
- `clear()` and `setCue()` both reset the tracked index to `-1`, so the next `updateVisibleWord` call is always treated as moving forward from "nothing visible"

---

## DOM Output

Given a cue with three words and this sequence of calls:

```ts
view.setCue(cue); // words: ["Hello", "there", "world"]
view.updateVisibleWord(1, false);
```

The rendered DOM is:

```html
<div>
  <span data-visible="true" data-reduce-motion="false">Hello</span>
  <span data-visible="true" data-reduce-motion="false">there</span>
  <span>world</span>
</div>
```

The third span is untouched, it has no `data-visible` or `data-reduce-motion` attributes yet, since `updateVisibleWord` has only advanced as far as index `1`.

---

## Contributor Notes

### File locations

| File             | Purpose               |
| ---------------- | --------------------- |
| `src/cueView.ts` | Main factory function |

### Diffing logic

`updateVisibleWord` computes `min = Math.min(previousVisibleWordIndex, index)` and `max = Math.max(previousVisibleWordIndex, index)`, then iterates `i` from `min + 1` to `max` inclusive. The direction (`data-visible="true"` vs `"false"`) is decided once per call, based on whether the new `index` is greater than the previous one, and applied to every span in that range. This is why the model in [Word Visibility Model](#word-visibility-model) describes ranges rather than per-span state, the function does not compare each span's current attribute value, it only compares the two index bookends.

### Adding a new per-word attribute

To have `updateVisibleWord` set an additional `data-*` attribute alongside `data-visible` and `data-reduce-motion`, add the corresponding parameter to `updateVisibleWord` and set it inside the same `for` loop, so it stays subject to the same range-diffing behaviour rather than being applied to all spans unconditionally.
