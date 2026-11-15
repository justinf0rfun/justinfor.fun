# Belief sticker deck

`BeliefNote.astro` mounts one `BeliefDeck` island. Artwork, dimensions, paper colors and original source links live in `src/data/beliefs.ts`; add another item there rather than copying layout markup. All five images remain real, sized SSR images. Without JavaScript, the stack becomes a static reading list with each source link.

The phone section is 324px tall; desktop is 364px. Posters retain their own proportions. Back papers scale to fit the front paper before taking their small offsets, so selecting a landscape does not expose tall posters behind it. Desktop fine-pointer hover opens a fan inside the same stage. Selecting a paper gathers the stack again.

The centre handles horizontal drawing; the lower-right 44px zone stays with the existing ElasticSticker peeler. Vertical intent releases the deck without preventing the page gesture. Pointer cancellation, resize and window blur return the paper without changing selection. The previous/next controls and arrow keys provide explicit alternatives; keyboard and reduced-motion changes are immediate. Only the front paper mounts the interactive WebGL sticker, with static originals behind it.

Order changes at release, before the decorative flight. Interrupted flights sample their current transform; stale animation completion never changes the order. A paper passes beside the stack, turns slightly in perspective, changes depth while outside, then settles underneath. There is no autoplay or new dependency.

With Node 22, run `node scripts/check-belief-deck.mjs`, `node --test scripts/check-belief-deck-controls.mjs`, and, after building, `node scripts/check-poster-loading.mjs`. In a browser check 320–1440px bounds, repeated drawing during an unfinished flight, desktop direct fan selection, corner peeling, native touch scrolling, reduced motion, dark mode, and the no-JavaScript reading layout.

Browser checks passed in WebKit at phone/desktop sizes, with reduced-motion and no-JavaScript fallbacks. Chromium's native touch input passed consecutive left/right drawing, vertical scrolling without selection, and corner peel/release with one canvas. Keep the implicit-capture transfer regression: a child's bubbling `lostpointercapture` must not cancel the deck's gesture. iPhone Simulator Safari rendered the layout, but its automation input returned no DOM events, so native iPhone gestures are not counted as verified; physical-device testing remains.
