# Floating Holo pack

`HomeRideCoupon` mounts once on the homepage. Its local same-origin iframe retains
the original Holo CSS, artwork, tear handler, native pointer capture and sound
engine. `public/holo/SOURCE.md` records the source and adaptations.

The host waits one second after mounting, then starts the original entrance once
the frame is loaded and the homepage is visible. It
reveals the first painted pose, rather than waiting for the 950ms settle event.
During entry the resting crop is removed and the preview bleeds to the screen's
right edge; the original rotation and spring parameters remain unchanged.

The floating wrapper receives real native drag/touch input directly, including
half tears. There is no click overlay blocking its original hit target. On release
the same iframe becomes a viewport-sized foreground overlay, with the homepage
still visible through the dimmed, blurred background. It never navigates or opens
a new page. The runtime waits for the real full viewport before running the
rainbow, confetti, original five-card launch/orbit and responsive fan. Compact
preview effects are suppressed so they cannot expose a small clipping rectangle.
The source's replay button stays in the foreground; Close or Escape restores the
floating pack without remounting its frame.

Tear completion requests the foreground automatically. Pointer up, cancellation,
lost capture and window blur all use the original `letGo` end path, which releases
capture and notifies the host once. There is no separate held-pointer flag that
can strand a fully torn pack while waiting for a missed event.

The original card art, frames and five characters are retained. The title slots
show the DiDi logo, with coupon descriptions and claim labels below. Pointer
and touch activation focuses the dialog title instead of Close, so no blue focus
circle is forced onto the close button. Keyboard navigation keeps its focus cues.

`src/data/ride-coupon.ts` maps separate HTTPS URLs to `blip`, `cubit`, `facet`,
`ringo` and `nova`. Stable card identity, rather than shuffled position, determines
the link. All five currently use the supplied DiDi offer, including its
`ref_from=dunion` parameter. Empty links retain the original collectible interaction; no fake claim
button or discount is shown. Parent/frame messages check origin and source.

Other homepage surfaces hide/pause the floating pack. Hidden tabs also pause it.
Inspired keeps it visible but still; grabbing the wrapper resumes it and dismisses
the inspector. The compact pack moves above the footer on small screens.

Run `node scripts/check-ride-coupon.mjs` for URL mapping checks, and evaluate
`scripts/probe-ride-coupon.js` on the homepage for foreground viewport geometry,
five original cards, no clipping box, focus and reset behavior.
`scripts/probe-ride-coupon-entrance.js` checks the first visible pose, screen-edge
bleed and continued motion before the entrance settles.
