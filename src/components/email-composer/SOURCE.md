# Email composer

Adapted from Laura Beatris' public website repository:
https://github.com/LauraBeatris/laurabeatris.com/tree/80d63ae45b5cb6f0906148696d26cc3f9284b779

Original files:

- `components/email-me.tsx`: composer, field order, IME-safe shortcuts, draft
  preservation, visual-viewport keyboard handling and touch-sheet dismissal.
- `components/send-button.tsx`: original SVG geometry, cubic-bezier morph and
  morph/open/sealing/waiting/plane/flown sequence, including its original timings.
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
or real delivery. The preview retains the original envelope morph, letter insertion
and sealing. The same paper plane returns to the Dock while the window closes;
its receipt shows “Preview complete.” Closing cancels
pending preview timers; reopening preserves the in-memory draft. A page reload
or navigation clears it. The hidden honeypot and real delivery error handling
are omitted because no delivery route is implemented.

## Local refinements

`HomeEmail.tsx` keeps the lifecycle; `email-composer.ts` holds paper-to-button
geometry and flight frames. The original send button hands off its plane drawing
at the flown stage: desktop uses a 720ms arc, mobile a shorter 520ms arc. A
generation guard cancels obsolete returns and their completion feedback.

The desktop window reveals from the native Dock pill with a clip and translation,
so text does not stretch. Closing follows the same path and can reverse midway.
Mobile retains the touch sheet. Draft text adds a paper edge to the Dock icon,
without storage or changing the Dock's width.

The header combines the recipient and avatar under “Write to Justin.” Fields and
body use 16px type; two aligned field labels and the header/body rules establish
hierarchy. Preview status stays beside Send. These component refinements apply
design-taste-frontend's hierarchy, alignment and purposeful-motion guidance inside
the incumbent interface, without changing page scaffolds or marketing assets.

Run `node --test scripts/check-email-composer.mjs scripts/check-dock-scroll.mjs
scripts/check-dock-bubbles.mjs`, typecheck and build with Node 22. Verify the
hydrated homepage after the build, including Chat, Moments, theme changes,
keyboard/IME navigation, repeat opening, mobile dismissal and reduced motion.
