# Parent navigation

Use `src/components/ParentLink.astro` for page-level navigation to a parent. The visible label names the destination, not the current page. Do not use `history.back()` for standalone pages: a direct visit or an external referrer must still return to the correct parent.

- Top-level collections return to `Home` at `/`.
- Thoughts articles return to `Thoughts` at `/thoughts`, through the common `ArticleLayout`.
- The homepage has no parent navigation.
- Dialog dismiss controls, such as Share and photo previews, retain their dialog semantics.

## Standalone page

```astro
<ParentLink label="Home" href="/" />
```

Providing `href` renders a real anchor. Position it at the header's left, with the current title and metadata on the right. The article layout keeps its existing fixed desktop placement.

## Homepage overlay

```astro
<ParentLink label="Home" data-writing-close />
```

Omitting `href` renders a `type="button"` control. Forward the existing overlay's `data-*-close` hook so the folder controller performs its normal history and reverse animation. Do not also navigate to `/`, reload the homepage or add a second close handler. Closed overlays must be inert.

The generic folder stage clones the same component from an inert `<template>` rather than maintaining separate button markup. Its arrow SVG is inline and self-contained so cloned controls never depend on a symbol definition inside another hidden template.

## Appearance and checks

The component owns the 32px avatar, label, avatar-to-arrow hover/focus animation, focus ring, and reduced-motion treatment. Callers own placement; do not duplicate the component's visual CSS or add a second parent/close control for the same action.

## Return sound

The base `Layout` installs one delegated click listener for `ParentLink`, so overlay controls cloned later also work without relying on scripts inside inert templates. It only sounds on trusted activation of `[data-parent-navigation]`. `HomeDock` reuses the same synth for trusted changes between system, light, and dark appearance; selecting the active option, hovering, and automatic OS appearance changes stay silent. Other controls and programmatic clicks remain silent. Each consumer creates its Web Audio context and 30ms noise buffer lazily, with no audio downloads or autoplay.

The synth follows https://ehsandesigns.com/index.html (`app.js`): a sine falls from 170Hz to 110Hz, layered with a 1200Hz low-pass noise transient, ±6% pitch variation, and the original compressor and gain envelopes. Nodes disconnect after 80ms. Overlay navigation starts immediately; same-tab parent links allow 80ms of playback, with a 120ms absolute navigation deadline. Unsupported or rejected audio does not block navigation. Modified clicks retain native browser behavior.

With Node 22, build and run `node --test scripts/check-parent-navigation.mjs scripts/check-return-sound.mjs`. In a browser, also verify a directly opened article → Thoughts → Home, and a homepage folder → Home without a reload. Check the same controls at phone widths.
