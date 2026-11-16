# Finds card cabinet

`GATE: OPEN 36 (rounds used up)` — the generic marketing-page gate is not a pass.
That record predates the open-desk revision and is retained below for traceability.
The approved design deliberately uses a small cabinet, perspective paper stacks,
and a compact app header. No checker rules were changed or waived.

## Content and entry points

The homepage drawer and `/x-threads` share `FindsCabinet.tsx`. The original four
X snapshots, IDs, authors, save dates and personal takes remain in
`src/data/x-bookmarks.json`. Editorial titles, topic pointers and explicit source
relationships live in `src/data/finds.ts`. A source can appear in several drawers;
its identity stays the same. New sources without editorial metadata go to Unfiled.
Twelve explicitly marked sample cards supplement the four saved sources (16 total):
Learning has 6, Engineering 6 and Unfiled 5, with one real source shared between topics.
Sample cards have no invented author, publication date or external source link.
The open desk uses natural paper-stack edges rather than a rectangular clipping mask.
Nearby spacing and the original gesture springs are retained; distant cards fold
into bounded stacks, with a responsive reach and camera scale. The drawer label
stays on the cabinet, and the current / total count sits inside the segmented index.
The fixed-width index pairs a stable readout with a continuously moving ruler.
Mouse and touch drag the same fractional position as the cards; release snaps
with limited momentum, and both ends resist gently. Its ARIA slider supports the
existing arrows, Home and End. A numbered paper pull tab hangs beneath that control:
Tap or keyboard opens the selected note. A downward pull follows the hand and
opens at 18px without waiting for release.
Direction is reevaluated throughout the gesture so initial sideways jitter does
not lock out a later downward pull. Short or sideways pulls spring back. Before
the trigger, cancellation, focus loss, drawer changes and closing the overlay
never commit a read. Pulling
freezes any unfinished card selection so the tab cannot open a different note.
Personal takes remain blank until Justin supplies them. The media-only post links
to its source instead of inventing an explanation of its media.

The original Mantras card geometry, index and card springs, speed-dependent
proximity wave, and Segmented Navigation variant behavior are documented in
`src/components/finds/SOURCE.md`. The site's existing Motion dependency is reused.
There is no added dependency, embedded reference site, admin interface or graph editor.

Drawer changes gather the outgoing fan and carry one leading card from the new
source drawer: it peeks out, lifts into an arc, lightly rolls and settles.
A fresh switch takes roughly 0.7 seconds, with a smaller arc on a phone. Repeated
choices skip the peek and inherit the current pose. Manual clicks replay extraction for all four drawers, including the active drawer
and a shared selected source. Shared cards retain their real keyed node and source
identity; the visual copy flies again. A separate request counter ensures a click
that leaves the drawer ID unchanged still commits the animation. Incoming neighbors unfold without blocking gestures;
rapid choices retarget the one traveler rather than building an animation queue.
A short final fade restores the native 3D occlusion order. Copies are inert and
removed on completion, close, scrolling, resizing, visibility loss and unmount.
The original dialing physics are separate from this handoff.

The files visible inside an open drawer use three slightly offset warm-paper
dividers. Their upper edge has a raised right tab joined by a rounded, sloping
shoulder. The contour stays clipped inside the existing wooden box; the drawer
face, handle, main card fan and opening motion keep their existing geometry.

The handles keep their original silhouette, responsive dimensions, border widths
and recess proportions in both entry points. Polished stainless-steel reflections
paint only the metal rim; its central slot is transparent and reveals the actual
drawer wood beneath it. No material layer or inset highlight fills that opening.
The finish uses neutral steel, a restrained upper-left reflection, a fine bevel
and a slightly warm lower reflection from the wooden face, with a close contact
shadow. Width, height, roundings, edge thickness and the slot stay at the original
values; the finish does not introduce a new hover or animation path.

## Reading format

All cards use `FindsReader.tsx` and `finds/FindsReader.css`, in this order:

| Part | Rule |
| --- | --- |
| Registry | A sticky `Put back` control and fixed card number. A small card settles into a drawer on hover, press and close. Closing starts immediately; the icon never delays it. The number is identity, not a drawer position. |
| Reading path | Appears only after following a connection. Addresses form a compact path; accessible names retain each title. |
| Heading | Editorial title, then topic labels and the sample marker when applicable. |
| Personal note | `My take`, only when Justin has supplied one. No placeholder or invented opinion. |
| Content | Samples use plain prose. Real saved sources use `Saved excerpt`, the real author, publication date and a semantic quotation preserving the stored paragraphs. Media-only snapshots use the existing honest media message. |
| Provenance | One canonical original link and the saved date, only for real sources. |
| Connections | Target card number, title and the existing reason. Internal arrows point right; external links point outward. Omit the entire section if no connections exist. |

