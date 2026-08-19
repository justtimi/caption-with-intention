# Gaps document for project

## Core

## DOM

### Title: exiting to entering held-release transition bug

**Component**: CaptionRenderer
**Severity or reachability**: High. Reachable through ordinary `TimelineController` output whenever two cues are scheduled with no gap between them; not a contrived edge case.
**Reproduction Steps**:

1. When `render()` transitions directly from a held exiting state into a new entering state (no idle in between), the top block acquires a fresh view and populates it with the new cue.
2. Then the bottom block's release-check fires on `activeView`, which now points at the just-acquired view instead of the original held one.
3. This wipes the new cue's freshly rendered spans in the same tick, and the original cue's view is never released, so it stays permanently stuck in the DOM, orphaned.
   **Verified via**: DOM inspection after the transition shows the old cue's words still visible, and the pool loses one slot per occurrence.
   **Correct behaviour**: When it transitions from exiting to entering, the original cue's view should be cleared and released before `activeView` is set to the new cue's view.
   **Status**: Documented to be fixed in testing week from writing captionRenderer tests.

### Title: entering leak during repeated entering transitions

**Component**: CaptionRenderer
**Severity or reachability**: High. Reachable directly through render()'s public contract, with no internal guard when a new cue enters repeatedly without a clean exiting/idle release path; the leak is triggered by the sequence itself, not by a malformed upstream state.
**Reproduction Steps**:

1. Call `render()` repeatedly in the entering phase without ever reaching exiting or idle, causing each pass to acquire a fresh view from the pool.
2. Each new entering render reuses the same `activeView` assignment pattern, but no release occurs because the transition never reaches the normal release checkpoint.
3. After enough iterations, the pool is exhausted and the next acquisition throws, even though no cue has legitimately completed its lifecycle.
   **Correct behaviour**: Each entering render should either release the previous in-use view before reusing the slot or reject the state transition explicitly instead of silently draining the pool.
   **Status**: Documented to be fixed in testing week

### Title: active before entering silent-failure gap

**Component**: CaptionRenderer
**Severity** or reachability: Medium. Reachable when the first cue update arrives in the active phase before any prior entering call has allocated a view; this is a real edge-case ordering path, not a contrived metastable state.
**Reproduction Steps**:

1. Start with no prior entering or active view allocation, then call `render()` with `cuePhase` set to `active`.
2. Because `activeCue` is present, the renderer enters the `active` branch, but `activeView` is still `null` because no entering call allocated it; `activeView?.updateVisibleWord(...)` therefore short-circuits and does nothing.
3. No exception is raised, but the behavior is effectively a silent no-op: the state is accepted without preparing or attaching the expected cue view.
   **Correct behaviour**: The renderer should initialize the active cue explicitly on first render, or fail fast with a clear diagnostic, instead of silently accepting an active state that never had a valid entering allocation.
   **Status**: Documented as a silent-failure edge case from the Q7 investigation
