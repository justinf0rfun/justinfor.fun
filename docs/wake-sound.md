# Wake Slider feedback

Reference: [Bencho Wake Slider](https://bencho.dev/?c=wake-slider&theme=light).
The live demo calls `notch` on a new bar with a 28ms minimum gap and a pitch
multiplier of `0.75 + position * 0.75`. Its public demo parameters are recreated
in `src/lib/wake-sound.ts`: a 230Hz sine, 820Hz lowpass, 0.048 peak gain,
6ms attack, 49ms envelope and 20ms silent tail. No audio file or sound library is
bundled. The existing Bencho notice remains in `src/components/bencho/LICENSE`.

One lazy context serves the Moments ruler and desktop article TOC. Trusted
pointer, touch and keyboard gestures unlock it without playing a note. Hover
before the browser permits audio stays silent; failed resumes never queue notes.
The existing return and theme click sound remains separate.

Moments plays on minor tick crossings during a real drag or manual touch scroll,
including touch inertia. Initialization, resizing, programmatic selection and
opening or closing Moments stay silent. Article navigation plays once per real
mouse entry into a row on a device that supports hover; reading progress does
not trigger it. Both paths share the reference's 28ms sound limit.

Run `node scripts/check-wake-sound.mjs` for envelope, lifecycle and TOC gesture
checks. Browser validation should use real pointer/touch input and confirm that
stationary dragging and programmatic scrolling produce no additional notes.
