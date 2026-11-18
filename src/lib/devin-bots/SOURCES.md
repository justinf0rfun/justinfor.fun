# Devin Bot renderer

Adapted from the public implementation at https://devin.ai/bots, retrieved on 2026-11-18. Original character artwork, casing geometry, production-eye motion, expression springs, CRT effects and rendering code are by Cognition.

`vendor.js` retains the original compiled renderer modules and their dependency graph. A local module adapter replaces the site's Turbopack loader; it exports `CognitionBotView`, `getShape` and `loadWebGL2` for the homepage. No Next.js/React application runtime is included. Original source chunks include `1hugnwkba432r.js`, `17svnn4yztf8a.js`, `2gylw8da86gb-.js`, `1-q1r87u2r-lr.js`, `0--ksbq7kxdfi.js`, and `3geanf-v-u0-8.js` under `https://devin.ai/_next/static/immutable/chunks/`.

`casings.json` contains the original six app casing definitions and screen icons. Standard shapes use the renderer's own shape catalog. Static posters in `public/uses/ai/devin-bots/` remain visible while rendering starts or if it is unavailable.

The six small views use the original WebGL2 backend, capped at 2× pixel ratio with a 128px geometry field. They retain the original main-thread geometry fallback instead of the original site's worker bundle. Large scenes should restore the worker path; this integration is limited to six icon-sized views. Offscreen, background, covered and reduced-motion states stop their ambient animation. Dragging stays with the existing physics component; the renderer's independent drag handler is disabled.