The paper, ink and rule colors come from the existing Finds palette, including
dark mode. Titles are 24–30px, body text 16px at 1.7 line height, and the reading
column is capped at 60ch. Metadata uses 11–12px; monospace is reserved for card
addresses. A 12 / 18 / 24 / 28px spacing rhythm groups metadata, separates source
prose and keeps connections secondary. Desktop paper follows its content up to a
720px scroll limit within the available viewport; mobile keeps a stable reading sheet with its return bar always
available. Long text wraps rather than overflowing. Empty optional sections leave
no headings or gaps. Existing reader / article presence transitions, keyboard
return, reading trail, drawer handoff and dialing physics remain on their paths.
Keyboard focus on paper titles and reading controls uses a text underline instead
of an enclosing outline; focus restoration also stays enabled for touch and assistive input.
While a detail is open, the whole background fan fades out, including unselected
neighbors. Putting the note back restores every card with the same poses and
browsing position, so short details cannot expose paper corners underneath.
Short landscape viewports use the available screen height rather than a small
desktop paper. Impeccable's static scan reports local palette, radius and type
steps against the older design sidecar. The reading format intentionally retains
Finds' warm paper, existing orange marker and compact metadata; its exact type
and spacing choices are specified above.

## Verification

The 2026-11-16 handle-only `design-taste-frontend` pass records `GATE: OPEN 99`
for the full Finds page, with zero waivers. Every open finding is retained in
`.taste-skill/handle-polish/report.md`. Its performance check reports zero failures
and warnings; the original handle geometry and actual homepage hydration were
verified. The whole-page findings were not counted as passes for this material edit.

- Node 22: `node scripts/check-finds.mjs`, `node scripts/check-inspired-credits.mjs`,
  `pnpm exec tsc --noEmit`, `node scripts/check-step-sound.mjs`,
  `node scripts/check-drawer-flight.mjs`, `node scripts/check-finds-scrubber.mjs`,
  `node scripts/check-finds-read-tab.mjs`.
- `node scripts/check-vite-cache.mjs`: production build succeeds and preserves all
  42 warm development optimizer files.
- `scripts/probe-finds.js`: run in the hydrated Finds page's browser context.
  Covers original source links, populated drawers, connected reading, cross-drawer
  navigation, reading-path retention, shared-card identity, rapid latest-choice
  switching, copy cleanup and Escape returning before leaving Finds.
- `scripts/probe-finds-reader.js`: real-source and sample formats, quote paragraphs,
  source metadata, omitted empty sections, connected-card addresses and reading path.
- `scripts/probe-held-scrubber.js`: run after a native fast drag while keeping the
  pointer down and still; the selected paper must return to its 160-unit lift.
  Before the live velocity fix it remained at 250. Native pointer tests also verify
  7px ruler tracking, soft limits, release snapping, trackpad input, vertical scroll
  and focus / drawer-change cancellation.
- `scripts/probe-drawer-switch.js`: the reported upper-row sequence, active-drawer
  replay, shared-source extraction and lower-row consistency. Before the fix its
  first active All click failed because no leading card launched. The cause was
  the same-drawer early return plus the shared-card flight bypass, not row geometry.
- Open-desk rapid reversals: Chromium and WebKit at 320, 390 and 1440;
  sampled animation frames show no horizontal overflow or contact with the lower
  controls while the rail remains unclipped.
- Isolated Chromium and WebKit at 1440 and 390: source probe, reduced motion,
  homepage entry/return, no leftover flight nodes, preserved homepage scroll,
  chat after the build, and dark-mode Finds.
- Chromium native touch input: horizontal drag, native vertical scrolling on a
  390 × 667 viewport, index scrubbing. Responsive inspection at 320, 390, 768,
  1024 and 1440. Actual iPhone Safari is not tested.
- Reading tab: Chromium and WebKit at 320, 390 and 1440; pixel-following pull,
  partial / sideways release, capture loss, tap, Enter / Space, keyboard takeover,
  light / dark materials and connection to the index. Native Chromium touch tests
  cover pull / cancel / release; both engines cover touch tap, reduced motion and
  closing the homepage overlay while holding the tab.

The unrelated `check-parent-navigation.mjs` reports two controls in Memory because
its regex also matches an Inspired link's `data-selector="[data-parent-navigation]"`
string. Memory and that test were not changed. Finds' real parent control is the
shared `ParentLink`, and both standalone and overlay navigation are verified.

## Design-gate findings retained

