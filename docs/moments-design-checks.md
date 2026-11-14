# Moments 集成验收记录

功能与整页设计检查分别记录。整页检查没有全部通过，不将未通过项改写为 PASS。

本轮已通过：类型检查、生产构建、差异检查、日期轴几何、四个骨骼模型及原版动作通道、
毛发、减少动态、可打断换人、后处理十二个渲染目标交接、Dock 19 项、聊天状态 8 项
和聊天 SSR 回归。构建保留 42 个正在使用的开发依赖文件。

浏览器功能探针使用实际构建页面：五角色实际 WebGL 绘制、同一 canvas、前后日期、
收起重开、飞行中反向、保留日期、手机背景锁、焦点正反向循环、键盘立即换人、Esc、
隐藏区域 scroll。1440px / 390px 回归通过，手机的最后一次单独回归也通过。

本地开发服务的保存 DOM 同样显示 `data-renderer="webgl"`。

组件相关 WARN：弹窗打开后的第一次焦点是关闭按钮，通用 skip-link 规则把它当作
不是跳到正文的链接；这是 modal 的预期焦点。

CUA 浏览器控制连接连续超时，已使用指定 skill 的独立浏览器和调试入口。
未读取用户原有浏览器数据。尚未做实体 iPhone / Safari 触摸拖动与逐帧 A/B，
不承诺所有 GPU 逐像素、逐帧完全相同。

下方保留全部整页检查发现及其原始建议。检查包含既有首页结构、文案、外部素材、
全屏营销规则和库代码扫描；本次没有为这些规则重排首页或更改第三方库去迎合扫描。


## Gate

GATE: OPEN 89 (rounds used up)

Effective waivers: 0

## Browser probes

```json
{
  "success": true,
  "viewport": 1440,
  "mode": "side",
  "roles": [
    "Felipe",
    "Iggy",
    "Todd",
    "O",
    "Alfred"
  ],
  "sameCanvas": true,
  "rememberedDate": "3",
  "phase": "open",
  "overflow": false
}
```

```json
{
  "success": true,
  "viewport": 390,
  "mode": "sheet",
  "roles": [
    "Felipe",
    "Iggy",
    "Todd",
    "O",
    "Alfred"
  ],
  "sameCanvas": true,
  "rememberedDate": "3",
  "phase": "open",
  "overflow": false
}
```

```json
{
  "success": true,
  "viewport": 390,
  "mode": "sheet",
  "roles": [
    "Felipe",
    "Iggy",
    "Todd",
    "O",
    "Alfred"
  ],
  "sameCanvas": true,
  "rememberedDate": "3",
  "phase": "open",
  "overflow": false
}
```

## Open findings

