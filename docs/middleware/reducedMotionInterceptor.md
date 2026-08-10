# `reducedMotionInterceptor`
The `reducedMotionInterceptor()` takes in the state 

---

## Table of Contents

- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [`enrichCues`](#enrichcues-1)
  - [`EnrichedCue`](#enrichedcue)
  - [`WordToken`](#wordtoken)
  - [`IntentState`](#intentstate)
- [Design Notes](#design-notes)
- [Contributor Notes](#contributor-notes)


1. **Title + one-line description** — what it does and why it exists (accessibility interceptor sitting between the intent engine and the renderer, per EDL-010)
2. **Table of Contents** — probably just: Quick Start, API Reference (`reducedMotionInterceptor`, `BaseCaptionRenderState`), Design Notes, Contributor Notes. This doc likely doesn't need a "Utilities" section since there's no internal-only helper here.
3. **Quick Start** — a short example showing it wrapping a `CaptionRenderState` before it reaches a renderer callback (you'll know the real call site better than me — is it called inside `TimelineController.tick()`, based on the code you pasted?)
4. **API Reference**
   - `reducedMotionInterceptor(state)` — signature, parameters, return type, behavior (reads `matchMedia` live on every call, not cached)
   - `BaseCaptionRenderState` — explain this is `CaptionRenderState` minus `reduceMotion`, and *why* that type exists (the interceptor's whole job is adding the one field the rest of the pipeline doesn't produce yet)
5. **Design Notes** — this is the important section for this doc specifically. Worth covering:
   - Why `matchMedia` is queried fresh on every call rather than cached once (live accessibility preference, can change mid-playback — same reasoning you worked through for `CueView`'s `reduceMotion` handling)
   - Why this sits as a separate interceptor/middleware step rather than being baked directly into `TimelineController` or the renderer (separation of concerns — motion preference is orthogonal to timing logic)
   - Connects to EDL-010 explicitly
6. **Contributor Notes** — file location, and maybe a note like "if a new accessibility-sensitive preference needs the same live-read treatment, follow this same pattern" (forward-looking guidance, similar to how `parseVTT.md` has "adding a new cue setting")
