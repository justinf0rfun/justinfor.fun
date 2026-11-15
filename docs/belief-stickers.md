# Belief sticker stack

`BeliefNote.astro` mounts one `BeliefDeck` island. The interaction is adapted from [Bencho Card Stack](https://github.com/cabralorenzo/bencho/tree/main/blocks/card-stack): one rotation per card around a shared pivot below the deck, a 55ms fan cascade, radial hover lift, a two-sided flip into the centre, and returning the inspected card to the top. Bencho's MIT notice is retained in `src/components/bencho/LICENSE`; its sample photographs and branding are not used.

`src/data/beliefs.ts` owns the five artworks, original dimensions and source links. Thumbnail carriers use the reference's 156×208 geometry and contain each full image. The inspected poster fits its own aspect ratio without a carrier background or cropped text. The original 920ms entrance and 660ms return curves, default spring coefficients and geometry live in `src/lib/belief-deck.ts`. CSS scales the logical stage with the container before hydration; there is no post-load resize jump. The phone section remains 324px tall, desktop 364px.

Posters have no decorative tape. The Acu artwork uses `acu-note-portrait.webp`: a tape-free 3:4 sheet extended vertically with matching cream paper. `first-do-it-portrait.webp` keeps its horizontal text/character composition centred within a taller 3:4 black canvas. Both retain the complete text and are lossless WebP exports. Originals and editing provenance stay in `public/home/STICKER-SOURCES.txt`.

Transparent paper artwork is marked `cutout` in the data. Its thumbnail has no opaque backing, rectangular shadow or clipping radius; an alpha-shaped image shadow follows the paper instead. This prevents a second pale card rim appearing through the irregular top and bottom edges.

Desktop hover fans the stack; pressing a card flips it into view. Phones can tap a card or swipe left/right, with vertical movement left to page scrolling. Arrow keys also switch. Outside press, Escape and the close control return the current card to the top. Rapid requests keep only the latest destination; a return finishes before the next card departs, measured after the reordered DOM commits. Only an inspected, settled poster mounts `BeliefSticker`; its lower-right 44px zone retains the existing peeler.

Autoplay waits for the original images to load, then gives each inspected poster five seconds. Touch/press, hover and keyboard focus pause it; leaving the viewport, hiding the document or opening chat, Moments or another scroll-locked overlay suspends it. The footer contains only the centred source link. Tapping the inspected poster or pressing P pauses/resumes autoplay; corner peeling remains separate. Reduced motion disables autoplay and makes manual changes immediate. Without JavaScript the same five real SSR images become a reading list with all source links.

With Node 22, run:

```sh
node scripts/check-belief-deck.mjs
pnpm exec tsc --noEmit
node scripts/check-vite-cache.mjs
node scripts/check-poster-loading.mjs
```

`scripts/probe-belief-stack.js` is a browser acceptance probe for the actual mounted component. Also check 320–1440px bounds, native touch taps/swipes/scrolling, all five image ratios, pause/resume, keyboard focus, latest-request wins, overlay pause, dark/reduced-motion and no-JavaScript reading. Native iPhone touch remains a separate physical-device check.
