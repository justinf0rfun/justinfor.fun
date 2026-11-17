# What I Use shelf

Ported from the production ThingsShelf implementation at
https://www.ashwinexe.com/things:

- https://www.ashwinexe.com/_next/static/chunks/app/(pages)/things/page-fd9a8dfbe0616851.js
- https://www.ashwinexe.com/_next/static/css/5a48a76fec8f7cdb.css

The component retains the source alternating 4/3 and 3/2 flex rows, two-column
phone layout, container-relative object sizing, pointer tilt/floor offsets,
900px perspective, -9px/1.03 hover, and AnimatePresence popLayout filtering with
260/32 springs and 280ms fade/scale/blur. Data, artwork, fonts, captions and theme
tokens come from this site. There is no Next runtime or source product inventory.
The standalone shelf keeps the 500ms rise entrance; the homepage overlay uses
its existing folder handoff instead of moving targets during the logo flight.
The source's current original TSX was not available in the related public repo;
this is an adaptation of its inspected production JS/CSS, not an untouched TSX export.

The native Grok SVG stays mounted in a hidden artwork store when filtered out;
its observer, animation state and pointer tracking survive filtering and reopening.
`uses-prepare` synchronously restores All and a fresh Motion list before homepage
folder entry. Folder targets are queried live; filtered-out preview icons return
inside the folder rather than flying from detached DOM positions.

Keep ParentLink, overlay/standalone modes and data-use-* handoff hooks. Wishlist
and source product links are not added. Hardware keeps its own images and metadata.
Transparent PNG bounds are measured from the existing alpha channel and applied
as a CSS crop; source image files are not edited. This removes empty margins from
the object-size and floor calculations. The three existing JPEG photographs stay
photographs rather than being presented as invented transparent product renders.
