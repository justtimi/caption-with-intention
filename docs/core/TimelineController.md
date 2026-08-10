# `TimelineController`

The TimelineController is an engine responsible for returning the caption render state for the current time of the video. The reason for its existence is to create the loop that watches the cues for state changes and without it, users would have to manage the timeline themselves.

## Table of Contents

- [Quick Start](#quick-start)
- [Constructor](#constructor)
- [Public API](#public-api)
  - [`start()`](<#start()>)
  - [`stop()`](<#stop()>)
  - [`CaptionRenderState`](#captionrenderstate)
  - [Cue Phases](#cue-phases)
- [Utilities](#utilities)
  - binarySearch
- [Seeking behaviour](#seeking-behaviour)
- [Constraints](#constraints)
- [Architecture Notes](#architecture-notes)
- [Related](#related)

## Quick Start

```ts
const video = document.getElementById("video");
const cues = parseSRT(srtfile).cues;

const callback = () => {};

const engine = new TimelineController(video, cues, callback);
```

> Note: This documents TimelineController as of Week 1. Week 2 updates include EnrichedCue[] support and real visibleWordIndex calculation. See Week 2 PR for changes.

## Constructor

| Parameter  | Type                                  | Description                                                                          |
| ---------- | ------------------------------------- | ------------------------------------------------------------------------------------ |
| `video` | `HTMLVideoElement` | This is the video element whose timeline we are using                                |
| `cues` | `EnrichedCue[]` | This is the returned output from the parsers.                                        |
| `callback` | `(state: CaptionRenderState) => void` | This is the custom function that we pass the state into. It is called on every tick. |

## Public API

The controller gives two methods to the consumer

- `start()`
- `stop()`

### start()

The start utilizes the `requestAnimationFrame()` to create a loop that refreshes with the refresh rate of the device. The logic of the loop is abstracted away from the start method into the tick method.

### stop()

The stop method is responsible for the destroying the animation loop.

### `CaptionRenderState`

```ts
type CaptionRenderState = {
  activeCue: EnrichedCue | null;
  previousCue: EnrichedCue | null;
  visibleWordIndex: number;
  cuePhase: CuePhase;
};
```

The active cue is the cue that is currently used.The previous cue is a cue used just immediately before the activeCue. The visibleWordIndex is the number of words that should be visible at the current moment. For now, it is being hardcoded to `0` pending the time that the logic for it would be implemented.

### `cuePhase`

```ts
type CuePhase = "entering" | "active" | "exiting" | "idle";
```

`cuePhase` is responsible for the state of the cue in order for the transitions to work in the later stages of the project.
There are four cuePhase states.

1. `entering`
2. `active`
3. `exiting`
4. `idle`

entering is to signify that the cue is just entering the engine. entering fires on the first frame a cue becomes active, which is when a renderer would start a fade-in animation.
active is to signify that the cue has been in the engine for a while. The renderer doesnt need to take any animation concerns at cue level for this cue phase. But it means that these cues should be the one to be displayed on the screen. `exiting` is to signify that the cue is just leaving the engine, which is when a renderer would start a fade-out animation. For idle, it means that there is no cue currently in the engine for that current time, and then therefore, nothing displays in the renderer.

## Utilities

### `binarySearch()` dependency

The TimelineController needs to be able to locate the current active cue. The timeline has timestamps on it, and on each timestamp we want to know what cue is presently on that timeline, and it sounds so easy but it is more complex than that because if we decide to check if eachcue belongs to the current time, but eventually, we could get to stages, where, there are 2000 cues, and worst case scenario, we would have to go around the cues 2000 times per frame, and that is not performance-wise.
But with binarySearch, we cut the cues array in half on every iteration, thereby cutting an array of 2000 iterations into 11 times.
The binarySearch here is a variation of the Leetcode version. We start by comparing the currentTime to a range of startTime <= currentTime < endTime instead of checking for only one value of the startTime because the curentTime can be anywhere. But if the target is greater than the middleCues startTime, then we set the start to the middle + 1. And if the startTime is greater than the target currentTime, we set the end to the middle - 1. But there is a tradeoff, binarySearch only works on sorted data and then we have to make a design decision, either we trust the consumer to sort it or we sort it ourself. But I decided to sort it in code to make it foolproof for production.

## Seeking behaviour

The engine is designed to be stateless with respect to time, so when seeking occurs, the engine checks the next frame to perform the action again to check the state of the cue and which cue is currently active. But the engine keeps the previousCue on every frame in order to make comparisons for the cue phases.

## Constraints

The binary Search utility needs sorted input to work successfully. This was properly handled in the parser.
The cues array was not meant to be rebuilt between frames.
The visibleWordIndex is hardcoded for now until week 2 work starts.

## Architecture Notes

It is abstracted from the DOM renderer because this allows for versatility and keeps the controller agnostic. It can be adapted for a wide variety of uses.
And considering my two-pipeline design, this belongs to the playback seeking that happens on every frame; enrichment and other heavy computations occur when the captions load initially, and from there on the engine handles the seeking and the minor computations that should happen on every frame.

## Related

- [binarySearch.ts](../packages/core/src/utils/binarySearch.ts)
- [CaptionRenderState.ts](../packages/core/src/types/CaptionRenderState.ts)
- [EnrichedCue.ts](../packages/core/src/types/EnrichedCue.ts)
- [TimelineController.ts](../packages/core/src/engine/TimelineController.ts)
