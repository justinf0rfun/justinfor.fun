# Codex 左侧消息导航横线的 hover 动效

调研日期：2026-08-12

## 结论

**已确定：截图里的“横线丝滑地跟着鼠标移动”不是一根共享指示线在纵向位移，也不是给每一项切换 `width`。** Codex 给每个导航项都渲染一根独立横线；鼠标经过某项时，目标横线和它上下各 3 根邻线同时用 `transform: scaleX()` 改变长度。旧目标缩短、新目标伸长、邻线梯度整体平移，于是视觉上像同一股波纹跟随鼠标。

精确参数来自当前本机 OpenAI 桌面应用的生产包，而不是猜测或复刻观感：

- 应用：Codex / ChatGPT desktop，bundle id `com.openai.codex`
- 版本：`26.803.61601`，build `6396`
- 生产包：[`app.asar`](</Applications/ChatGPT.app/Contents/Resources/app.asar>)
- 对应组件：`ThreadUserMessageNavigationRail`
- 对应资源：
  - `webview/assets/thread-user-message-navigation-rail-BF2wT5s5.css`
  - `webview/assets/thread-user-message-navigation-rail-DvcptTTL.js`

OpenAI 官方页面确认这是用于在聊天和长时任务间工作的桌面应用，但官方文档没有公开该微动效的实现参数。[ChatGPT desktop app](https://learn.chatgpt.com/docs/app) 官方开源清单列出了 CLI、SDK、App Server、Skills 等，没有列出桌面 UI 源码，因此 `openai/codex` 仓库不是这段交互的源码来源。[Open Source](https://learn.chatgpt.com/docs/open-source)

## 已验证的实现

### 1. 每项一根横线，不是共享 indicator

压缩后的 JS 以 `items.map(...)` 为每项创建一个 `button`，每个按钮内部都有自己的 `span` marker：

```text
button[data-thread-user-message-navigation-item-id]
└── span (30px 容器)
    └── span._Marker_14m1k_2 (26px 横线)
```

组件的无障碍文案是 `User messages` / `Jump to user message {position}`，tooltip 还会显示用户消息及本次输出预览；这与截图中的刻度轨和预览卡语义、形态一致。JS 证据位于 `app.asar` 内的 `webview/assets/thread-user-message-navigation-rail-DvcptTTL.js`。

### 2. 长度由 `scaleX` 计算

横线固定宽 `26px`，左端为变换原点：

```css
width: 26px;
transform-origin: 0;
transform: scaleX(calc(.2308 + .7692 * var(--marker-progress)));
```

不同状态只修改 `--marker-progress`。由生产 CSS 的公式可得实际目标长度：

| 与 hover 目标的距离 | `--marker-progress` | `scaleX` | 目标长度 |
| --- | ---: | ---: | ---: |
| 目标 | `1` | `1` | `26px` |
| 上/下 1 项 | `.7` | `.76924` | 约 `20px` |
| 上/下 2 项 | `.4` | `.53848` | 约 `14px` |
| 上/下 3 项 | `.2` | `.38464` | 约 `10px` |
| 其余 | `0` | `.2308` | 约 `6px` |

前 3 项通过 `:has(+ button …)` 选择，后 3 项通过相邻兄弟选择器选择。目标规则最后覆盖为 `1`。鼠标从 A 移到 B 时，A 通常由 `26px → 20px`，B 由 `20px → 26px`，更远的邻线也同步切换梯度；这才是“移动感”的来源。

### 3. 精确 timing 和 easing

横线的唯一过渡属性是 `transform`：

```css
transition:
  transform .16s
  linear(
    0,
    .398 10%,
    .682 20%,
    .843 30%,
    .925 40%,
    .972 50%,
    1.004 60%,
    1.008 70%,
    1.003 80%,
    1
  );
```

- 时长：`160ms`
- 缓动：CSS `linear()` 分段曲线，不是运行时 spring
- 峰值：曲线在 70% 进度到 `1.008`，即对本次长度差产生约 `0.8%` 的轻微过冲；例如从约 `6px` 伸到 `26px` 时，峰值约 `26.16px`
- `background-color` 与 `opacity` 没有放进 transition；真正丝滑的是长度变化
- 使用 transform 而非 width，不触发布局重排

这条曲线先快速响应，后段轻微越过目标再归位，因此有一点弹性感，但不会明显晃动。

### 4. 颜色、当前项和输入方式

- 默认 marker 使用较弱的说明文字色，`opacity: .4`
- 当前可见消息 `aria-current="true"` 使用前景色，`opacity: .6`
- hover / `:focus-visible` / `data-scrub-target` 使用前景色，`opacity: 1`
- rail 被 hover 时，若当前消息不是 hover 或 focus 目标，它会暂时退回默认弱色，避免与指针目标竞争
- hover 波纹只在 `@media (hover: hover) and (pointer: fine)` 下启用
- `prefers-reduced-motion: reduce` 时 `transition-duration: 0s`

### 5. 拖动 scrub 与预览

Codex 还支持按住主键沿刻度拖动：组件捕获 pointer，通过 `elementFromPoint()` 找到指针所在项，给它设置 `data-scrub-target` 并立即滚动正文。拖动期间容器带 `data-scrubbing`，所有 marker 的过渡时长强制为 `0s`，保证拖动直接跟手；普通 hover 才使用 `160ms` 波纹。

消息预览预取使用独立的 `150ms` 定时器。点击某项则用原生 `scrollIntoView({ behavior: "smooth" })`，并对正文消息做一次 `1400ms` 的背景高亮；这些都不是横线 hover 动效本身。JS 证据同样位于 `thread-user-message-navigation-rail-DvcptTTL.js`。

## 动画库结论

**横线动效本身是纯 CSS，不依赖 GSAP、Motion 或 Framer Motion，也没有 spring 参数。** 当前应用确实打包了 `motion 12.38.0`、`framer-motion 12.42.2`、`motion-dom 12.42.2` 和 `motion-utils 12.39.0`，[第三方声明](</Applications/ChatGPT.app/Contents/Resources/THIRD_PARTY_NOTICES.txt>)可验证这些版本；rail 整体淡入也使用 motion 风格的 `opacity: 0 → 1`、`150ms`、`[.23, 1, .32, 1]` transition。但这与横线之间的跟随效果无关，不能据此把 marker 动画实现成 JS spring。

## 对本站实现的直接含义

当前 [`ArticleToc.astro`](../../src/components/ArticleToc.astro) 在整个 rail hover / focus 时把 `.article-toc-meter` 淡出，再把所有 `.article-toc-label` 淡入；它确实没有 Codex 的逐项波纹，所以用户感知是“导航被隐藏、标题整体出现”。

若要准确复现截图中的横线手感，最小正确方案是：

1. 每个目录项保留自己的 baton，不增加共享 indicator。
2. baton 固定最大宽度，以 `scaleX` 和左侧 `transform-origin` 改长度，不 transition `width`。
3. 用上面的 `1 / .7 / .4 / .2 / 0` 梯度同时影响目标上下 3 项。
4. 直接复用 `160ms` 的 `linear()` 曲线；无需再引入 Motion/GSAP，也无需 JS 监听普通 hover。
5. 标题作为目标项的独立 tooltip/label 出现，不再用“整栏刻度消失、全部标题出现”这一状态切换。
6. 保留精细指针媒体查询、键盘 focus 状态和 reduced-motion 降级。

若要 1:1 模仿 Codex，H2/H3 的 marker 最大宽应相同，层级通过标题排版或轻微缩进表达；保留当前 H3 的独立短宽度会叠加另一套长度规则，波纹梯度会不一致。

## 证据完整性与限制

- [`Info.plist`](</Applications/ChatGPT.app/Contents/Info.plist>) 给出 bundle id、版本和 build；`app.asar` 内的 `package.json` 给出 `productName: Codex`、`author: OpenAI` 和相同版本。
- 解出的 CSS SHA-256 为 `73f611d33586adbd86049d4b64f2fbc62ac23284136ee1e85109574fd173078d`，与 ASAR header 内的该文件 integrity 完全一致。
- 解出的 JS SHA-256 为 `76e8654ac6848de51b18b9f57415041c90dece177b03b3bc7e2c20550787e60c`，也与 ASAR header integrity 完全一致。
- 生产 JS/CSS 都带 `sourceMappingURL` 注释，但对应 `.map` 没有打进 ASAR，因此无法恢复原始 TSX/CSS Modules 文件名、原始变量名或源码行号。
- 上述数值只对本机当前 `26.803.61601` / build `6396` 生产包构成直接证据；OpenAI 以后可能调整。无法证明用户截图一定来自完全相同 build，但截图的导航刻度、当前项、用户消息预览卡和输出摘要都与该组件高度一致，因此对“这是同一组件/同一交互模型”的判断为高置信度。
