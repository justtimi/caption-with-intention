# `createCueNodePool`

Creates a `CueNodePool`: a factory function for the DOM controller. It is used to create a pool to acquire and release the DOM elements to maximize performance.

---

## Table of Contents

- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [`createCueNodePool`](#createcuenodepool-1)
  - [`CueNodePool`](#cuenodepool)
    - [`acquire`](#acquire)
    - [`release`](#release)
- [Word Visibility Model](#word-visibility-model)
- [DOM Output](#dom-output)
- [Contributor Notes](#contributor-notes)

---

## Quick Start

```ts
const container = document.createElement("div");
const pool = createCueView(container, 2);
const view = pool.acquire();
view.setCue(cue);
view.updateVisibleWord(0, false);
view.updateVisibleWord(1, false);
view.clear();
pool.release(view);
```

---

## API Reference

### `createCueNodePool`

```ts
function createCueNodePool = (
  container: HTMLElement,
  poolSize = 2,
): CueNodePool;
```

Creates a `CueNodePool` bound to `container` and has a configurable `poolSize`.

**Parameters**

| Parameter   | Type          | Required | Description                                                                                       |
| ----------- | ------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `container` | `HTMLElement` | Yes      | The element the cue view will render itself into                                                  |
| `poolSize`  | `number`      | No       | The number of views that are populated into the view upon initialization. The default is set to 2 |

**Returns** [`CueNodePool`](#cuenodepool)

**Behaviour**

- Creates an empty array of `views` upon creation.
- The array is then populated with an amount of views equal to the value of `poolSize`.
- An empty set is created upon initialization to record the views that are in use.

---

### `CueNodePool`

```ts
interface CueNodePool {
  acquire: () => CueView;
  release: (view: CueView) => void;
}
```

#### `acquire`

```ts
  acquire(): CueView;
```

Renders a new cue, replacing whatever was previously shown.

**Behaviour**

- Clears any existing word spans and resets visibility state before rendering (equivalent to calling `clear()` first)
- Creates one `<span>` per entry in `cue.words`, in order, and appends each to the root element
- Newly created spans have no `data-visible` or `data-reduce-motion` attributes until `updateVisibleWord` is called
- Does not itself mark any word visible, call `updateVisibleWord` afterward to reveal words
- For cues with no words, no spans are created (existing state is still cleared)

#### `release`

```ts
  release(view: CueView): void;
```

Advances or rewinds which words are marked visible, up to and including `index`.

| Parameter | Type      | Description                                                                                                 |
| --------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| `view`    | `CueView` | The particular cue view that should be made available to be acquired eventually. The function is idempotent |

**Behaviour**

- Clamps `index` to the valid range for the current cue: `[-1, wordSpans.length - 1]`
- Only touches the spans **between** the previous index and the new one (see [Word Visibility Model](#word-visibility-model)), words outside that range keep whatever attributes they already had
- Calling with the same `index` as the previous call is a no-op; no spans are touched and no attributes change
- If called before `setCue` (no words rendered), it updates internal state but has no visible effect
- `reduceMotion` is only applied to spans touched by _this_ call. It is not retroactively applied to spans set by earlier calls with a different `reduceMotion` value

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
