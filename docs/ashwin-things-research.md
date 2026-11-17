# Ashwin Things 原始实现调研

调研日期：2026-11-17。先检查原站代码和资源，为本站 `What I Use` 内页改版提供依据；调研阶段未修改页面。随后完成的改造与验证见文末落地记录。

## 结论与源码可用性

**原站的公开生产代码可以直接核实完整的列表、布局和交互，但尚未找到与当前 `/things` 部署对应的公开 TSX 源文件。** 以下实现参数来自原站实际返回的 HTML、JS 和 CSS，不是根据截图猜测。[原页面](https://www.ashwinexe.com/things)、[页面 JS](https://www.ashwinexe.com/_next/static/chunks/app/(pages)/things/page-fd9a8dfbe0616851.js)、[页面 CSS](https://www.ashwinexe.com/_next/static/css/5a48a76fec8f7cdb.css)

作者的 GitHub 账户为 [ashwinexe](https://github.com/ashwinexe)。公开仓库 [ashwinexe/home](https://github.com/ashwinexe/home) 的 README 明确说明它是个人网站源码，然而已检查的唯一分支 `main`、提交 `76fa2efb0329ef49becc26d4ff6d10c87cc5d923` 中没有 `things` 路由或相应资源目录，样式也属于另一版网站。因此它能证明作者相关技术选择，不能冒充当前 Things 页的原始源码。[README](https://github.com/ashwinexe/home/blob/76fa2efb0329ef49becc26d4ff6d10c87cc5d923/README.md)、[完整文件树](https://api.github.com/repos/ashwinexe/home/git/trees/76fa2efb0329ef49becc26d4ff6d10c87cc5d923?recursive=1)、[分支](https://api.github.com/repos/ashwinexe/home/branches)

该提交树没有 `LICENSE` / `COPYING` 文件；不能从“仓库公开”推断获得复用许可，也不能套用作者其他旧仓库的许可证。当前生产 JS/CSS 没有 `sourceMappingURL`，直接请求对应两个 `.map` 地址都返回 404。原始文件名、源码行号、当前部署的 lockfile 和精确依赖版本仍未知。[仓库文件树](https://api.github.com/repos/ashwinexe/home/git/trees/76fa2efb0329ef49becc26d4ff6d10c87cc5d923?recursive=1)、[JS map](https://www.ashwinexe.com/_next/static/chunks/app/(pages)/things/page-fd9a8dfbe0616851.js.map)、[CSS map](https://www.ashwinexe.com/_next/static/css/5a48a76fec8f7cdb.css.map)

## 可验证的组件与数据结构

- 部署使用 Next.js App Router；HTML 含 React Server Components payload，路由 chunk 路径为 `app/(pages)/things/page-…js`。服务端输出主容器、`Things` 标题及初始列表，客户端导出的组件名是 `ThingsShelf`。[HTML](https://www.ashwinexe.com/things)
- `ThingsShelf` 内部只有一个类别 state，初始值 `All`；`All / Tech / Lego / Coffee` 按钮直接过滤内嵌静态数组，没有搜索、排序菜单、分页或数据 API。[页面 JS](https://www.ashwinexe.com/_next/static/chunks/app/(pages)/things/page-fd9a8dfbe0616851.js)
- 共 24 件物品：21 件持有物品（Tech 13、Lego 4、Coffee 4）和 3 件 Wishlist。持有物品先按 `pinned` 分组，再保持各组原顺序；Wishlist 单列并接受相同类别过滤，过滤后为空时整个 Wishlist section 退出。[页面 JS](https://www.ashwinexe.com/_next/static/chunks/app/(pages)/things/page-fd9a8dfbe0616851.js)
- 每项记录包含 `id / name / maker / category / href / width / height / size`，可选 `pinned / note / borrowed / wish / ground`。`size` 控制展示高度，`width / height` 提供比例，`ground` 调整接地阴影宽度。物品不是全部塞进统一大小的方形卡片。[页面 JS](https://www.ashwinexe.com/_next/static/chunks/app/(pages)/things/page-fd9a8dfbe0616851.js)
- 每件物品是外链 `<a>`，包含 stage、独立 floor 阴影、透明图像、名称和 maker/note。`next/image` 提供尺寸和响应式图片；持有列表前 4 张 eager/priority，其余懒加载。没有点击弹窗、拖动排序或 3D 模型。[页面 JS](https://www.ashwinexe.com/_next/static/chunks/app/(pages)/things/page-fd9a8dfbe0616851.js)
- CSS Modules 导出 `wrap / head / filters / shelf / item / card / stage / object / floor / caption / wishlist` 等类。可证实模块边界；不能据此杜撰原始 `.module.css` / `.tsx` 路径。[页面 JS](https://www.ashwinexe.com/_next/static/chunks/app/(pages)/things/page-fd9a8dfbe0616851.js)

## 布局与响应式：不是 masonry

原站使用 **flex-wrap + 行端缩进**。它的错落感来自每件物品不同高度、底部对齐及交替少一件的行，而不是瀑布流算法。[页面 CSS](https://www.ashwinexe.com/_next/static/css/5a48a76fec8f7cdb.css)

| 范围 | 每项宽度 | 行排列 | 其他参数 |
| --- | --- | --- | --- |
| 大于 900px | 25% | 4 / 3 / 4 / 3…；三件行左右各缩进 12.5% | 行距 64px，列表顶部 72px |
| 561–900px | 33.333% | 3 / 2 / 3 / 2…；两件行左右各缩进 16.666% | 行距仍为 64px |
| 不超过 560px | 50% | 两列，清除桌面/平板缩进 | 行距 44px，列表顶部 48px |

JS 按当前 index 计算两套 `data-inset4` / `data-inset3`：周期为 `2 × columns − 1`，在短行第一项加起始 margin、最后一项加结束 margin。筛选后根据新 index 重新计算，因此会重新排出完整交替行。[页面 JS](https://www.ashwinexe.com/_next/static/chunks/app/(pages)/things/page-fd9a8dfbe0616851.js)

容器最大宽 1180px，桌面 padding `52px 28px 56px`，手机 `36px 18px 48px`。item 声明 `container-type:inline-size`；stage 高度为 `min(size px, size / 280 × 100cqw)`，宽度再乘原图比例。这使物体在狭窄列里按比例缩小，且保留各自的视觉尺寸。类别字为 Bricolage Grotesque、800、`clamp(44px,9.2vw,104px)`，caption 名称 15px/600，辅助信息使用 10px JetBrains Mono 大写字。[页面 CSS](https://www.ashwinexe.com/_next/static/css/5a48a76fec8f7cdb.css)、[字体 CSS](https://www.ashwinexe.com/_next/static/css/6a4ebec3ed29a632.css)

## 动画：CSS 负责悬停，Motion 负责筛选重排

| 交互 | 已核实实现与数值 |
| --- | --- |
| 首屏容器入场 | `head` 容器的 CSS 500ms，`cubic-bezier(.3,1,.4,1)`，opacity 0→1、translateY 10px→0；SSR 中该容器包住标题和整个 `ThingsShelf` |
| 物体跟随指针 | 仅 `pointerType === mouse`；以整个链接矩形归一化坐标 `x,y ∈ [-.5,.5]` 写 CSS 变量 `--rx = -10y deg`、`--ry = 14x deg`、`--sx = -10x px`，即 X ±5°、Y ±7°、阴影横移 ±5px；离开时删除三个变量 |
| 立体感 | stage `perspective:900px`；object 以 `50% 100%` 为旋转原点；没有 canvas/WebGL/Three.js |
| 悬停抬起 | 仅 `@media (hover:hover)`；translateY −9px、scale 1.03，transform 过渡 180ms；回落 500ms；曲线均为 `cubic-bezier(.2,.9,.3,1)` |
| 接地阴影 | 独立 floor；soft/hard 两层 radial-gradient 伪元素，默认 ground 宽为 82%；hover soft scale 1.12 / opacity .75，hard scale .86 / opacity .45；opacity 400ms，transform 500ms，同上曲线 |
| 筛选增删 | `AnimatePresence mode="popLayout" initial={false}`，列表项使用稳定 `id` key；入/出 opacity 0↔1、scale .94↔1、blur 10px↔0，280ms，`ease:[.3,1,.4,1]` |
| 筛选位置变化 | 每项 `layout`；spring stiffness 260、damping 32；Wishlist section 使用 `layout="position"`，同样 spring，淡入淡出 280ms |
| Wishlist 阴影 | soft 阴影隐藏，hard 阴影变成 1.5px dashed 椭圆轮廓，以视觉表现“尚未拥有” |

以上数值直接来自 [页面 JS](https://www.ashwinexe.com/_next/static/chunks/app/(pages)/things/page-fd9a8dfbe0616851.js) 和 [页面 CSS](https://www.ashwinexe.com/_next/static/css/5a48a76fec8f7cdb.css)。`MotionConfig reducedMotion="user"` 与 CSS reduced-motion 分支均存在；CSS 会停掉容器入场和物体 transform，但不能宣称原站关闭了所有 opacity/filter/阴影动画。类别按钮有 `aria-pressed`，按钮和链接有 `focus-visible` 样式；这些语义也应保留。

## 浏览器交互核对

实际访问[原页面](https://www.ashwinexe.com/things)并点击原生控件，结果与代码一致：

| 选择 | 持有列表 | Wishlist |
| --- | --- | --- |
| All | 21 | 3 |
| Tech | 13 | 1 |
| Lego | 4 | 整个 section 隐藏 |
| Coffee | 4 | 2 |

1024px 视口为 4/3 行、768px 为 3/2 行、390px 为两列。悬停 iPhone 链接时，实测 CSS 变量为 `--rx:3.89deg / --ry:2.13deg / --sx:-1.5px`，object 的计算矩阵同时包含 −9px 的 Y 位移和约 1.03 倍缩放。物品确实是新标签页外链；dark 按钮会给根元素设置 `dark` 类，实测背景为 `rgb(17,17,15)`。本次截图及交互记录保存在 `/tmp/ashwin-views/1440.png`、`390.png` 与 `interactions.json`，临时文件不作为长期交付资源。

## 资源：透明剪影是效果的重要前提

图像 URL 规则为 `https://www.ashwinexe.com/images/things/{id}.webp`，原始 URL 来自页面 bundle；HTML 也会请求 Next Image 优化后的 `/_next/image?url=…` 变体。[页面 JS](https://www.ashwinexe.com/_next/static/chunks/app/(pages)/things/page-fd9a8dfbe0616851.js)、[HTML](https://www.ashwinexe.com/things)

| 类别 | 原始资源 URL |
| --- | --- |
| Tech | [iphone.webp](https://www.ashwinexe.com/images/things/iphone.webp)、[fitbit.webp](https://www.ashwinexe.com/images/things/fitbit.webp)、[watch.webp](https://www.ashwinexe.com/images/things/watch.webp)、[airpods-pro.webp](https://www.ashwinexe.com/images/things/airpods-pro.webp)、[airpods.webp](https://www.ashwinexe.com/images/things/airpods.webp)、[ps5.webp](https://www.ashwinexe.com/images/things/ps5.webp)、[xbox.webp](https://www.ashwinexe.com/images/things/xbox.webp)、[switch.webp](https://www.ashwinexe.com/images/things/switch.webp)、[kindle.webp](https://www.ashwinexe.com/images/things/kindle.webp)、[xm4.webp](https://www.ashwinexe.com/images/things/xm4.webp)、[mic-mini.webp](https://www.ashwinexe.com/images/things/mic-mini.webp)、[power-bank.webp](https://www.ashwinexe.com/images/things/power-bank.webp)、[charmera.webp](https://www.ashwinexe.com/images/things/charmera.webp) |
| Lego | [falcon.webp](https://www.ashwinexe.com/images/things/falcon.webp)、[store.webp](https://www.ashwinexe.com/images/things/store.webp)、[dunk.webp](https://www.ashwinexe.com/images/things/dunk.webp)、[bamboo.webp](https://www.ashwinexe.com/images/things/bamboo.webp) |
| Coffee | [subko.webp](https://www.ashwinexe.com/images/things/subko.webp)、[blue-bottle.webp](https://www.ashwinexe.com/images/things/blue-bottle.webp)、[timemore.webp](https://www.ashwinexe.com/images/things/timemore.webp)、[moka.webp](https://www.ashwinexe.com/images/things/moka.webp) |
| Wishlist | [switch-2.webp](https://www.ashwinexe.com/images/things/switch-2.webp)、[bacha.webp](https://www.ashwinexe.com/images/things/bacha.webp)、[aeropress.webp](https://www.ashwinexe.com/images/things/aeropress.webp) |

抽样实际下载并读取了 `iphone.webp`（912×1100，102122 bytes）和 `moka.webp`（736×804，43338 bytes）：两者均是 RGBA，alpha 范围 0–255。**透明背景是资源本身提供的，CSS 只补阴影与位移。** 其余 URL 已从代码确认，未逐张下载检查透明度。样本保存在 `/tmp/ashwin-research/`，没有放进本站资源目录。[iPhone 原图](https://www.ashwinexe.com/images/things/iphone.webp)、[Moka 原图](https://www.ashwinexe.com/images/things/moka.webp)

首屏预加载的拉丁字符字体文件为 [Bricolage Grotesque](https://www.ashwinexe.com/_next/static/media/9d5a263311222317-s.p.woff2) 与 [JetBrains Mono](https://www.ashwinexe.com/_next/static/media/558ca1a6aa3cb55e-s.p.woff2)。这仅用于识别原站排版；本站已有字体和视觉语言，不等于需要新增这两种字体。[字体定义](https://www.ashwinexe.com/_next/static/css/6a4ebec3ed29a632.css)

## 对本站的适配边界

当前实现入口是 [`UsesGrid.astro`](../src/components/UsesGrid.astro)，数据来自 [`uses.ts`](../src/data/uses.ts)。组件同时服务首页 folder overlay 与独立 `/what-i-use`，因此只重做内部陈列不能破坏这两个入口；继续使用现有 `ParentLink` 和 overlay/standalone 模式。[页面路由](../src/pages/[slug].astro)、[父级导航约定](./navigation.md)

应保留的集成契约包括 `data-uses-stage`、`.uses-stage.is-open / .is-carrying`、`data-uses-close`、`data-use-logo-target`、`data-use-preview-logo`、`data-use-reveal`。首页 folder 的开启/关闭和 logo 搬运依赖这些 hook，而非只依赖视觉相似度。[Folder.astro](../src/components/Folder.astro)、[UsesGrid.astro](../src/components/UsesGrid.astro)

本站已安装 React 与 `motion`，筛选重排使用现有 `motion/react` 和局部 React 组件；陈列布局和 hover 使用 CSS 与 pointer 事件，没有迁移 Next.js、引入 GSAP 或添加新依赖。[package.json](../package.json)

原站的 `html.dark` 条件和 `--ink / --muted / --rust` 等页面变量需要映射到本站现有 `data-home-theme` 与 Uses 局部变量，避免导入整份全局样式而改变其他页面。[原版 Things CSS](https://www.ashwinexe.com/_next/static/css/5a48a76fec8f7cdb.css)、[本站主题控制](../src/scripts/theme-dial.ts)

最关键的内容差异是：原页以**实体物品透明剪影**为主，本站以**软件 logo、slogan、AI 工具分组**为主。可借鉴无卡片边框的陈列、大小对比、轻抬升、清晰分类，但软件图标不能机械套用每件实体物品的高度、地面投影与 maker 字段。`banner` 图片和现有 Grok Bot 动画也需要独立适配。不要凭原站增加本站没有的数据、Wishlist 或购买外链。[本站数据模型](../src/data/uses.ts)、[现有展示](../src/components/UsesGrid.astro)

当前本站有 51 项：AI 29（Products 5、Trying Now 10、Browsers 4、Agent Infrastructure 4、Skills 6）、Software 9、Archived 5、Hardware 8。首页 folder 预览为 ChatGPT、Claude Code、Dia、Raycast。改版的分类与默认视图需要容纳这份实际内容，而非照搬原站三类实体物品。[uses.ts](../src/data/uses.ts)

## 证据快照与限制

- 生产 HTML：67444 bytes；SHA-256 `d977a1afb30396660e12cd1bde2cd7f828230f103c6d7e1a3baf16070add474f`。
- Things route JS：9470 bytes；SHA-256 `f136d5f86bb23ba0c86a2d46fa67c057f47cd752fedddd0d10c77a78f551ffc0`。
- Things CSS：6056 bytes；SHA-256 `72ec4fc4d4a752fd4bd3d6cd2b6baa01693dfff41927397573e67154f53f193d`。
- RSC build id：`g2blgm-46fY-AhKFerVUb`。这些是本次抓取版本的事实，原站后续部署可能改变。
- 相关公开仓库声明 Next `^14.2.0`、React `^18.2.0`、framer-motion `^12.29.3`、Tailwind `^3.4.0`，但不能把它当作当前 Things 部署的精确版本清单。[已核实提交的 package.json](https://github.com/ashwinexe/home/blob/76fa2efb0329ef49becc26d4ff6d10c87cc5d923/package.json)
- 没有使用第三方复刻文章作为源码证据；没有把压缩生产 JS 还原成虚构的“作者原始 TSX”；没有运行作者项目、完整无障碍审计或复制资源。

## 落地记录

- 入口仍是 `UsesGrid.astro` 的 overlay/standalone 两种模式；原版交互移植到 `UsesShelf.tsx` 与局部 CSS，51 项本站数据和原链接保留。字体、配色、导航与本站保持一致。
- 保留原版交替行、手机两列、指针倾斜、双层地面阴影、popLayout 和原弹簧参数。独立页保留 500ms 入场，首页交给现有文件夹飞行完成入场。
- 文件夹目标改为实时查询；重新进入时同步恢复 All。关闭筛选视图时，没有展示的预览图标在文件夹内部归位，避免读取已移除节点的位置。
- 原 Grok SVG 在筛选期间暂存而不销毁，保留同一动画节点和状态。五张透明硬件图按实际 alpha 边界进行 CSS 显示裁切，原图片文件未改；三张原有 JPEG 保留照片形式。
- TypeScript 检查、生产构建、7 项数据/导航检查通过。导航检查修正了将 Inspired 链接的 `data-selector` 文本误判为真实父导航属性的问题，并补了回归用例。
- Chrome 检查 1440/768/390/320px，WebKit 检查 1440/390/320px；分类、连续切换、悬停、深色、减少动态、Grok 节点复用、筛选后关闭/重开均通过。最终硬件图再次在两种引擎的桌面/手机尺寸核对。
- 构建保留 42 个活跃开发依赖文件；构建后实际开发首页的水合、文件夹回收、邮件和工具图标检查通过。
- 未使用实体 iPhone 验证。

实现来源与保留范围见 [`uses-shelf/SOURCE.md`](../src/components/uses-shelf/SOURCE.md)。
