# Resume

`/resume` is an English translation of the supplied resume, without the identifying
header. Do not publish the original PDF, name, phone, email or GitHub profile.
The route is unlisted, has `noindex, nofollow`, and has no homepage or credits-panel
entry. Unlisted does not mean access-controlled.

## Content and layout

The content is maintained in `src/data/resume.ts` and `src/components/Resume.tsx`.
Keep the source's dates, scope and numerical claims; do not infer currency for
the earlier employer's sales figure, or invent descriptions of independent work.
The earlier employer's English name is a descriptive translation, not a verified
registered English company name.

The design-taste-frontend skill guides the factual copy, hierarchy, equal edges,
spacing and responsive checks. This is a resume inside the existing site, so the
incumbent system typeface, neutral sheet and source orange take precedence over
random marketing palettes, stock photographs, decorative scenes, mandatory sales
actions and fixed-height marketing sections. The two explicitly requested source
interactions take precedence over the skill's general no-copy/no-scroll-spy rules.
The introduction follows its content height; do not stretch it to the viewport or
push its footnote to the bottom, which creates a large empty area on tall windows.

## Interaction provenance

Reference: https://devouringdetails.com/home#structure (Rauno Freiberg).
Public, deployed frontend inspected on 2026-11-17:

- `https://devouringdetails.com/_next/static/chunks/9888-707befb8c3d2765e.js`
  - module 59888, `N` / `F`: vertical minimap and tick interaction.
  - module 19002, `w` / `j` / `I`: lerp, quadratic tick response, major ticks.
  - module 76198, `s` / `r`: active section at 40% of viewport height.
  - module 59888, `es` / `ed` / `ew`: shared `home-indicator` layout animation.
- Homepage CSS: 1px ticks; 24/40px widths; 8px gaps; 36 marks; 315px travel;
  orange `#ff670d` / `color(display-p3 .99 .4 .02)`; gray `#8f8f8f` / `#171717`.

The TypeScript port uses the existing `motion/react` dependency. It retains the
original equations, spring settings (650/40, 600/45, 240/30), per-frame .5 lerp,
48px tick response radius and velocity / 300 reset. The shared marker travels
between the introduction and section headings. Original mobile behavior hides
the ruler below 960px while retaining the full-width line and moving marker.

Adaptations: resume content replaces the sales page; the unrelated registration
CTA is omitted; the line is clipped to the viewport width; initialization, resize,
restored scroll, short documents, reduced motion and print are handled. No raw
authoring repository was provided: this is a port of the deployed public code,
not a claim of access to the creator's original development repository.

Check with Node 22: `node --test scripts/check-resume.mjs`, `pnpm exec tsc --noEmit`,
then desktop/mobile scroll, marker transitions, rapid reverse scroll, direct
hash loading, resize, keyboard navigation and reduced motion in a browser.
