Graphical hero reference collection + Justin intro demo

Source: https://www.graphicalui.com/
Scope: all 16 changing states in the circled introductory headline, not the lower editor/product demonstrations.

Inventory
  3 concepts: themes, systems, languages
  8 details: components, colors, type, spacing, icons, effects, states, motion
  5 tools: ChatGPT, Claude, Cursor, Grok, anything

manifest.json records all assets, source URLs, SHA256 checksums and fonts.
artwork/ contains original SVG/HTML+CSS artwork, standalone previews and interaction.json.
agents/ contains original image bytes and the extracted ChatGPT sticker frame.
fonts/ preserves the three original font files for reference; Aa needs the Semibold face.
extract/ contains the isolated artwork extraction script.

Demo (from repository root, using Node.js 22):
  node design-references/graphical-hero/demo/serve.mjs
  Open http://127.0.0.1:4324/

Build check:
  node design-references/graphical-hero/demo/serve.mjs --build

The independent demo uses the site's existing React, Motion and GSAP dependencies.
Torph 0.1.3 is copied from the official npm package; its two ESM entry files and MIT license are in demo/vendor/torph.
Its TextMorph is actually running, not replaced with a crossfade.
The demo's capsule wrapper is adapted to Justin's copy and original artwork; source animation parameters are preserved in artwork/interaction.json for comparison.

Proposed copy:
  I turn ideas into [agents / products / tools]
  and build [playful things / useful things / things for fun] with help from [Claude Code / Codex / Grok].
Assets map respectively to systems/themes/icons; colors/states/effects; claude/chatgpt/grok.
The expandable inventory retains every original state even when unused by this proposed sentence.

Production homepage and dependency manifests were not modified.
Graphical's artwork and GT Standard font files are collected as references; their reuse/redistribution license has not been established. They are not added to the production public directory or deployed by this demo.