The gate treats the index as a marketing landing page and uses axis-aligned
bounding rectangles for the 3D paper scene. Overlapping paper, projecting drawer
faces, and the existing site's compact hierarchy are intentional in the approved
brief. Reading happens on an upright, scrollable paper surface; keyboard and touch
also have explicit controls. The dev-toolbar focus finding is absent in production.
Text contrast and the narrow-phone scale were improved during the three rounds.

All 36 remaining gate findings from the last round are listed below. They are not
silently counted as passes; no blanket waiver was added. Some selectors refer to
the earlier paper wrappers, subsequently removed to match the original sibling
structure and fix WebKit 3D stacking.

| Check | Location | Finding |
| --- | --- | --- |
| hero-fill | main.x-bookmarks-stage > div.x-bookmarks-index > div.x-bookmarks-intro "One thing leads to another." | the next section shows on the first screen: it starts at 138px on a 900px screen (the hero ends at 84px) |
| spill | aside.finds-cabinet-bank > div.finds-drawers > button.finds-drawer:nth-of-type(1) > span.finds-drawer-face "All finds 04" | runs 31px past the bottom edge of the panel it sits on (div.finds-drawers > button.finds-drawer:nth-of-type(1) > span.finds-drawer-box > span.finds-drawer-papers) |
| spill | aside.finds-cabinet-bank > div.finds-drawers > button.finds-drawer:nth-of-type(2) > span.finds-drawer-face "Learning 02" | runs 12px past the top edge of the panel it sits on (div.finds-drawers > button.finds-drawer:nth-of-type(2) > span.finds-drawer-box > span.finds-drawer-papers) |
| spill | div.finds-workspace > aside.finds-cabinet-bank > div.finds-drawers > button.finds-drawer:nth-of-type(3) "Engineering 02" | runs 92px past the bottom edge of the panel it sits on (aside.finds-cabinet-bank > div.finds-drawers > button.finds-drawer:nth-of-type(1) > span.finds-drawer-face) |
| spill | aside.finds-cabinet-bank > div.finds-drawers > button.finds-drawer:nth-of-type(4) > span.finds-drawer-face "Unfiled 01" | runs 12px past the top edge of the panel it sits on (div.finds-drawers > button.finds-drawer:nth-of-type(4) > span.finds-drawer-box > span.finds-drawer-papers) |
| overlap-text | div.finds-rail-scale > div.finds-rail-plane > div.finds-paper-slot:nth-of-type(3) > button.finds-paper "003 / Finds A map of AI engineering @And" | lies over the text "Build context-efficient tools" (button.finds-paper > span.finds-paper-heading) (and 1 more like it: "004 / Finds A saved post") |
| card-visual | div.finds-desk > div.finds-rail > div.finds-rail-scale > div.finds-rail-plane "001 / Finds Start with the hard thing @D" | 4 cards hold only text: no picture, icon, UI fragment or effect in any of them |
| cta | main.x-bookmarks-stage > div.x-bookmarks-index > header.x-bookmarks-header | the hero has no button (the nav's does not count) |
| cta | main.x-bookmarks-stage > div.x-bookmarks-index > div.x-bookmarks-intro "One thing leads to another." | the last section before the footer ends with no button |
| copy-headline | div.x-bookmarks-index > header.x-bookmarks-header > div > h1 "Finds" | "Finds" does not name what is sold (personal card index, personal, card, index, from flags); only the line under it does |
| heading-scale | main.x-bookmarks-stage > div.x-bookmarks-index > div.x-bookmarks-intro > h2 "One thing leads to another." | an h2 at 40px, as large as the h1 (14px) or larger |
| off-grid | div.finds-cabinet > div.finds-workspace > aside.finds-cabinet-bank > div.finds-cabinet-top | left edge at 193px, 7px off the page margin at 200px (4 elements, like div.finds-drawers) |
| off-grid | div.finds-cabinet > div.finds-workspace > aside.finds-cabinet-bank > div.finds-cabinet-foot | left edge at 196px, 4px off the page margin at 200px (4 elements, like p.finds-bank-label) |
| tilt | div.finds-desk > div.finds-rail > div.finds-rail-scale > div.finds-rail-plane "001 / Finds Start with the hard thing @D" | turned in 3D |
| text-contrast | button.finds-drawer:nth-of-type(1) > span.finds-drawer-face > span.finds-label-frame > span.finds-drawer-count "04" | a caption, label or muted line in #766951 on #f0e9d7 reads 4.44:1 (needs 4.5:1); 4 like it, like "02", "02", "01" |
| focus-visible | astro-dev-toolbar | Tab stop 15, astro-dev-toolbar "": the focus lands on something you cannot see |
| moment-none | (the page) | a software page (--type) deals no moment: every kind carries one, two on a long page (moments.md) |
| one-section | main.x-bookmarks-stage > div.x-bookmarks-index "HomeFinds4 cards, a few connections.One " | a <div> sits directly in <main>: every part of <main> is a <section> (SR-4) |
| one-heading | main.x-bookmarks-stage > div.x-bookmarks-index > div.x-bookmarks-intro > h2 "One thing leads to another." | the hero holds an h2 (1): its heading is the h1, and an h2 opens the next section (SR-5) |
| container-edges | main.x-bookmarks-stage > div.x-bookmarks-index "HomeFinds4 cards, a few connections.One " | the content of section 1 runs 200px from the left and 200px from the right (read from its outermost blocks: no .wrap): the margin is 64-120px at 1440px (one container, equal margins, 2px either way) (SR-6) |
| container-edges | div.finds-cabinet > div.finds-workspace > aside.finds-cabinet-bank > div.finds-cabinet-top | a box runs 193-507px, outside the container lines of section 1 at 200-1240px: full width is for background layers and grounds only (SR-6) |
| container-edges | div.finds-cabinet > div.finds-workspace > aside.finds-cabinet-bank > div.finds-cabinet-foot | a box runs 196-504px, outside the container lines of section 1 at 200-1240px: full width is for background layers and grounds only (SR-6) |
| container-edges | div.x-bookmarks-index > header.x-bookmarks-header > div > h1 "Finds" | the h1 starts 1004px right of the container's left: every h1 and h2 starts on it, 2px either way (SR-6) |
| container-edges | div.finds-cabinet > div.finds-workspace > div.finds-desk > p.finds-gesture-hint "Scroll or drag to browseSwipe to browse " | 1 text block starts on a left line at x 787, 587px from the container's left: text starts on the container's left, or on one split line (x 643, 732, 821) (SR-6) |
| container-edges | div.finds-workspace > div.finds-desk > div.finds-desk-heading > span:nth-of-type(1) "All finds" | 1 text block starts on a left line at x 564, 364px from the container's left: text starts on the container's left, or on one split line (x 643, 732, 821) (and 1 more like it: x 451) (SR-6) |
| split-pair | div.x-bookmarks-index > astro-island > div.finds-cabinet > div.finds-workspace "All finds04Learning02Engineering02Unfile" | the two columns of the split start 116px apart at the top (centred on each other): a split's columns are top-aligned, 8px either way (SR-8) |
| overlap-text | div.finds-rail-scale > div.finds-rail-plane > div.finds-paper-slot:nth-of-type(4) > button.finds-paper "004 / Finds A saved post by Addy Osmani " | lies over the text "A map of AI engineering" (button.finds-paper > span.finds-paper-heading) (and 1 more like it: "@addyosmani ↗") |
| collide | div.finds-rail-plane > div.finds-paper-slot:nth-of-type(1) > button.finds-paper > span.finds-paper-heading "Start with the hard thing" | the words "Start with the hard thing" lie over "@DevanshuXi ↗": two lines in one place |
| collide | div.finds-paper-slot:nth-of-type(2) > button.finds-paper > span.finds-paper-number > span "/ Finds" | the words "/ Finds" lie over "003 / Finds": two lines in one place |
| collide | div.finds-rail-plane > div.finds-paper-slot:nth-of-type(2) > button.finds-paper > span.finds-paper-heading "Build context-efficient tools" | the words "Build context-efficient tools" lie over "@pidotdev ↗": two lines in one place |
| collide | div.finds-rail-plane > div.finds-paper-slot:nth-of-type(2) > button.finds-paper > span.finds-paper-source "@pidotdev ↗" | the words "@pidotdev ↗" lie over "@AndrewYNg ↗": two lines in one place |
| collide | div.finds-paper-slot:nth-of-type(3) > button.finds-paper > span.finds-paper-number > span "/ Finds" | the words "/ Finds" lie over "004 / Finds": two lines in one place |
| collide | div.finds-rail-plane > div.finds-paper-slot:nth-of-type(3) > button.finds-paper > span.finds-paper-heading "A map of AI engineering" | the words "A map of AI engineering" lie over "@AndrewYNg ↗": two lines in one place |
| collide | div.finds-rail-plane > div.finds-paper-slot:nth-of-type(3) > button.finds-paper > span.finds-paper-source "@AndrewYNg ↗" | the words "@AndrewYNg ↗" lie over "@addyosmani ↗": two lines in one place |
| collide | div.finds-rail-plane > div.finds-paper-slot:nth-of-type(4) > button.finds-paper > span.finds-paper-heading "A saved post by Addy Osmani" | the words "A saved post by Addy Osmani" lie over "@addyosmani ↗": two lines in one place |
| container | page | no .wrap |
