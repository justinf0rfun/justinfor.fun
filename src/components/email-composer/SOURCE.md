# Email composer

Adapted from Laura Beatris' public website repository:
https://github.com/LauraBeatris/laurabeatris.com/tree/80d63ae45b5cb6f0906148696d26cc3f9284b779

Original files:

- `components/email-me.tsx`: composer, field order, IME-safe shortcuts, draft
  preservation, visual-viewport keyboard handling and touch-sheet dismissal.
- `components/send-button.tsx`: original SVG geometry, cubic-bezier morph and
  morph/open/sealing/waiting sequence.
- `app/globals.css`: original flap/heart, window, mobile sheet and send animation
  rules. Class names are prefixed to avoid affecting other site components.
- `lib/contact.ts`: original field limits and email/invisible-text validation.

The original source is credited; no repository license is asserted here.

## Dock adaptation

The existing native Dock button opens a separately hydrated React island. The
composer is portaled to `document.body`, so the Dock's scale/translation cannot
turn the mobile fixed sheet into a small, clipped panel. Desktop positioning and
the animation origin follow the email button. Dock bubbles and scroll state
include the new expanded state; Chat and Moments close when email opens.

The source theme is scoped to the composer and follows `data-home-theme`. Mobile
inputs remain 16px for Safari, the sheet tracks `visualViewport`, and the native
touch header retains the original 96px / .5px-per-ms dismissal thresholds.
Mobile focus is contained and background scrolling is restored on dismissal.

## Preview only

There is no contact API, fetch, mailto action, third-party sender, persisted draft
or real delivery. The preview starts with the envelope morph, letter insertion
and sealing. A receipt then feeds out in three steps and stays in the composer
until dismissed. It shows the recipient, subject, and “Preview complete.” Closing
cancels pending preview timers. Reopening preserves the in-memory draft. A page reload
or navigation clears it. The hidden honeypot and real delivery error handling
are omitted because no delivery route is implemented.

## Local refinements

`HomeEmail.tsx` keeps the lifecycle and `email-composer.ts` holds paper-to-button
geometry. The send button hands off to the receipt after sealing. The receipt
animation uses a clipped paper track over a compact printer slot, based on the
user’s video reference. Reduced motion shows the receipt in its final position.

While returning, the Dock marks `data-email-returning`. Folder hover handlers
defer layout-generated pointer entry until an actual hover-pointer move, without
blocking clicks or keyboard focus. This prevents stationary pointers over the
old Send position from opening a background folder. Automatic and pointer-led
dismissals restore focus quietly; a real keyboard action clears that temporary
outline suppression, retaining the normal keyboard-navigation indicator.

The desktop window reveals from the native Dock pill with a clip and translation,
so text does not stretch. Closing follows the same path and can reverse midway.
Mobile retains the touch sheet. Draft text adds a paper edge to the Dock icon,
without storage or changing the Dock's width.

The Dock's envelope artwork is a local redraw on a 28px grid, with warm paper
planes, a thin folded edge, flap contact shadow and a clipped letter. Its material
follows the Finds paper cards. It replaces the upstream
outline/heart icon while retaining its hover, expanded and draft meanings.
An orange wax seal has an irregular edge, recessed impression and contact shadow.
It lifts and fades on opening, then settles back after the flap closes. Reduced
motion switches these states without animation.

The header combines the recipient and avatar under “Write to Justin.” Fields and
body use 16px type; two aligned field labels and the header/body rules establish
hierarchy. Preview status stays beside Send. These component refinements apply
design-taste-frontend's hierarchy, alignment and purposeful-motion guidance inside
the incumbent interface, without changing page scaffolds or marketing assets.

Run `node --test scripts/check-email-composer.mjs scripts/check-dock-scroll.mjs
scripts/check-dock-bubbles.mjs`, typecheck and build with Node 22. Verify the
hydrated homepage after the build, including Chat, Moments, theme changes,
keyboard/IME navigation, repeat opening, mobile dismissal and reduced motion.
