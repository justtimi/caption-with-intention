
## `intentEngine.md` — Outline

This one's bigger — closer in scope to `parseVTT.md` than to `enrichCues.md`, since there's real algorithmic complexity (signal detection, confidence formula, multiple lexicons).

1. **Title + description** — one paragraph: rule-based, no ML/dependencies, infers `IntentState` from cue text
2. **Table of Contents**
3. **Quick Start** — `inferIntent(text)` called on raw cue text, returns `IntentState`
4. **API Reference**
   - `inferIntent(text)` — signature, parameters, return type
   - Note: this probably needs its own **Signal Detection** subsection (or a whole separate top-level section) since there isn't just one behavior — there are ~6 distinct detection mechanisms feeding into one result. Worth listing each one as its own subsection:
     - Bracket annotations (with modifier support)
     - ALL CAPS detection (+ `emphasizedWords`)
     - Punctuation signals (`?`, `!`, `!!!`, `...`)
     - Sentence fragmentation
     - Lexicon matching (hesitation / loud / urgency / whisper)
     - Modifiers (single-word and multi-word)
5. **Confidence Formula** — this deserves its own top-level section, not buried in API Reference, since it's a distinct algorithm worth explaining on its own:
   - The agreement-weighted formula (`C_base`, λ, agree/disagree ratio)
   - Why agreement-weighting exists (signals that agree with each other should boost confidence, conflicting signals should reduce it)
   - How `intensity` and `pace` are resolved independently, then averaged into overall `confidence`
6. **Utilities** (internal, not exported) — `sentenceMaker`, and any lexicon files worth documenting as internal data tables (`bracketAnnotations`, `modifiers`, `hesitation`/`loud`/`urgency`/`whisper`)
7. **Design Notes** — worth covering:
   - Why rule-based instead of ML for MVP (ties to your original Week 3 plan: "no ML, no dependencies")
   - Why agreement-weighting instead of just averaging confidences naively
   - Known simplifications — this is important given your own list from the earlier session: punctuation-attached word matching breaking lexicon lookups, no stemming, no negation handling, no multi-word urgency phrases, uniform modifier application across dimensions. These should be documented explicitly, not silently left out — matches your "no simplifications without acknowledgment" standard.
8. **Contributor Notes** — file locations (`intentEngine.ts`, `signals.ts`, `bracketAnnotations.ts`, `modifiers.ts`, `lexicons/*`), and "adding a new lexicon entry" / "adding a new bracket annotation" guidance (similar to `parseVTT.md`'s "adding a new cue setting" section)

```ts
// totalAdjustment is applied uniformly to all signals from this annotation.
// Dimension-specific modifier weighting is a known simplification —
// deferred to Phase 3 when the ML layer can handle it more accurately.
```
