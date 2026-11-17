# Dots character renderer

Reference: https://chatgpt.com/features/dots/

This directory adapts the public Dots character implementation to the project's
installed Three.js and Motion dependencies. It does not load ChatGPT's application
runtime, React compiler cache, React Three Fiber, account state or remote scripts.

| Local module | Public source |
| --- | --- |
| `character-core.js` | https://chatgpt.com/cdn/assets/c00ae0a6-257d3e1c1190ff4d35547.js |
| `fur.js` | https://chatgpt.com/cdn/assets/99299f16-86bacaf2e1079da489c5b.js |
| `selection.ts`, renderer choreography | https://chatgpt.com/cdn/assets/d7906bef-0b874f1ac50fb132fddda.js |
| `postprocess.js` | https://chatgpt.com/cdn/assets/21c2b846-d8a84d7604b862bba1623.js |
| Neutral O torus | https://chatgpt.com/cdn/assets/c871dc1d-ac4a7b42c50206d051098.js |
| Color resolve | https://chatgpt.com/cdn/assets/b093033a-7ce364afacb01375a7f48.js |
| Popup background material (`.dots-sub-nav-surface`) | https://chatgpt.com/cdn/assets/dots-scenes-205172f2d475.css |
| Navigation theme tokens | https://chatgpt.com/cdn/assets/root-93849dd4e63a.css |
| Current navigation page module | https://chatgpt.com/cdn/assets/dots-custom-page-7f4198af.js |
| Navigation structure (`DotsSubNav`) | https://chatgpt.com/cdn/assets/ce99d8dd-a660194fa9a59e587679e.js |

The popup uses the source navigation material: `color-mix(in srgb,
var(--bg-elevated-secondary) 80%, transparent)` and `blur(140px)` for both
backdrop-filter declarations. The source light token is `#f3f3f3`; Dots overrides
the dark token to `#212121`. The popup keeps its own connected Dock geometry.
The Dock ports the navigation's separate absolute surface and isolated relative
parent, keeping the source background expression and both backdrop filters.
The surface inherits the existing Dock radius instead of the source's 29px radius.
Light/dark map to the original #f3f3f3/#212121 tokens. These declarations were
re-fetched from the live CSS and theme stylesheet; no screenshot tint is applied.
The translucent result depends on the content behind it, including the source
navigation's video backdrop. Dock text, dividers and interaction states follow
the same effective theme as the page.

The URLs contain build hashes and may change. Model, poster and font provenance is
recorded in `public/moments-reference/sources.json`. Character names in the GLB
files differ in places: Iggy's rig uses `Jojo` / `jojo` internally.

The adapted N8AO implementation is based on N8python's N8AO:
https://github.com/N8python/n8ao . The official CC0 license is retained in
`N8AO.LICENSE`. Three.js and Motion retain their own package licenses. This
attribution does not relicense OpenAI's character artwork or other source.

## Deliberate integration changes

- Reuse the installed `three` exports and `motion` spring generator.
- Remove the source site's application providers, loading worker and React Three
  Fiber wrappers; use one independently owned WebGL canvas.
- Generate fur textures locally with the original deterministic seeds and LOD.
- In the source MRT compatibility class, remove the legacy array-valued `.texture`
  getter: Three r187 expects `.texture` to be the first attachment; N8AO accesses
  multiple attachments through `.textures`. Keep `RedFormat` as a format constant.
- Keep the original rig channels, six-second ambient sampling, selection spring,
  fur parameters, lighting, camera zoom and exposure, AO and transparent resolve.
- Closed Dock warms Alfred only; opening warms the remaining models. The canvas
  moves between its Dock and scene slots without remounting the renderer.
- The approved Dock adaptation adds a 1.25 CSS-pixel idle lift and one response per
  mouse entry. It leaves the source rig values intact, fades out during travel,
  and contributes zero extra motion on the stage or with reduced motion enabled.
- Honor reduced motion, pause while the document is hidden, and keep a local poster
  when WebGL or an asset cannot load. GPU errors stay local to this character view.

Run `node --experimental-strip-types scripts/check-dots-characters.mjs` and
`node scripts/check-dots-postprocess.mjs` after changing these adaptations. The
second check exercises all twelve render-target handoffs and would catch the
Three r187 MRT incompatibility before a poster silently hides it.
