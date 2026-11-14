# Moments：Dock 入口与角色舞台

Kind: software — 个人网站交互组件，沿用现有首页，不做整站营销页改版。

Visual direction: 沿用 `DESIGN.md` 的浅灰工作台、窄正文栏和黑色 Dock。角色、日期
标签与动作以用户指定的 OpenAI Dots 为参照；不随机增加其他 kit 视觉效果。

Voice: 第一人称、短句、具体；当前五条内容是经用户允许的示例数据。界面标题只显示 Moments，不显示示例标记、浏览计数或自动浏览入口。

正文气泡右下角显示具体发布时间；不再在日期轴下重复展示场景标签和单独标题。

## 已采用的交互

- **入口**：Say hi 后的 Moments 按钮。桌面显示角色与名称，手机保留角色图标。
- **宽屏**：左侧留白至少 336px、视口高度至少 650px 时，将舞台放在左侧空白中，
  正文保持原位。舞台最大宽度 340px，两侧各留空，不覆盖正文。
- **窄屏**：舞台接在 Dock 上方；手机背景暂时不可操作，Esc、关闭按钮和入口可收起。
  短屏允许舞台内部纵向滚动，日期轴仍使用独立的原生横向滚动。
- **打开**：同一个角色画布从入口移动到舞台。角色落稳后出现气泡与刻度。
- **收起**：文案与刻度先收拢，角色沿返回路径回到入口。保留当前日期与角色。
- **打断**：关闭途中再次打开时，从当前显示位置继续；不重新播放旧的起点。
- **角色**：O / Alfred / Felipe / Iggy / Todd；点击舞台中的角色循环切换，标签颜色同步。
- **Dock 待机**：约 1.25px 的总上下浮动；只增加根节点位移，不改原版骨骼通道。
  鼠标悬停回应一次，正在回应时不重播；触屏不模拟悬停。O 使用一次轻脉冲。
  飞行时平滑去掉增强，舞台里保持原版幅度；减少动态时关闭增强和悬停回应。
- **键盘**：range 支持方向键、Home/End、PageUp/PageDown；角色键盘切换不播放翻转。
  手机弹层内焦点循环，关闭后恢复入口焦点；减少动态偏好会移除飞行和循环动作。

Moments 与 Thoughts 分开：前者放短想法，后者保留长文章。当前没有发帖、点赞计数、
评论或后端写入；所有示例来自 `src/data/moments.ts`。

## 组件和边界

| 模块 | 职责 |
| --- | --- |
| `HomeDock.astro` | 首屏即存在的入口与本地 poster，不依赖聊天加载 |
| `HomeMoments.tsx` | 空间选择、往返、焦点与滚动锁、稳定的 canvas 容器 |
| `MomentsTimeline.tsx` | 首页舞台复用的日期浏览、吸附、刻度、文案与角色选择 |
| `DotsCharacter.tsx` | 本地 poster 与 WebGL 的无空白交接 |
| `src/lib/dots/` | 原版骨骼、毛发、AO、透明颜色处理与角色切换 |
| `src/lib/home-moments.ts` | 留白约束、窄屏边界、飞行几何，可独立测试 |
| `src/lib/moment-timeline.ts` | 刻度影响范围、日期索引与气泡避边 |

HomeMoments 只挂载一次 DotsCharacter。一个固定 portal 容器在 Dock、飞行层、舞台
插槽之间移动，React portal 的目标不变，避免重建 GPU 上下文和姿态闪回。

与现有功能互斥：打开 Moments 会关闭聊天；手机的其它 Dock 操作暂时不可用。
文件夹打开时隐藏舞台和飞行层。展开期间暂停 Dock 的滚动缩放；收起后恢复。

## 复刻依据

参考页面：https://chatgpt.com/features/dots/

原始文件、模型地址、适配细节和 N8AO 许可见 `src/lib/dots/SOURCES.md` 与
`public/moments-reference/sources.json`。当前是实际 GLB 骨骼与着色器，不是 PNG 摇摆。

