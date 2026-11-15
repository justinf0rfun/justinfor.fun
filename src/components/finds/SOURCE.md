# Finds card index

Two original served implementations were inspected before this adaptation:

- Devouring Details, **Mantras**: https://devouringdetails.com/mantras
  - `/_next/static/chunks/app/mantras/page-3f949d9dfe5ba612.js`
  - Original card geometry: 304 × 413, perspective 5800, rotateX 40°, rotateZ 30°,
    stepX 48, stepZ 2, selected slide 160, hover peek 24.
  - Card spring: stiffness 250, damping 20, mass .5.
  - Index spring: stiffness 500, damping 40, mass .8.
  - The source's `j` position calculation is adapted in `cardPose`, including
    the quadratic five-card proximity wave and the 5–12 cards/second smoothstep
    cascade. It rests when browsing stops; reduced motion suppresses the wave.
    The finite collection replaces its 105-card repeating window. No source copy,
    audio track, or background playback is included.
- Till Janek, **Segmented Navigation**:
  https://www.framer.com/marketplace/components/segmented-navigation/
  - Preview: https://segmented-navigation.framer.website/
  - Served module:
    `https://framerusercontent.com/sites/5zThIQjauVmFmamr7POE1m/Qm3S6eVxGFPrZfg-4RewetU9biznV1mc_IeKoQWQmbA.pIx0UeUd.mjs`
  - Original spring: bounce .1, duration .3. The current segment opens to its
    label; adjacent marks grow/brighten by distance; closed marks are 4 × 12.
  - The first React adaptation retained this variant behavior. The current control
    keeps the compact black-and-white readout and graduated marks, but uses a
    continuous ruler instead of hover-expanded navigation. No Framer page runtime,
    tracking scripts, demo links or badge are shipped.
  - Listed as free under the Limited Commercial License:
    https://www.framer.com/legal/community-terms#7-ownership-license-grants
    Ownership remains with Till Janek; this is integrated into the site's Finds
    experience, not distributed as a standalone marketplace component.

No open-source license is asserted for Mantras. Both sources are credited in the
homepage Inspired list. The wooden drawers are native interactive surfaces based
on the user's card-cabinet reference photo, not a copied museum photograph.

The 12 sample cards are labeled in the reader and have no fake external sources.
The index has a fixed readout above a moving ruler, backed by the same fractional
position as the paper fan.

The selected paper's top-left circle uses the public homepage's original mark:
https://devouringdetails.com/home . Its `new-home_introLogo` is a plain 20 px
circle (`--logo-size:20px`), with `--color-orange:#ff670d` and the original
Display P3 override `color(display-p3 .99 .4 .02)`. There is no border, shadow,
or idle animation. It is inside the selected paper so its existing perspective
and motion apply to the mark; the number shifts beside it to avoid overlap.

The existing X snapshots, source IDs, authors, URLs, save dates and personal takes
are preserved. `src/data/finds.ts` adds editorial titles, topical entry points and
explicit relationships between sources. These are not quotes or personal takes.
The media-only post remains unfiled rather than inventing its contents.

Desktop wheel / pointer dragging and touch dragging drive one finite position.
Release snaps with velocity; vertical touch scroll stays native. Reduced motion
removes the perspective rotation and uses immediate selection. Reading has its
own scroll surface and explicit return; Escape returns before leaving Finds.
Session storage retains the last drawer and card, with a no-storage fallback.

Both the existing homepage overlay and `/x-threads` use the same component.
`ParentLink.astro` continues to own parent navigation. The old paper flight is
replaced by the actual drawer-face handoff; all other collection transitions stay
on their existing paths.

Finds card changes use **Step**, from Lorenzo Cabra's MIT-licensed Bencho sounds:
https://bencho.dev/sounds/step and
https://github.com/cabralorenzo/bencho/blob/main/sounds/sounds.ts .
`src/lib/step-sound.ts` retains the original Step recipe and scheduling: sine
227 → 114 Hz, 820 Hz lowpass, .051 peak gain, 90 ms attack, 311 ms envelope,
5 ms scheduling offset and 20 ms source-stop margin. The existing Bencho MIT
notice is retained at `src/components/bencho/LICENSE`.
Only changes of selected card after a real Finds gesture trigger playback.
Initial hydration / saved-position restoration and reopening the same card stay
silent. A 60 ms gap and a short fade of the previous voice prevent overlapping
sound piles during a fast scrub. Closing Finds releases the current voice.
Unsupported / suspended audio is silent and never queues delayed sounds; iPhone
hardware mute is not overridden.

