# Bubble Navbar → Dock

Reference: https://bubblenavbar.yashb.xyz/
Public implementation inspected in:
https://bubblenavbar.yashb.xyz/_next/static/chunks/10btvqndm073..js

The original component keeps separate hovered and selected items. Pointer entry
changes the hover target; leaving restores the selected target. Its two shared
layout layers use these exact Motion springs and materials:

| Layer | Spring | Material |
| --- | --- | --- |
| `nav-bubble` | stiffness 500, damping 35 | white at 10%; inset `0 1px 2px rgb(255 255 255 / .2)` |
| `nav-bubble1` | stiffness 500, damping 30 | white; inset `0 1.5px 2px rgb(0 0 0 / .5)` |

`DockBubbles.tsx` adapts those layers, fallback rule and spring parameters. The
existing Astro buttons remain mounted with their original event handlers. Since
they are not Motion buttons, the two layers are portaled into their shared track
and Motion animates their measured x/y/width/height. Measurements are converted
back to Dock coordinates so the existing scroll-to-compact scale is applied once.
ResizeObserver follows the expanding email label and responsive Dock layout.

Selected state comes from the real Say hi / Moments `aria-expanded` attributes;
email and appearance are actions, so they never become a persistent selection.
Touch shows the gray layer only while pressed, and keyboard/reduced-motion updates use zero duration.
The theme dial's own eclipse and page transition remain unchanged.

Button padding borrows from the existing gaps with equal negative margins. This
adds usable pill interiors while retaining the bar width and content positions.
On mobile, hidden chat controls also hide both bubble layers during the existing
Dock-to-chat morph. No additional navigation item or dependency is introduced.

The served page did not include a license notice; no MIT license is asserted.
Attribution is included in the homepage Inspired list.

## Glass material

Reference: https://xiangyidesign.com/project
Live public assets inspected:

- https://xiangyidesign.com/assets/index-BGSxTweO.js (`g3` outer material)
- https://xiangyidesign.com/assets/index-CaymMHEg.css (`.dock-switch:after` selected material and theme tokens)

Both Dock themes use the original #bbbbbc glass at 12%, blur(8px), saturation
150% and all ten outer shadow/reflection layers. The selected bubble uses the
original 36% glass and seven shadow/reflection layers. Light/dark reflection
factors remain 1/1 and .3/2. Source layout, content and navigation actions are
not imported; existing Dock dimensions, responsive behavior and Bubble Navbar
springs remain. The old Dots surface and full-width footer fog are removed.

The native theme icon cuts its system half through the SVG mask so real glass
shows through, instead of painting an opaque background-colored patch.
