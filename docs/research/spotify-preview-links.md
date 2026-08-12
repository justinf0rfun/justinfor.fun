# Spotify 链接能否保留当前音乐预览

调研日期：2026-08-12

## 结论

**部分可以，但不能保证。** 把卡片的外链从 Apple Music 换成 Spotify，不会天然破坏预览；本项目的“去哪里打开歌曲”和“播放哪段预览”本来就是两个独立数据。但 Spotify 普通曲目链接不是音频地址。只有某首歌仍有非空的 30 秒 `preview_url` 时，才可以近似保留现有的匿名自定义预览；Spotify 已将该字段标为 **Nullable** 和 **Deprecated**，所以“Spotify 有这首歌”不等于“Spotify 提供可用预览”。[Spotify Get Track](https://developer.spotify.com/documentation/web-api/reference/get-track)

完整保留“匿名、提前下载、隐藏式自定义播放器、纯 hover 即播”不是稳妥方案：字段不可靠，浏览器会拦截带声音的 hover 播放，而且当前把整段音频抓成 Blob 的做法与 Spotify 对本地缓存音频内容的限制难以兼容。[Spotify Developer Terms](https://developer.spotify.com/terms) [Chrome autoplay policy](https://developer.chrome.com/blog/autoplay/) [WebKit autoplay policy](https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/)

## 当前站点的实际约束

- [`MusicTrack`](../../src/data/music.ts#L1-L11) 用 `previewUrl` 播放音频、用 `appleMusicUrl` 打开平台页面，两者互不依赖；不过平台字段名和无障碍文案仍写死为 Apple Music，[需要在真正接入时泛化](../../src/components/MusicShowcase.astro#L97-L104)。
- 播放器会跨域 `fetch` 完整音频、转成 Blob URL、按 URL 缓存到内存，再循环播放；首页五首会立即预加载，其他歌曲接近视口时预加载。[播放器实现](../../src/scripts/music-preview.ts#L24-L50) [预加载策略](../../src/scripts/music-preview.ts#L101-L123)
- 精细指针移入即调用 `play()`，移出即暂停；点击按钮是浏览器拦截自动播放后的兜底。[交互实现](../../src/scripts/music-preview.ts#L125-L167)
- `Time` 已经在用 Spotify CDN 的 MP3 预览，说明当前播放器在技术上支持该格式。[曲目数据](../../src/data/music.ts#L63-L73) 该地址在调研日实测返回 `200`、`Content-Type: audio/mpeg` 和 `Access-Control-Allow-Origin: *`。[当前预览文件](https://p.scdn.co/mp3-preview/516bcfab09ad9d9b2a8696f34885cfbebf6fb8c1)

## Spotify 官方能力边界

### 1. 直接 30 秒预览：最接近现状，但不可靠

Spotify 的 `preview_url` 是 30 秒 MP3 直链，但官方同时注明它可以为 `null` 且已废弃。[Get Track 字段说明](https://developer.spotify.com/documentation/web-api/reference/get-track) Spotify 还在 2024 年取消了新应用和 Development Mode 应用从 multi-get `SimpleTrack` 响应取得 30 秒预览 URL 的能力，表明这不是可长期依赖的接口承诺。[Spotify Web API 变更公告](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api)

发现该 URL 也不是匿名 API 操作：Spotify Web API 的每个请求都需要授权令牌；当前 Development Mode 还要求应用所有者有 Premium。[API authorization](https://developer.spotify.com/documentation/web-api/concepts/api-calls) [Quota modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes) 访客能否匿名播放某个已保存的 CDN URL，只能视为该具体 URL 当时的运行状态，不能视为官方永久保证。

另外，Spotify 条款禁止本地缓存 Spotify Content，例外仅包括临时缓存元数据/封面和面向 Premium 的 Conditional Downloads。当前代码提前下载完整音频并持有 Blob，因此不建议把这一预加载路径用于新的 Spotify 预览；应改成 Spotify 官方 Embed，或让浏览器从直链按需流式播放而不创建应用管理的 Blob 副本。[Spotify Developer Terms](https://developer.spotify.com/terms)

### 2. Embed：官方降级方案，但不能原样保留当前 UI

Spotify Embed / iFrame API 可以加载曲目并调用 `play()`、`pause()`；部分环境只会播放不足 30 秒的片段。[iFrame API](https://developer.spotify.com/documentation/embeds/references/iframe-api) [Embed troubleshooting](https://developer.spotify.com/documentation/embeds/tutorials/troubleshooting) 但 Widget 必须按 Spotify 提供的形式显示，不能遮挡或改变格式，因此不能合法地当作隐藏音频引擎维持当前完全自定义的卡片播放器。[Widget Terms](https://developer.spotify.com/documentation/embeds/terms)

### 3. Web Playback SDK：不满足匿名要求

Web Playback SDK 需要访问令牌和有效 Spotify Premium 账户；无有效 Premium 会触发 `account_error`。[SDK getting started](https://developer.spotify.com/documentation/web-playback-sdk/tutorials/getting-started) [SDK reference](https://developer.spotify.com/documentation/web-playback-sdk/reference) 因此它适合登录后的全曲播放，不适合当前无需登录的访客预览。

### 4. Hover 自动播放仍受浏览器限制

这与音源平台无关。Chrome 只在用户已与站点交互、媒体参与度较高等条件下允许带声音自动播放，并建议用 `click` 触发；Safari 官方建议假定音视频必须经用户点击才能播放。[Chrome autoplay policy](https://developer.chrome.com/blog/autoplay/) [WebKit autoplay policy](https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/) Spotify 自己也明确说明 iFrame API 的无交互 `play()` 并非对所有浏览器和用户都有效。[Spotify iFrame API notes](https://developer.spotify.com/documentation/embeds/references/iframe-api)

## 政策要求与建议方案

使用 Spotify Audio Preview Clip 时，必须用 Spotify 标识清楚归因、链接回对应的 Spotify 内容，只能用于推广该内容，不能作为独立产品，并且只能在完整曲目可用的地区播放。[Spotify Developer Policy](https://developer.spotify.com/policy) 当前 `Time` 使用 Spotify 预览却链接到 Apple Music，不满足 Spotify 明示的 link-back 条件。

建议实现策略：

1. 将平台外链泛化为 `service + url`，Spotify-only 歌曲链接到官方 `open.spotify.com/track/...`；Spotify URL 的官方用途是定位并打开 Spotify 内容，不是直接音频源。[Spotify URIs and IDs](https://developer.spotify.com/documentation/web-api/concepts/spotify-uris-ids)
2. `previewUrl` 继续与平台外链分离。只有官方 API 当时返回非空 `preview_url` 时才启用预览；为 Spotify 曲目补齐 Spotify 标识和回链。
3. Spotify 预览不要沿用“提前 fetch 成 Blob”的实现。优先按需使用直接音频流；如果要最稳妥地遵循官方播放路径，则使用可见的 Embed，并接受其 UI 和点击播放行为。
4. `preview_url` 为 `null` 时不要抓取页面或猜测 CDN 地址；显示无预览状态，点击后去 Spotify。Spotify 条款禁止用机器人、检索工具等未授权方式抓取 Spotify Service 或 Spotify Content。[Spotify Developer Terms](https://developer.spotify.com/terms)