The open-desk revision removes the rail's rectangular clip. Nearby cards retain
48 px spacing (three on each side on a wide desktop, one on a phone). Further
cards use a bounded, monotonic paper-stack offset; the join preserves the original
48 px/card slope so a card does not jump or abruptly slow at the stack boundary.
Its compressed depth follows the same offset. Outside the nearby-card range,
residual vertical spring motion smoothly tucks into the paper stack; the current
card and nearby cards retain their full original lift. The original selection slide,
hover peek, speed-dependent wave, card/index springs and gesture-to-index mapping
are retained. A width-only ResizeObserver sets the fan's reach and camera scale;
there is no per-frame layout measurement. Counting moves into the segmented index,
while card identities remain on the paper. The reading surface is unchanged.

Drawer switching has a separate handoff controller (`finds-drawer-transfer.ts`).
The old fan's inert snapshot gathers back into its drawer. A single leading-paper
copy keeps the real rail's 3D rig, arrives at the canonical selected-card pose,
and hands painting back to the real paper with a 60 ms depth-order fade. Neighbors
open behind it. A fresh drawer choice takes about 740 ms on desktop and 620 ms on mobile,
including the final depth fade. It peeks from the actual drawer mouth, lifts into
a curved flight, gently rolls and pitches, then settles. Mobile uses less arc
and rotation. A repeated choice skips the peek and retargets from the live pose
and velocity in about 440 / 360 ms, so rapid input never queues the full sequence. No page, iframe, animation queue or input lock is introduced.

Manual drawer clicks always re-extract the leading card, including the active
drawer and a source shared with the next drawer. The real keyed node and source
identity are retained, while its inert visual copy performs the extraction.
A request counter, separate from the active drawer ID, commits repeated clicks;
initial session restoration does not increment it and remains silent.
Repeated choices reuse the current traveler MotionValues. The pure sampler in
`drawer-flight.ts` gives a new target the on-screen pose and velocity. Neighbor
papers unfold in a distance-based stagger, ending at the existing dialing poses. There are at most two disposable rigs. Completion
is generation-guarded; browsing takes over immediately, and close, scroll, resize,
visibility loss and unmount remove copies and reveal any covered real card.
Initial session restoration and reduced-motion changes do not create flights.
The existing drag/wheel mapping, nearby spring, folded-stack geometry, orange
selection marker, linked-reading handoff and Step sound recipe remain in place.

The continuous scrubber accepts mouse and touch. While held, 28 pointer pixels
move the ruler one card with no spring or integer rounding; leftward movement
advances both the ruler and fan consistently. A six-pixel direction threshold
allows native vertical scrolling. End resistance is bounded below half a card,
so overscroll cannot deselect the endpoint. Release snaps with limited momentum;
cancel and blur settle to the nearest card. Layout/group changes release capture
without carrying a stale gesture into the next drawer. The readout width is fixed.
ARIA slider values and the existing arrow/Home/End controls expose the selection.
Step sounds follow the selected index as before. A shared live `useVelocity`
signal makes the original velocity wave return to rest even when the hand stops
without changing position; it does not run a permanent frame loop.

Horizontal trackpad wheel events accumulate into that same continuous position;
vertical wheel scrolling stays native. Keyboard changes cancel an active pointer
or wheel gesture before stepping, and the horizontal slider also accepts Up/Down.
The original 3D paper rail retains its own drag mapping and spring parameters.

The reading entry is a locally designed numbered paper tab tucked under the
index. It follows downward pointer travel directly for 32px, then resists toward
a 64px limit. Releasing after 28px opens the same existing reading surface; a
short or sideways pull returns with the existing drawer spring. Tap, Enter and
Space remain available. Pointer cancellation, blur, group changes, navigation
keys, overlay close and reduced-motion changes cancel the held gesture. The tab
adds no sound, asset, dependency or alternate reader.