| Check | Location | Finding | Checker suggestion |
| --- | --- | --- | --- |
| empty-visual | div.mx-auto.grid > a.folder.group:nth-of-type(2) > div.relative.w-full > svg.back.absolute | the picture shows nothing here: 99% of it is one colour (#f3f3f3) (and 2 more like it: svg.back.absolute, svg.back.absolute) | make the visual draw at every width: a picture that loads, an effect that renders, or its still fallback; never an empty frame |
| empty-visual | div.uses-row > a.uses-card.software-card:nth-of-type(9) > span.software-logo-wrap > img "omarchy.png" | the picture omarchy.png never loaded: its frame shows empty | make the visual draw at every width: a picture that loads, an effect that renders, or its still fallback; never an empty frame |
| empty-visual | div.uses-row > a.uses-card.software-card:nth-of-type(10) > span.software-logo-wrap > img "amp.svg" | the picture amp.svg never loaded: its frame shows empty | make the visual draw at every width: a picture that loads, an effect that renders, or its still fallback; never an empty frame |
| empty-visual | li.memory-item:nth-of-type(8) > button.memory-photo > figure.memory-frame > img "xiamen-2026-08-day4-towers.jpg" | the picture xiamen-2026-08-day4-towers.jpg never loaded: its frame shows empty (and 2 more like it: "xiamen-2026-08-day4-towe", "xiamen-2026-08-day4-towe") | make the visual draw at every width: a picture that loads, an effect that renders, or its still fallback; never an empty frame |
| hero-fill | main.home-content.space-y-16 > div.about > div.agent-tools-slot "Drag to throw. Arrow keys nudge." | the next section shows on the first screen: it starts at 444px on a 900px screen (the hero ends at 128px) | let the hero fill the first screen alone (min-height: 100svh, less above it): nothing of the next section on load |
| nav | (the first screen) | no nav bar across the top of the first screen (a header with the brand, the section links and the main action) | make the nav one bar from the content's left edge to its right edge, with every link and action inside it |
| spill | div.agent-tools-stage > div.relative.isolate > div:nth-of-type(1) > a:nth-of-type(10) | runs 40px past the right edge of the panel it sits on (div:nth-of-type(1) > a:nth-of-type(9) > span:nth-of-type(1) > img) | keep the box inside the panel it starts on: shrink it, or grow the panel to hold it |
| spill | div.absolute.inset-0 > div.item.absolute:nth-of-type(2) > div.frame > img.logo "img: Claude Code" | runs 32px past the left edge of the panel it sits on (div.absolute.inset-0 > div.item.absolute:nth-of-type(4) > div.frame > img.logo) | keep the box inside the panel it starts on: shrink it, or grow the panel to hold it |
| spill | div.absolute.inset-0 > div.item.absolute:nth-of-type(3) > div.frame > img.logo "img: Dia" | runs 28px past the right edge of the panel it sits on (div.absolute.inset-0 > div.item.absolute:nth-of-type(1) > div.frame > img.logo) | keep the box inside the panel it starts on: shrink it, or grow the panel to hold it |
| spill | div.absolute.inset-0 > div.item.absolute:nth-of-type(4) > div.frame > img.logo "img: Raycast" | runs 49px past the right edge of the panel it sits on (div.absolute.inset-0 > div.item.absolute:nth-of-type(1) > div.frame > img.logo) | keep the box inside the panel it starts on: shrink it, or grow the panel to hold it |
| spill | div.absolute.inset-0 > div.item.absolute:nth-of-type(2) > div.frame > figure.photo.shadow | runs 24px past the right edge of the panel it sits on (div.item.absolute:nth-of-type(1) > div.frame > figure.photo.shadow > img) | keep the box inside the panel it starts on: shrink it, or grow the panel to hold it |
| spill | div.absolute.inset-0 > div.item.absolute:nth-of-type(3) > div.frame > figure.photo.shadow | runs 32px past the right edge of the panel it sits on (div.item.absolute:nth-of-type(1) > div.frame > figure.photo.shadow > img) (and 1 more like it: figure.photo.shadow) | keep the box inside the panel it starts on: shrink it, or grow the panel to hold it |
| spill | div.absolute.inset-0 > div.item.absolute:nth-of-type(4) > div.frame > figure.photo.shadow | runs 48px past the right edge of the panel it sits on (div.item.absolute:nth-of-type(1) > div.frame > figure.photo.shadow > img) (and 1 more like it: figure.photo.shadow) | keep the box inside the panel it starts on: shrink it, or grow the panel to hold it |
| spill | div.item.absolute:nth-of-type(5) > div.frame > figure.photo.shadow > video | runs 62px past the right edge of the panel it sits on (div.item.absolute:nth-of-type(1) > div.frame > figure.photo.shadow > img) | keep the box inside the panel it starts on: shrink it, or grow the panel to hold it |
| spill | div.absolute.inset-0 > div.item.absolute:nth-of-type(5) > div.frame > figure.photo.shadow | runs 65px past the right edge of the panel it sits on (div.item.absolute:nth-of-type(1) > div.frame > figure.photo.shadow > img) | keep the box inside the panel it starts on: shrink it, or grow the panel to hold it |
| overlap-text | div.absolute.inset-0 > div.item.absolute:nth-of-type(3) > div.frame > div.note.shadow "@AndrewYNg New: A map of the most import" | lies over the text "@DevanshuXi" (div.note.shadow > p.note-title) | move the box off the text (or the text off the box) |
| overlap-text | div.absolute.inset-0 > div.item.absolute:nth-of-type(2) > div.frame > div.note.shadow "@pidotdev Good morning from Vienna Peopl" | lies over the text "I stopped following the “learn everythin" (div.note.shadow > p.note-p) | move the box off the text (or the text off the box) |
| webgl | (the page) | 5 WebGL contexts live at once (at most 4): span.dots-character, div.relative x4; 1.1 MP of canvas on the fullest screen; the checker held the page to 4 (0 freed off screen, 4 refused and measured as their fallback) | at most 4 live WebGL contexts: mount each effect when it comes on screen and destroy it when it leaves |
| card-layout | main.home-content.space-y-16 > div.mx-auto.grid "What I Use Tools I use every day" | 4 of 4 cards drawn one way (one panel, ground, placement and fragment): copies of one card | a card layout at most twice on a page: build the other sections another way |
| cta | main.home-content.space-y-16 > div.about > div.flex.items-center | the hero has no button (the nav's does not count) | add the action: a button in the hero, one on every priced item, one in the closing section |
| cta | main.home-content.space-y-16 > section.belief-notes "Loading poster: Everyone has ideas. Few " | the last section before the footer ends with no button | add the action: a button in the hero, one on every priced item, one in the closing section |
| copy-headline | div.about > div.flex.items-center > div.min-w-0 > h1.flex.items-center "Justin" | "Justin" does not name what is sold (personal website, personal, website, from flags) | put the category noun in the h1 (and who it is for, or where), in 2 to 8 words |
| heading-scale | div.about > astro-island > div.intro-copy > h2.intro-copy-line "I turn ideas into agents agents and buil" | an h2 at 18px, as large as the h1 (16px) or larger | size headings by level: the h1 largest, one size per level, each level below the one above |
| top-stagger | main.home-content.space-y-16 > section.belief-notes "[skullet-reveal] { position: relative; }" | 2 boxes side by side start at different heights (+11, +0px) | align the tops of the boxes in the row (one floor, one ceiling) |
| off-grid | main.home-content.space-y-16 > div.about > div.flex.items-center > img.size-12.shrink-0 "img: Justin" | left edge at 420px, 12px off the page margin at 432px (12 elements, like span.intro-copy-phrase:nth-of-type(1)) | move it onto the page margin, or the column edge its section uses |
| off-grid | div.mx-auto.grid > a.folder.group:nth-of-type(1) > div.relative.w-full > svg.back.absolute | left edge at 449.5px, 17.5px off the page margin at 432px (12 elements); 5 more in this section off the grid too (div.flap.absolute at 449.5px, svg.back.absolute at 449.5px, div.flap.absolute at 449.5px, svg.back.absolute at 449.5px, ...) | move it onto the page margin, or the column edge its section uses |
| tilt | div.agent-tools-stage > div.relative.isolate > div:nth-of-type(1) > a:nth-of-type(1) | rotated 1.4° (and 15 more like it: a:nth-of-type(8), a:nth-of-type(9), a:nth-of-type(12), a:nth-of-type(13), ...) | set it straight |
| tilt | div.agent-tools-stage > div.relative.isolate > div:nth-of-type(1) > a:nth-of-type(2) | rotated -52.9° (and 17 more like it: a:nth-of-type(3), a:nth-of-type(5), a:nth-of-type(6), a:nth-of-type(10), ...) | set it straight |
| contrast | div.flap.absolute > div.absolute.inset-x-0 > div.min-w-0 > p.truncate.text-xs "Tools I use every day" | body text over a effect reads at 4.1:1 at its worst tenth (needs 4.5:1) (and 5 more like it: "2 shipped projects", "21 tracks on repeat", "Photographs I want to re", "Ideas I’m working throug", ...) | put the text on a calm part of the picture, or on a solid panel |
| text-contrast | div.about > div.flex.items-center > div.min-w-0 > p.about-role.leading-tight "AI Agent Engineer" | a caption, label or muted line in #8c8d8d on #f7f7f8 reads 3.13:1 (needs 4.5:1) | body text in the ink at 7:1 or more; grey (4.5:1 or more) only for captions and labels |
| text-contrast | h2#contributions-title "Contributions" | a caption, label or muted line in #737373 on #f7f7f8 reads 4.43:1 (needs 4.5:1); 2 like it, like "View contribution acti" | body text in the ink at 7:1 or more; grey (4.5:1 or more) only for captions and labels |
| text-contrast | main.home-content.space-y-16 > footer.local-time-footer > time "12:20am in Beijing, China" | a caption, label or muted line in #a1a1a1 on #f7f7f8 reads 2.41:1 (needs 4.5:1) | body text in the ink at 7:1 or more; grey (4.5:1 or more) only for captions and labels |
| section-gaps | main.home-content.space-y-16 > div.about > div.flex.items-center / main.home-content.space-y-16 > div.about > div.agent-tools-slot | 309px between these sections, +335% against the median 71px | use one gap between sections (all within 25% of each other) |
| section-gaps | main.home-content.space-y-16 > div.about > div.agent-tools-slot / main.home-content.space-y-16 > section.contributions | 17px between these sections, -76% against the median 71px | use one gap between sections (all within 25% of each other) |
| visual-empty | li.memory-item:nth-of-type(5) > button.memory-photo > figure.memory-frame > img "picture xiamen-2026-08-day4-market.jpg" | the picture xiamen-2026-08-day4-market.jpg shows nothing at 1440px: 1 colour in its 277x208px, 100% one colour (55% of it on screen), an empty ground or frame where the visual should be | make the visual draw at this width: a picture that loads, an effect that renders, or its still fallback; never an empty ground or frame |
| visual-empty | div.uses-row > a.uses-card.software-card:nth-of-type(1) > span.software-logo-wrap > img "picture matt-pocock-skills.png" | the picture matt-pocock-skills.png shows nothing at 1440px: 1 colour in its 230x121px, 100% one colour (18% of it on screen), an empty ground or frame where the visual should be (and 3 more like it: picture understand-anything.jpg, picture xiamen-2026-08-day3-bookstore.jpg, picture xiamen-2026-08-day3-store.jpg) | make the visual draw at this width: a picture that loads, an effect that renders, or its still fallback; never an empty ground or frame |
| coordinates | span.location-preview > span.location-card > span.location-caption > span.location-coordinates "39.9042° N 116.4074° E" | map coordinates: "39.9042° N 116.4074° E"; they point at one building on a map (not shown at this width: a closed part, a tab, a slide or a hidden link) | drop the coordinates: Get directions opens an OpenStreetMap search for the street and the district |
| coordinates | astro-slot > span.employment-location > span.location-preview > a.living-underline.location-link "39.9042&mlon=116.4074" | a link holds map coordinates, in a link (www.openstreetmap.org): "39.9042&mlon=116.4074"; they point at one building on a map (and 2 more like it: again here, span.employment-location > span.location-preview > span.location-card > iframe.location-map in its frame) | drop the coordinates: Get directions opens an OpenStreetMap search for the street and the district |
| focus-ring | .home-news-link[data-astro-cid-drio35nr]:focus-visible | ".home-news-link[data-astro-cid-drio35nr]:focus-visible" in the page removes the focus outline and sets nothing in its place | keep the kit's :focus-visible ring, or put a change of the same strength (a 2px line in --action) in the rule that removes it |
| focus-visible | main.home-content.space-y-16:nth-of-type(1) > div.about:nth-of-type(1) > aside.home-news > a.home-news-link "New thought: How TanStack Start became m" | Tab stop 1, a "New thought: How TanStack Start became my default ": it shows no change when focused | keep the kit's ring (system.css :focus-visible, 2px in --action, there at once); a control that hides itself shows on focus |
| focus-visible | main.home-content.space-y-16:nth-of-type(1) > div.mx-auto.grid:nth-of-type(2) > a.folder.group:nth-of-type(1) "ChatGPT Claude Code Dia Raycast What I U" | Tab stop 25, a "ChatGPT Claude Code Dia Raycast What I Use Tools I": it shows no change when focused | keep the kit's ring (system.css :focus-visible, 2px in --action, there at once); a control that hides itself shows on focus |
| focus-visible | main.home-content.space-y-16:nth-of-type(1) > div.mx-auto.grid:nth-of-type(2) > a.folder.group:nth-of-type(2) "Projects 2 shipped projects" | Tab stop 26, a "Projects 2 shipped projects": it shows no change when focused | keep the kit's ring (system.css :focus-visible, 2px in --action, there at once); a control that hides itself shows on focus |
| focus-visible | main.home-content.space-y-16:nth-of-type(1) > div.mx-auto.grid:nth-of-type(2) > a.folder.group:nth-of-type(3) "Music 21 tracks on repeat" | Tab stop 27, a "Music 21 tracks on repeat": it shows no change when focused | keep the kit's ring (system.css :focus-visible, 2px in --action, there at once); a control that hides itself shows on focus |
| map-link | astro-slot > span.employment-location > span.location-preview > a.living-underline.location-link "Beijing" | "Beijing" searches for nothing: a map of a district or a town shows nobody the door | with a street from the brief, "Get directions" to its search; a district only: "See the area"; a town only: no map link |
| moment-none | (the page) | a software page (--type) deals no moment: every kind carries one, two on a long page (moments.md) | deal one (moments.mjs pick --page software) and mount it in its own section |
| hidden-content | main.home-content.space-y-16 > section.belief-notes > figure.belief-note.belief-note--ideas > figcaption "via Acu" | with scripts switched off (a blocked or failed script) 7 lines stay hidden on screen 3, 1.5 s after load (opacity 0): "via Addy Osmani", "via Rudy Adler", "Rudy Adler": the page shows it only when a script reveals it | show the content at rest: the hidden state only under a class the script adds on its live path, never in the plain CSS (prefers-reduced-motion and a script that never runs show the finished page) |
| hidden-content | main.home-content.space-y-16 > section.belief-notes > figure.belief-note.belief-note--iterate > figcaption "via Addy Osmani" | with reduced motion asked for 6 lines stay hidden on screen 3, 0.7 s after it was scrolled to (opacity 0): "via Rudy Adler", "Rudy Adler", "via Vaswani et al.": the page shows it only when a script reveals it | show the content at rest: the hidden state only under a class the script adds on its live path, never in the plain CSS (prefers-reduced-motion and a script that never runs show the finished page) |
| hero-screen | main.home-content.space-y-16 > div.about "NewHow TanStack Start became my default " | the hero ends at 551px on a 900px screen, 349px above the fold: it ends at the fold, 1px either way (SR-1) | make the hero exactly one screen (height: 100svh, its content fitted inside), never taller or shorter |
| hero-screen | main.home-content.space-y-16 > section.contributions "ContributionsView contribution activity " | 333px of the next section shows on the first screen (from 567px on a 900px screen): nothing below the hero shows at load (SR-1) | end the hero at the fold so nothing of the next section shows at load (hero height: 100svh) |
| hero-screen | main.home-content.space-y-16 > div.about > div.flex.items-center > img.size-12.shrink-0 "Justin" | "Justin" lies outside the hero's box (68-140px, the hero 80-551px) (SR-1) | fit the hero's content inside the hero's box: shorten the text or the picture, never let it spill |
| section-height | main.home-content.space-y-16 > footer.local-time-footer "12:21am in Beijing, China" | the section is 15px tall (0 screens), 885px short of one screen (900px): every section after the hero is one screen or two, 2px either way (SR-2) | set the section to one screen or two (height: calc(var(--h,1) * 100vh), --h 1 or 2) and cut or split its content to fit |
| section-height | main.home-content.space-y-16 > section.contributions "ContributionsView contribution activity " | the section is 158px tall (0.2 screens), 742px short of one screen (900px): every section after the hero is one screen or two, 2px either way (and 2 more like it: "What I UseTools I use ev", "[skullet-reveal] { posit") (SR-2) | set the section to one screen or two (height: calc(var(--h,1) * 100vh), --h 1 or 2) and cut or split its content to fit |
| section-height | main.home-content.space-y-16 > section.belief-notes "[skullet-reveal] { position: relative; }" | the section starts at 1560px, 240px above the screen grid (2 x 900px): sections start on whole screens (and 3 more like it: "12:21am in Beijing, Chin", "What I UseTools I use ev", "NewHow TanStack Start be") (SR-2) | make every section above it exactly one or two screens tall, so this one starts on a whole screen |
| section-height | main.home-content.space-y-16 > div.mx-auto.grid "What I UseTools I use every dayProjects2" | the section's content does not fit it: its lowest content ends 708px below its top, past 636px (the section less 72px of bottom padding) (and 2 more like it: "12:21am in Beijing, Chin", "[skullet-reveal] { posit") (SR-2) | fit the content above the section's bottom padding (--padb), or make it two screens (.g2) in two groups |
| section-height | main.uses-content > section:nth-of-type(1) > div.uses-group:nth-of-type(1) > div.uses-row "Grok BotAI teammates you can give real w" | scroll-snap-type: inline on "Grok BotAI teammates you can giv": sections are one or two screens by their height and padding, the scroll is the browser's own (SR-2) | take scroll-snap-type off (html, body and every scroller): sections are one or two screens by height and padding, never snapped |
| section-height | main.uses-content > section:nth-of-type(1) > div.uses-group.uses-group-spaced:nth-of-type(2) > div.uses-row "TernA neoterminal for the Electron-weary" | scroll-snap-type: inline on "TernA neoterminal for the Electr": sections are one or two screens by their height and padding, the scroll is the browser's own (and 1 more like it: "DiaFeaturedA browser you") (SR-2) | take scroll-snap-type off (html, body and every scroller): sections are one or two screens by height and padding, never snapped |
| one-section | main.home-content.space-y-16 > section.belief-notes "[skullet-reveal] { position: relative; }" | the screen at scroll 900px (stride 1) shows 240px of section 4 beside section 3: a screen shows one section (another may peek 8px, 24px WARN) (SR-4) | make each section exactly one screen or two, so a screen shows one section and no neighbour peeks |
| one-section | h2#contributions-title "Contributions" | the screen at scroll 80px (the top of section 1) shows 191px of section 3 and the heading of section 2 whole and the content of 3 sections, over 24px each beside section 1: a screen shows one section (another may peek 8px, 24px WARN) (SR-4) | make each section exactly one screen or two, so a screen shows one section and no neighbour peeks |
| one-section | main.home-content.space-y-16 > div.about "NewHow TanStack Start became my default " | a <div> sits directly in <main>: every part of <main> is a <section> (SR-4) | put every block of <main> in a <section>, and give a band its own section instead of a ground inside one |
| one-section | main.home-content.space-y-16 > div.mx-auto.grid "What I UseTools I use every dayProjects2" | a <div> sits directly in <main>: every part of <main> is a <section> (SR-4) | put every block of <main> in a <section>, and give a band its own section instead of a ground inside one |
| one-section | main.home-content.space-y-16 > footer.local-time-footer "12:21am in Beijing, China" | a <footer> sits directly in <main>: every part of <main> is a <section> (SR-4) | put every block of <main> in a <section>, and give a band its own section instead of a ground inside one |
| one-heading | div.about > astro-island > div.intro-copy > h2.intro-copy-line "I turn ideas into productsproductsagents" | the hero holds an h2 (1): its heading is the h1, and an h2 opens the next section (SR-5) | give each section one h2, first in its .wrap, and the hero only its h1 |
| one-heading | h2#contributions-title "Contributions" | headings of two sections show whole on one screen at 4 of 36 scroll positions (11.1%; at scroll 0, 50, 100, 150px), here with "I turn ideas into productsproduc": at most 3% on a desktop (SR-5) | make the sections one screen tall so their headings sit a screen apart and two never share one |
| container-edges | main.home-content.space-y-16 > section.belief-notes "[skullet-reveal] { position: relative; }" | the content of section 4 runs 461px from the left and 635px from the right (read from its outermost blocks: no .wrap): the page's container starts at 420px; 461 and 635px are not one margin; the margin is 64-120px at 1440px (one container, equal margins, 2px either way) (SR-6) | use one container on every section and the nav (.wrap): one margin left and right, 64-120px on a desktop, 16-24px on a phone |
| container-edges | main.home-content.space-y-16 > div.mx-auto.grid "What I UseTools I use every dayProjects2" | the content of section 3 runs 449px from the left and 449px from the right (read from its outermost blocks: no .wrap): the page's container starts at 420px; the margin is 64-120px at 1440px (one container, equal margins, 2px either way) (and 2 more like it: "NewHow TanStack Start be", "ContributionsView contri") (SR-6) | use one container on every section and the nav (.wrap): one margin left and right, 64-120px on a desktop, 16-24px on a phone |
| container-edges | div.home-dock-wrap "Say hiMomentsEmail mehello@jiaq.ingCopie" | a <div> at the top of the page, outside header.nav, main, footer.closing and nav.actionbar (SR-6) | build the page as header.nav, a main of sections (each one in-flow .wrap plus background layers) and footer.closing |
| container-edges | span.sr-only | a <span> at the top of the page, outside header.nav, main, footer.closing and nav.actionbar (and 9 more like it: div.project-flight-layer, div.writing-flight-layer:nth-of-type(6), div.writing-flight-layer:nth-of-type(7)) (SR-6) | build the page as header.nav, a main of sections (each one in-flow .wrap plus background layers) and footer.closing |
| container-edges | div.about > div.flex.items-center > div.min-w-0 > h1.flex.items-center "Justin" | the h1 starts 72px right of the container's left: every h1 and h2 starts on it, 2px either way (SR-6) | start the text on the container's left, or on the one split line every split shares |
| container-edges | div.about > astro-island > div.intro-copy > h2.intro-copy-line "I turn ideas into productsproductsagents" | 8 text blocks start on a left line at x 432, 12px from the container's left: text starts on the container's left, or on one split line (x 680, 732, 784) (also "I turn ideas into productsproduc", "and build playful thingsplayful ", "Previously worked on user growth") (and 2 more like it: "I turn ideas into produc", "Contributions") (SR-6) | start the text on the container's left, or on the one split line every split shares |
| container-edges | astro-island > div > div.relative.inline-block > img | a <img> over half the container wide runs 461-686px, not on the container's lines at 461-805px (SR-6) | run the picture or box from the container's left line to its right line, or put it in a row or a split |
| container-edges | astro-island > div > div.relative.inline-block > canvas | a <canvas> over half the container wide runs 432-860px, not on the container's lines at 461-805px (SR-6) | run the picture or box from the container's left line to its right line, or put it in a row or a split |
| row-lines | main.home-content.space-y-16 > section.contributions > a.contributions-link > div.contributions-graph "GitHub contribution activity is temporar" | a row of 53 items: its first item starts at 432px, the container's left line at 420px; its last item ends at 1008px, the container's right line at 1020px (2px either way) (SR-7) | start the row's first item on the container's left line and end its last on the right line, every item one height |
| flush | div.mx-auto.grid > a.folder.group:nth-of-type(5) > div.relative.w-full > svg.back.absolute | its button sits 0px above the lower edge of div.mx-auto.grid, where the ground changes to section.belief-notes | give the section its padding at the edge where the ground changes (the closing call keeps a clear gap above the footer) |
| overlap-text | div.relative.w-full > div.flap.absolute > div.absolute.inset-x-0 > svg.size-4.shrink-0 | lies over the text "Tools I use every day" (div.min-w-0 > p.truncate.text-xs) (and 3 more like it: svg.size-4.shrink-0, svg.size-4.shrink-0, svg.size-4.shrink-0) | move the box off the text (or the text off the box) |
| tap-size | div.intro-copy > h2.intro-copy-line > span.intro-copy-phrase:nth-of-type(1) > button.intro-token "products products" | a 78x27px tap target (and 1 more like it on this screen): 0px from the next one ("playful things playful t"), so a thumb lands on the wrong one | make every link and control outside running text 44px tall on a phone: display: inline-flex; align-items: center; min-height: 44px (a footer list then needs no gap), a 44px small button, or a transparent ::before laid past the box |
| cut-text | div.flap.absolute > div.absolute.inset-x-0 > div.min-w-0 > p.truncate.text-xs "Photographs I want to remember" | cut 22px by the right edge of the screen (and 1 more like it: "Threads, podcasts, and a") | give the text room: no overflow clipping a line, no line past its box |
| cta | main.home-content.space-y-16 > section.belief-notes "[skullet-reveal] { position: relative; }" | the last section before the footer ends with no button | add the action: a button in the hero, one on every priced item, one in the closing section |
| tilt | div.agent-tools-stage > div.relative.isolate > div:nth-of-type(1) > a:nth-of-type(7) | rotated -137.4° (and 10 more like it: div.item.absolute:nth-of-type(2), div.item.absolute:nth-of-type(1), div.item.absolute:nth-of-type(1), div.item.absolute:nth-of-type(2), ...) | set it straight |
| text-contrast | main.home-content.space-y-16 > footer.local-time-footer > time "12:21am in Beijing, China" | a caption, label or muted line in #a1a1a1 on #f7f7f8 reads 2.41:1 (needs 4.5:1) | body text in the ink at 7:1 or more; grey (4.5:1 or more) only for captions and labels |
| visual-empty | div.uses-row > a.uses-card.software-card:nth-of-type(3) > span.software-logo-wrap > img "jakub-skills.png" | the picture jakub-skills.png has still not loaded after the page was walked: its frame shows empty | make the visual draw at this width: a picture that loads, an effect that renders, or its still fallback; never an empty ground or frame |
| visual-empty | div.uses-row > a.uses-card.software-card:nth-of-type(4) > span.software-logo-wrap > img "ponytail.png" | the picture ponytail.png has still not loaded after the page was walked: its frame shows empty | make the visual draw at this width: a picture that loads, an effect that renders, or its still fallback; never an empty ground or frame |
| visual-empty | div.uses-row > a.uses-card.software-card:nth-of-type(5) > span.software-logo-wrap > img "understand-anything.jpg" | the picture understand-anything.jpg has still not loaded after the page was walked: its frame shows empty | make the visual draw at this width: a picture that loads, an effect that renders, or its still fallback; never an empty ground or frame |
| visual-empty | div.uses-row > a.uses-card.software-card:nth-of-type(6) > span.software-logo-wrap > img "ian-xiaohei-illustrations.jpg" | the picture ian-xiaohei-illustrations.jpg has still not loaded after the page was walked: its frame shows empty | make the visual draw at this width: a picture that loads, an effect that renders, or its still fallback; never an empty ground or frame |
| visual-empty | div.uses-row > a.uses-card.software-card:nth-of-type(2) > span.software-logo-wrap > img "warp.png" | the picture warp.png has still not loaded after the page was walked: its frame shows empty | make the visual draw at this width: a picture that loads, an effect that renders, or its still fallback; never an empty ground or frame |
| visual-empty | div.uses-row > a.uses-card.software-card:nth-of-type(4) > span.software-logo-wrap > img "zed.png" | the picture zed.png has still not loaded after the page was walked: its frame shows empty | make the visual draw at this width: a picture that loads, an effect that renders, or its still fallback; never an empty ground or frame |
| visual-empty | div.uses-row > a.uses-card.software-card:nth-of-type(5) > span.software-logo-wrap > img "obsidian.png" | the picture obsidian.png has still not loaded after the page was walked: its frame shows empty | make the visual draw at this width: a picture that loads, an effect that renders, or its still fallback; never an empty ground or frame |
| visual-empty | div.uses-row > a.uses-card.software-card:nth-of-type(6) > span.software-logo-wrap > img "ia-writer.png" | the picture ia-writer.png has still not loaded after the page was walked: its frame shows empty (and 16 more like it: spatial.png, cleanshot-x.png, screen-studio.png, amie.jpg, ...) | make the visual draw at this width: a picture that loads, an effect that renders, or its still fallback; never an empty ground or frame |
| tap-size | div.intro-copy > h2.intro-copy-line > span.intro-copy-phrase:nth-of-type(1) > button.intro-token "agents agents" | a 53x23px tap target (and 1 more like it on this screen): 0px from the next one ("playful things playful t"), so a thumb lands on the wrong one | make every link and control outside running text 44px tall on a phone: display: inline-flex; align-items: center; min-height: 44px (a footer list then needs no gap), a 44px small button, or a transparent ::before laid past the box |
| container | page | no .wrap | put the content in one .wrap |

## Dock 待机与悬停增强

新增 `check-dock-character-motion.mjs` 验证四个真实模型的 Dock 总浮动幅度在 1.2–1.5 CSS px、原始骨骼值不变、悬停不重播、飞行收敛、舞台零增强与减少动态。类型检查与生产构建通过。

独立浏览器功能探针在 1440px 验证鼠标悬停进入招呼、打开恢复舞台待机、同一 canvas 返回后仍可回应；390px 验证触屏不触发悬停。两种宽度的功能探针均 success=true，renderer=webgl。整页检查器仍有既有发现，本次没有将其标成全部通过。