- 四个 GLB 均包含骨骼；O 使用原版尺寸的环形几何体。
- Alfred / Felipe / Iggy 的 ambient 为 **6 秒循环**：lift `.016 sin(t)`、yaw
  `.045 sin(t)`、roll `.016 sin(2t)`、bendSide `.018 sin(t)`，眼睛和配饰各自采样。
- Todd 保留原版单独的表情通道，不给它额外套上别的角色的 ambient 动作。
- 角色换人保留 spring `330 / 43 / 1.5`，旋转到 −110° 时更换模型，再回正。
- 毛发使用原版确定性纹理、8192 候选实例和按像素尺寸分配的 LOD。
- 灯光、相机 zoom 100、曝光 `.8`、N8AO 与透明边缘的颜色还原按公开实现适配。
- 桌面日期位置 spring `400 / 34 / .65`；拖动刻度增长 spring `500 / 36 / .6`；
  角色拖动倾斜限 ±22°，spring `260 / 19 / .65`。
- 气泡连同发布时间一起进入 440ms、离开 200ms；日期数字翻位 180ms。
- 手机每条间距 176px，指针固定、刻度原生滚动；横纵手势分开处理。
- 日期标签保持原版 116×72 SVG。位置用容器宽度单位的 transform calc 和 container query，初次展开
  不等待 ResizeObserver 才放对角色，避免飞向旧尺寸后再跳到新位置。

## 检查与验收

Node.js 22：

```sh
pnpm exec tsc --noEmit
node --experimental-strip-types scripts/check-moment-timeline.mjs
node --experimental-strip-types scripts/check-home-moments.mjs
node --experimental-strip-types scripts/check-dots-characters.mjs
node --experimental-strip-types scripts/check-dock-character-motion.mjs
node scripts/check-dots-postprocess.mjs
node scripts/check-dock-scroll.mjs
node scripts/check-home-chat-state.mjs
node scripts/check-home-chat.mjs
node scripts/check-vite-cache.mjs
```

- 几何、日期、刻度边界检查通过。
- 四个带骨骼模型、毛发实例、原版 ambient 数值与实际骨骼变形检查通过；减少动态
  和角色切换被打断后仍能稳定回正的检查通过。
- Three r187 后处理适配测试覆盖十二个渲染目标交接，均保留标量首附件。
- Dock 与聊天回归检查通过。生产构建和开发缓存隔离检查通过。
- CUA 内置浏览器控制入口连续超时；已转用用户指定设计 skill 的独立无界面浏览器。
  没有读取用户现有浏览器 profile 或私人标签页。
- 使用 skill 自带 `--probe` 在本地构建页操作 Moments。1440px / 390px 两种宽度已
  验证五角色实际 WebGL 渲染、前后日期、收起、重开、动画中途反向、同一个 canvas、
  保留阅读位置、手机背景锁与关闭后解除锁；两种宽度均无横向页面溢出。
  补测了正反向焦点循环、键盘立即换人、Esc 瞬间关闭，以及隐藏区域的 scroll 事件。
- 可复用的浏览器验收表达式在 `scripts/probe-home-moments.js`。它只操作本地 Moments，
  不会点击 Say hi、发送消息或提交外部服务。浏览器探针通过和整页设计 gate 分开记录。
- 对比截图不是逐帧真机 A/B。真实 iPhone/Safari 的拖动与 GPU 画面仍需真机体验，
  不将数值相同或无界面浏览器通过表述为所有设备逐像素、逐帧相同。

## 设计检查的范围

原站时间轴、多角色待机和本轮 Dock 飞行，是用户明确指定的设计；优先于 taste
skill 对轮播、倾斜和循环动效的通用限制。首页保留既有布局与字体，不为营销整页规则
插入销售按钮、全屏章节或重排现有内容。

整页 gate 的未通过项与豁免另存于 `docs/moments-design-checks.md`，不隐藏或改写为
PASS。已发现检查器会将 Three.js 的 JavaScript `static`、shader chunk 名 `common`
误判为 GLSL 变量；实际 GPU 绘制与这些静态检查分别核对。

关闭的两个约束：closing 阶段不再建立新的背景锁，closed 阶段统一释放；隐藏舞台的 scroll 事件不更新日期。键盘打开后的焦点在 open 提交、移除 inert 后再设置。
