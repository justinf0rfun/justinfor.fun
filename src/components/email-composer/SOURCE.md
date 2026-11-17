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
or real delivery. The local preview plays the original animation, labels the
result “Preview complete,” and closes after its original linger. Closing cancels
pending preview timers; reopening preserves the in-memory draft. A page reload
or navigation clears it. The hidden honeypot and real delivery error handling
are omitted because no delivery route is implemented.

Run `node --test scripts/check-email-composer.mjs scripts/check-dock-scroll.mjs
scripts/check-dock-bubbles.mjs`, typecheck and build with Node 22. Verify the
hydrated homepage after the build, including Chat, Moments, theme changes,
keyboard/IME navigation, repeat opening, mobile dismissal and reduced motion.
