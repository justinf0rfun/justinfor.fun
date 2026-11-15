# Inspired & Credits

Every `LocalTimeFooter` opens the one `InspiredCredits` instance mounted by `Layout`.
The seven audited sources live in `src/data/inspirations.ts`; each feature pairs an
existing DOM selector with its actual local page. Credits distinguish visual
references, adapted implementations and third-party assets. Existing MIT notices
remain with the Bencho and Skullet implementations; Dots asset provenance remains
in `src/lib/dots/SOURCES.md`. Attribution does not assert additional permissions.

On wide screens the source list stays beside the page. A thin SVG thread and
outline connect the selected credit to the live component. Below 1200px the list
opens as a sheet; “See it here” replaces it with a small bar on the opposite edge
from the target. A feature on another page navigates normally, then resumes its
annotation through `?inspired=<id>&part=<index>`; those temporary parameters are
removed after loading. Explicitly closing restores scroll and focus.

While credits are open, sticker autoplay pauses. `inspired-preview` asks the
existing Bencho stack to fan once or the existing Dots renderer to respond; it
does not create another renderer. Reduced motion skips both responses. The
reading capsule completes its own entrance before an annotation is drawn.

Validation: `node scripts/check-inspired-credits.mjs` checks geometry and source
records. Evaluate `scripts/probe-inspired-credits.js` on the hydrated homepage to
check open/mark/mobile collapse/close, autoplay pause and scroll/focus restoration.
