# Article standard

All published Thoughts use `src/layouts/ArticleLayout.astro`. The dynamic route only selects the content entry and passes `post` to the layout. Do not add article-specific copies of the navigation or action controls.

## Add an article

Create a Markdown file under `src/content/writing/`:

```md
---
title: The article title
description: A short description used in the article and share preview.
publishedAt: 2026-11-14
draft: false
---

Article introduction.

## Section title

Section content.
```

The filename supplies the `/thoughts/<slug>` path. Drafts are excluded from the article routes and lists. Existing `/writing/<slug>` URLs redirect to Thoughts.

## Included automatically

- The homepage's `HomeNews.astro` capsule links to the latest published Thought using the same publication-date order and draft filter as the list. It expands at the page top and collapses on scroll without taking space from the introduction. Preserve the reference's actual Motion width morph (`32px` → `auto` → `32px`): 200ms opening, text revealed halfway with 50ms staggers, and 180ms closing after a 60ms text-exit lead. Do not replace this geometry with clip-path or scale effects. New articles require no separate homepage announcement edit.
- Article metadata, canonical URL and Open Graph title/description come from the entry and `site` in `astro.config.mjs`. Share links always use the production canonical URL, including during local development.
- `ArticleToc.astro` derives its entries from H2/H3 headings, tracks reading position and expands on hover or keyboard focus. It stays hidden below the desktop breakpoint.
- Below 48rem, `ArticleReadingCapsule.astro` provides a fixed translucent reading capsule: the shared Thoughts parent control, current chapter, and an ellipsis action trigger. It starts hidden and inert, appears once the article title scrolls above the viewport, and hides again on returning to the title. The regular parent control remains in the document for the first screen. Its chapter list expands inside the same surface with an interruptible spring, stays independently scrollable, and closes on selection, outside press, Escape, focus departure, or leaving the mobile breakpoint. `ArticleToc` updates both desktop and mobile chapter indicators; headings account for the capsule and safe area.
- The reading capsule entrance follows the public Dots `DotsSubNav` source: vertical keyframes −180px → 72px → 0 over 1091.6ms after 85ms, a centered 58px circle revealing the material after 558ms over 509ms, and a 24px ring mark moving from center to left. The centered chapter control uses the original navigation-link fade (630ms delay, 577ms duration); Share uses the original CTA fade (586ms delay, 430ms duration) and its coupled 32px sinusoidal stretch. Preserve the per-stage easing curves and matching `calc()`/`var()` slots in both clip-path endpoints: simplifying only one endpoint corrupts Motion's complex-value interpolation into a rectangular inset. The fixed wrapper and inline-size container stay still; only the navigation moves. Keep the surface separate so revealing it does not stretch text. Exit fades over 150ms; interrupted runs cannot re-enable or hide a newer run. Reduced motion reveals immediately.
- The drop uses the original black ring SVG throughout; only after the entrance completes does it crossfade to the personal avatar over 120ms. Initialize clip, opacity and transforms synchronously before making the wrapper visible, rather than relying on delayed animation keyframes. During entry, keep the moving capsule's overflow visible: a clipping ancestor can square off the clipped backdrop in the browser compositor even when computed clip-path values are circular. Enable parent clipping with `data-entry-ready` only once entry finishes, for chapter expansion. Verify normal-playback startup frames; seeking a paused animation skips initialization bugs.
- `ParentLink.astro` supplies the shared avatar-to-arrow return control, targeting `/thoughts`. Follow `docs/navigation.md` for other page levels and overlay behavior.
- `ArticleActions.astro` provides Share, Ask AI and Copy as Markdown at the desktop's lower left, and after the article on tablet widths. Below 48rem the same DOM becomes a native auto popover, opened by the reading capsule's ellipsis: Share, Ask AI, Copy as Markdown, and Copy link. Group the copy actions separately. Ask AI switches to a second level inside the same panel; its header returns to the main actions. Copy success stays in the row, while failures show the existing status message. Native light dismiss and Escape close the popover; opening the chapter list or returning to the page title also closes it. The popover and the Share dialog are separate surfaces, and closing Share restores focus to the ellipsis. Resizing to desktop restores the original action layout; do not duplicate action markup, Markdown templates, or app-launch handlers for mobile.
- `ArticleShareDialog.astro` provides the animated paper preview, X/LinkedIn/Bluesky/Email destinations and Copy link. It supports Escape, outside dismissal, native modal focus containment and focus restoration.
- Ask AI offers Claude, ChatGPT and Grok Bot, with a prompt containing the public article URL. It is an external handoff, not an embedded AI integration.
- Markdown copying uses the original Markdown body, plus the title, description and source URL. The body is escaped into a `<template>`, not converted back from rendered HTML or interpolated into executable JavaScript.
- Copy success changes the icon for two seconds and announces a status. Clipboard failures show an error instead of success.
- Dialog and disclosure motion respects reduced-motion preferences. The article sidebar reserves space for the action controls, including expanded Ask AI options.
- Thoughts navigation uses the Ehsan reference's blur-and-rise handoff: exit upward 8px with 5px blur in 160ms, then enter from 14px below in 600ms. `thought-transitions.css` customizes the existing native cross-document transition for Thoughts routes, including parent links and browser back/forward; it does not install a client router. Unsupported browsers keep normal navigation. Desktop preview changes reuse the same timing through `createThoughtTransition`; rapid selections cancel stale swaps and continue from the current visual state. Keyboard preview selection and reduced motion are immediate. New articles inherit both paths automatically.
- Opening the homepage Thoughts folder keeps the list overlay's fade. Below 48rem, hide its disposable `.writing-flight` paper while the overlay is open, and the complete source folder while `is-writing-source-hidden` owns the handoff: its small paper and rotating cover otherwise flash over the phone's text-only timeline. Preserve the source layout for closing geometry. Desktop paper travel, other folder types, and article-to-list navigation keep their existing transitions.

