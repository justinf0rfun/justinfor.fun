# Writing article design QA

## Comparison target

- Source visual truth: `/var/folders/cy/phjw7_zs54n14bzw2t3qm73m0000gn/T/codex-clipboard-b747583d-285a-4afe-9c2e-35cec9221564.png`
- Supporting collapsed-state source: `/var/folders/cy/phjw7_zs54n14bzw2t3qm73m0000gn/T/codex-clipboard-f24f12f8-47b1-4fdd-88ad-6cb24fe67290.png`
- Browser-rendered implementation: `/tmp/writing-implementation-desktop.png`
- Combined comparison: `/tmp/writing-reference-comparison.png`
- Route: `http://localhost:4322/writing/how-tanstack-start-became-my-default-framework`
- Viewport: desktop `1280 × 720` CSS px for final interaction checks; mobile `390 × 844` CSS px for responsive checks.
- Source pixels: `2550 × 1384` and `2526 × 1150`. Implementation pixels: `1280 × 720` final capture and `390 × 844` mobile capture. The combined comparison uses a same-height crop for composition review; exact navigation measurements came from the recovered production CSS rather than inferred screenshot scale.
- State: article scrolled to an H2; TOC checked both collapsed and pointer-hover expanded.

## Full-view comparison evidence

The article preserves the reference's narrow `43.25rem` reading column, quiet neutral canvas, fixed vertically centred left navigation, restrained typography, and section-led rhythm. The local site keeps its own existing back-to-Writing control and SF Compact type family; these are intentional product-world differences outside the requested TOC clone.

The TOC itself uses the recovered source parameters: `15.25rem` width, `24px` rows, `16px` horizontal padding, `8px` row radius, `22px` H2 ticks, `12px` H3 ticks, `1.5px` tick height, `13px` labels, `200ms` opacity crossfade, `#202020` active ink, `#747474` labels, `#d9d9d9` ticks, and `#f6f6f6` hover fill. It appears at `1280px` and wider, as on the reference.

## Focused region comparison evidence

- Collapsed TOC: tick opacity `1`, label opacity `0`.
- Expanded TOC: tick opacity `0`, label opacity `1`.
- Scroll/click state: clicking `Server work stays explicit` sets the matching hash, places the heading at about `80px` from the viewport top, and leaves exactly one `data-active="true"` / `aria-current="location"` entry.
- Mobile: TOC is hidden, document horizontal overflow is `0px`, and the article uses the full narrow reading width without clipping.

## Required fidelity surfaces

- Fonts and typography: matching source scale, line height, weights, truncation, and hierarchy; the site's existing SF Compact family is intentionally retained.
- Spacing and layout rhythm: source column width, section spacing, TOC row metrics, fixed position, and hover radius are matched. Mobile layout remains a single readable column.
- Colors and visual tokens: TOC neutral palette and hover/active states match the recovered source values; the page canvas retains the existing site token.
- Image quality and asset fidelity: the requested effect contains no image assets. No placeholder image, custom SVG, emoji, or CSS illustration was introduced.
- Copy and content: article copy is authored as real English editorial content; navigation labels are generated from Markdown H2/H3 headings.
- Accessibility: semantic navigation, real anchor links, `aria-current`, keyboard focus styling, and native hash navigation are present. Mobile removes the nonessential fixed TOC rather than compressing it.

## Comparison history

### Pass 1

- [P1] Active-state implementation used `toggleAttribute`, which could serialize inactive entries as present empty attributes and make the CSS presence selector treat every item as active.
- Fix: set `data-active="true"` only on the current entry and delete the dataset property from all others.
- Post-fix evidence: browser check reports one active item, one `aria-current` item, and `0` empty active attributes after TOC navigation.

### Pass 2

No remaining actionable P0, P1, or P2 differences were found in the requested TOC behavior. The combined visual comparison confirms the same navigation silhouette and reading-column composition; desktop hover, hash navigation, mobile behavior, and console were tested. Browser console errors/warnings: none.

## Implementation checklist

- [x] Markdown content collection and generated article route
- [x] Writing index backed by the collection
- [x] Source-matched H2/H3 TOC minimap
- [x] Hover/focus expansion and active scroll tracking
- [x] Desktop and mobile browser verification
- [x] Clean browser console and zero horizontal overflow

## Article return control follow-up

### Comparison target

- Source visual truth: `/tmp/alcove-return-rest.png`, captured from `https://tryalcove.com/` at the return control.
- Browser-rendered implementation: `/tmp/article-return-rest.png` and `/tmp/article-return-hover.png`.
- Combined comparison: `/tmp/article-return-comparison.png`.
- Responsive evidence: `/tmp/article-return-mobile.png`.
- Viewport and density: focused desktop regions are `300 × 150` pixels at `1×`; the responsive capture is `390 × 180` pixels from a `390 × 844` CSS viewport at `1×`.
- State: source rest state; implementation rest, pointer-hover, keyboard-focus CSS parity, and narrow-screen rest state.

### Focused comparison evidence

The return control keeps the article's existing fixed/inline placement and site typography, while reproducing Alcove's interaction model with the real Justin avatar: the avatar layer exits left at `translateX(-100%) scaleX(.5) scaleY(.75)` and `25%` opacity; the library-provided bold arrow enters from `scale(.5)` and `2px` blur to full size and sharp opacity after a `50ms` handoff. Both phases use the recovered `300ms` ease-out timing.

The implementation intentionally scales the source's `40px` brand icon down to the site's quieter `36px` navigation slot. The label remains `Writing`, because this control returns to the Writing index rather than the site root.

### Required fidelity surfaces

- Fonts and typography: the source's bold wordmark is adapted to the site's existing `15px` medium-small navigation label; no new font was introduced.
- Spacing and layout rhythm: icon-to-label spacing, contained morph, and fixed desktop position align with the existing article shell; mobile remains inline with zero horizontal overflow.
- Colors and visual tokens: the control uses the site's neutral ink and white surface, preserving contrast in both avatar and arrow states.
- Image quality and asset fidelity: the real `/justin-avatar.png` is used. The arrow comes from the installed Phosphor icon library; no custom SVG, CSS drawing, or placeholder was introduced.
- Copy and content: `Writing` and `Back to writing` preserve the route's existing semantics.
- Accessibility: the control remains a real link, has an accessible label, uses the same morph for `:focus-visible`, and keeps a visible focus outline.

### Comparison history

#### Return-control pass 1

No actionable P0, P1, or P2 differences were found within the requested interaction scope. Browser measurements confirm a `36 × 36` icon slot, sharp full-opacity arrow on hover, avatar matrix equivalent to the recovered exit transform, and zero desktop/mobile horizontal overflow. Browser console errors/warnings: none.

## Follow-up polish

- [P3] The implementation keeps the existing site background and article placement instead of cloning Alcove's peach page chrome. This is intentional: the requested target was the return interaction, not its surrounding brand system.

final result: passed