## Verify

Use Node 22:

```sh
pnpm build
pnpm exec tsc --noEmit
node --test scripts/check-article-sharing.mjs scripts/check-article-actions.mjs scripts/check-ai-app-links.mjs scripts/check-thought-transition.mjs scripts/check-reading-capsule.mjs
```

Also check Share open/close, Escape and focus restoration, Ask AI open/close, both copy controls, and the small-screen placement in a browser. At phone widths verify all four actions, the AI back control, chapter/menu mutual exclusion, and resizing back to desktop. Verify fresh reload too: phone actions must already be hidden by CSS before JS attaches `popover`, otherwise the initial transition from a visible block to a closed popover flashes its exit animation. Do not send a social post or AI prompt as part of verification; inspect the generated destination URLs.

The mobile action popover disables its unused `::backdrop` with `display: none`. Safari on iOS 26 otherwise treats even the transparent backdrop as a dimming layer and fills the status-bar area with a solid page color, hiding the article text behind it. Keep native `popover="auto"` dismissal; this rule applies only to the action menu, not the Share dialog's modal backdrop. In iPhone Safari, compare text behind the status bar before and after opening the ellipsis, then check outside dismissal and Share separately. This was reproduced on the iOS 26.4 simulator; disabling only this backdrop preserved the same top text pixels and scroll position. See [WebKit's backdrop sampling change](https://github.com/WebKit/WebKit/pull/52753).

Reference interaction: https://noechague.com/writing/make-your-design-system-ai-ready

Page handoff reference: https://ehsandesigns.com/index.html (`app.js`, `mo` exit and `On` entrance). Check desktop preview selection, Open → article → Thoughts, browser back/forward, and mobile list → article → list; native transitions require a supporting browser. The CSS entrance easing approximates GSAP's `power3.out` without adding a second animation runtime to navigation.

Reading capsule entrance reference: https://chatgpt.com/features/dots/ — public `DotsSubNav` module `/cdn/assets/ce99d8dd-a2d8bec223d945adb0e0e.js` and `/cdn/assets/dots-scenes-205172f2d475.css`. These were inspected as source; retain our article-specific controls and chapter expansion rather than the marketing navigation contents.

Original ring artwork: https://images.ctfassets.net/8su2tbn87fck/6bOZMmGgntTC2XvtbGgBxZ/5ed7a3900b567a83f4f31707f97108d4/dots-o-icon-updated.svg (inlined in the reading capsule).

## App-first AI handoff

Websites cannot enumerate installations of third-party apps. The Get Installed Related Apps API requires a verified relationship between the site and the app; it cannot detect arbitrary Claude, ChatGPT or Grok Bot installations.

On an unmodified desktop click, the shared launcher attempts the provider's documented app URI. If the page remains visible and focused for two seconds, it navigates to the HTTPS fallback. A blur, hidden page or page departure cancels that timer so returning from an app does not unexpectedly open a website. A browser confirmation can also cause blur, so this is a best-effort handoff, not installation detection or confirmation that the app opened. The globe link beside each provider always opens the HTTPS destination directly, including after a cancelled browser prompt. Modified clicks retain ordinary web-link behavior.

- Claude Desktop: `claude://claude.ai/new?q=...`; fallback: `https://claude.ai/new?q=...`.
- Current ChatGPT Desktop: the officially documented compatibility scheme `codex://threads/new?prompt=...`; fallback: `https://chatgpt.com/?q=...`. Do not invent a `chatgpt://` prompt route or assume older clients accept this current desktop protocol.
- Grok Bot: `grokbot://app/v1/prompt?text=...`, documented for desktop and mobile. It requires sign-in and a configured primary Bot, and pre-fills rather than sends the message. At the user's explicit choice, its fallback is ordinary Grok web chat (`https://grok.com/?q=...&autoSubmit=false`), carrying the same article prompt. These are different products, so the globe link's accessible label and tooltip state that distinction. Do not substitute Grok web chat for Grok Bot elsewhere without approval.

Claude and ChatGPT's verified custom protocols here are desktop protocols. Phones and iPad desktop mode keep their HTTPS links, allowing OS/vendor app-link handling where supported and a normal website otherwise. Do not claim guaranteed native handoff on these mobile paths. Test actual launches separately on target devices and client versions; a simulated visibility change only tests timer cancellation.

Primary sources:

- https://developer.chrome.com/docs/capabilities/get-installed-related-apps
- https://support.claude.com/en/articles/14729294-open-claude-desktop-with-a-link
- https://learn.chatgpt.com/docs/app/commands
- https://docs.x.ai/grok-bot/deep-links
- https://docs.x.ai/grok-bot/faq
