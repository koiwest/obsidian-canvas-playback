# Canvas Playback

在 Obsidian Canvas 里连接 PDF、PPT、视频、图片、网页和笔记，然后按路径顺序全屏播放。

Play connected PDFs, slide decks, videos, images, web pages, and notes from your Obsidian Canvas as a fullscreen presentation.

**Connect files. Play the flow.**

![Canvas Playback canvas path](docs/assets/canvas-playback-1.png)

![Canvas Playback fullscreen player](docs/assets/canvas-playback-2.png)

![Canvas Playback demo](docs/assets/canvas-playback-demo.gif)

工作的时候，我经常要在投屏电视上连续播放很多个不同格式、不同来源的 PPT 类文件。在文件之间切换软件很难受，直接用 Apple 的 preview 播放又经常不可控，有时候不全屏，有时候不完整。我很喜欢飞书的内置放映功能，所以常常把十几个文件发给飞书里的自己，再在对话框里依次点击各个文件。但显得我很忙乱，而且很不优雅！

后来我想到，Canvas 本来就是极好的放映控制台。我可以用箭头随时指向和更改播放顺序，他像一个观察者的控制台一样，好像是更高维度来控制电脑（所以我贼喜欢 canva 和 heptabase 、affine 类）；我的生活又已经和本地 Agent 融在一起，Obsidian 是我最常用的软件之一。所以我想，可以做 Canvas Playback。和我预料得差不多，它很优雅。

At work, I often need to play many PowerPoint-like files on a TV, one after another: different formats, different sources. Switching between apps is painful. Playing directly with Apple's Preview is often uncontrollable; sometimes it is not fullscreen, sometimes it is incomplete. I really like Feishu's built-in presentation feature, so I often send a dozen files to myself in Feishu, then click through them one by one in the chat. But it makes me look busy and very inelegant!

Then I realized that Canvas is already an excellent presentation console. I can use arrows to point to files and change the playback order at any time. It feels like an observer's console, as if I am controlling the computer from a higher dimension (which is why I love tools like Canva, Heptabase, and Affine so much). My life is already blended with local agents, and Obsidian is one of the apps I use most. So I thought: I can make Canvas Playback. As I expected, it is elegant.

## 功能

- 按 Canvas 连接线决定播放顺序；有多条连接链时，从最左上方的火车头节点开始，只播放这一条链。
- 无连接线时，按从左到右、从上到下播放。
- PDF 逐页展开为独立播放步骤。
- PPTX、PPSX、POTX 等新版 PowerPoint 文件会在插件内直接解析并逐页渲染，按键行为和 PDF 一致；PPTX 内部 slide 跳转会映射到对应播放步骤，嵌入的视频/音频会作为可播放媒体层叠在 slide 上。旧 `.ppt` / `.pps` / `.pot` 会优先使用同名 PDF，或交给 Microsoft PowerPoint 原生放映兜底；ODP 仍会走 PDF 链路。`.key` 文件会在插件内解析并按页播放；当前先使用包内嵌的 slide thumbnails。
- 支持图片、视频、音频、Markdown、`.deck`、网页链接、Figma、Gamma、Canva、Google Slides、Prezi 等在线演示链接和纯文本节点。
- 打开 Canvas 时会扫描主播放链，并提前缓存前 N 页 Figma Slides PNG，减少播放时等待。
- 配置 Figma access token 后，Figma Slides 会展开为逐页本地高清 PNG，按键行为和 PDF 一致。
- 未配置 token、token 无权限，或 Figma REST 无法读取该 Slides 结构时，Figma 会降级为 Live Embed Mode，并明确提示这不是像素级完美播放模式。
- MP3 等音频文件使用适配主视觉的唱片播放器。
- 左侧隐藏式 slide index 可快速跳转，并保持当前播放画面的干净。
- 支持 19 套设计系统。

## Features

- Uses Canvas edges as the playback order; when multiple chains exist, playback starts from the top-left train-head node and only follows that chain.
- Falls back to left-to-right, top-to-bottom order when no edges exist.
- Expands PDFs into individual page steps.
- Renders modern PowerPoint decks (`.pptx`, `.ppsx`, `.potx`) inside Canvas Playback itself instead of handing them off to another app. PowerPoint slides expand into page steps like PDFs, internal slide jumps map to the matching playback step, and embedded video/audio is overlaid as playable media. Legacy `.ppt` / `.pps` / `.pot` files use a sibling PDF when available, or fall back to native Microsoft PowerPoint slideshow playback; ODP sources still resolve through PDFs. `.key` files are parsed inside the plugin and currently play through embedded slide thumbnails.
- Supports images, videos, audio, Markdown, `.deck`, web links, Figma, Gamma, Canva, Google Slides, Prezi, and other online presentation links.
- Scans the main playback chain when a Canvas opens and preloads the first N Figma Slides PNGs into the local cache.
- With a Figma access token configured, Figma Slides expand into local high-resolution PNG page steps controlled like PDFs.
- Without a token, permission, or a REST-readable Slides structure, Figma falls back to Live Embed Mode with an explicit non-pixel-perfect playback warning.
- Renders audio files with a record-style player matched to the visual system.
- Provides a hidden left-edge slide index for fast navigation without permanent chrome.
- Includes 19 switchable design systems.

## 使用

1. 打开一个 `.canvas` 文件。
2. 运行 `Canvas Playback: Play Current Canvas`，或按 `Cmd+Option+P`。
3. 使用键盘播放：

| 操作 | 快捷键 |
| --- | --- |
| 下一页 | `Space`, `ArrowRight`, `ArrowDown`, `PageDown` |
| 上一页 | `Shift+Space`, `ArrowLeft`, `ArrowUp`, `PageUp` |
| 第一页 | `Home` |
| 最后一页 | `End` |
| 切换全屏 | `F` |
| 退出全屏，再关闭播放器 | `Esc` |

## Usage

1. Open a `.canvas` file.
2. Run `Canvas Playback: Play Current Canvas`, or press `Cmd+Option+P`.
3. Present with the keyboard:

| Action | Shortcut |
| --- | --- |
| Next | `Space`, `ArrowRight`, `ArrowDown`, `PageDown` |
| Previous | `Shift+Space`, `ArrowLeft`, `ArrowUp`, `PageUp` |
| First | `Home` |
| Last | `End` |
| Toggle fullscreen | `F` |
| Exit fullscreen, then close | `Esc` |

## 媒体支持

图片：`png`, `jpg`, `jpeg`, `webp`, `gif`, `svg`, `avif`, `bmp`

视频：`mp4`, `mov`, `m4v`, `webm`, `ogv`, `avi`, `mkv`。`.mov` / `.m4v` 会按 `video/mp4` 加载，复用与 MP4 相同的解复用器（两者同属 ISO 基础媒体容器）；实际播放仍取决于当前 Electron/Chromium 支持的编码，H.264/AAC 最稳。

音频：`mp3`, `m4a`, `aac`, `wav`, `ogg`, `opus`, `flac`

笔记与文本：`md`, `markdown`, `deck`

在线演示：支持从 Canvas 链接节点、Markdown 笔记和 Canvas 文字卡片中自动识别 Figma、Gamma、Canva、Google Slides、Prezi、Pitch、Tome、Beautiful.ai、Genially 等链接。

Keynote：`.key` 文件会在插件内直接解析。当前版本先使用包内嵌的每页缩略图进行内部逐页播放，不走 Keynote 外部放映，也不走 PDF 导出链路。

Figma Slides：配置 token 后，会通过 Figma REST API 读取文件结构，按文档树顺序寻找 `SLIDE` 节点，批量导出为本地缓存的高清 PNG，并由 Canvas Playback 自己逐页播放。缓存路径会使用 Figma `version` / `lastModified` 指纹；文件变化后会自动进入新的缓存目录。未配置 token、token 无权限，或 Figma REST 无法读取该 Slides 结构时，会降级为 Live Embed Mode，并提示这不是像素级完美播放模式。

## Media Support

Images: `png`, `jpg`, `jpeg`, `webp`, `gif`, `svg`, `avif`, `bmp`

Videos: `mp4`, `mov`, `m4v`, `webm`, `ogv`, `avi`, `mkv`. `.mov` / `.m4v` are loaded as `video/mp4` so they reuse the same demuxer as MP4 (both are ISO base-media containers); actual playback still depends on codecs supported by the current Electron/Chromium build, with H.264/AAC being the safest.

Audio: `mp3`, `m4a`, `aac`, `wav`, `ogg`, `opus`, `flac`

Notes and text: `md`, `markdown`, `deck`

Online presentations: automatically detects Figma, Gamma, Canva, Google Slides, Prezi, Pitch, Tome, Beautiful.ai, Genially, and similar links from Canvas link nodes, Markdown notes, and Canvas text cards.

Keynote: `.key` files are parsed directly inside the plugin. The current version plays the embedded per-slide thumbnails inside Canvas Playback itself, without switching to external Keynote or exporting through PDF.

Figma Slides: with a token configured, Canvas Playback reads the file through the Figma REST API, finds `SLIDE` nodes in document-tree order, exports them into locally cached high-resolution PNGs, and plays them as first-class Canvas Playback steps. Cache directories are fingerprinted with Figma `version` / `lastModified`, so file changes invalidate old renders. Without a token, permission, or a REST-readable Slides structure, Figma falls back to Live Embed Mode with an explicit non-pixel-perfect playback warning.

## 安装

从 GitHub Release 下载 `main.js`、`manifest.json`、`styles.css`、`design-systems.js` 和 `vendor/pdfjs/`，放入：

```text
<Vault>/.obsidian/plugins/obsidian-canvas-playback/
```

然后在 Obsidian 的 Community plugins 里启用 `Canvas Playback`。

## Installation

Download `main.js`, `manifest.json`, `styles.css`, `design-systems.js`, and `vendor/pdfjs/` from the GitHub release, then place them in:

```text
<Vault>/.obsidian/plugins/obsidian-canvas-playback/
```

Enable `Canvas Playback` from Obsidian Community plugins.

## 开发

当前仓库保留 Obsidian 可直接加载的发布文件，同时逐步向标准插件工程演进。基础检查：

```bash
npm run check
npm run verify:canvas
```

## Development

The repository keeps Obsidian-loadable release files at the root while moving toward a standard plugin project shape. Basic checks:

```bash
npm run check
npm run verify:canvas
```

## 致谢

- [typeUI](https://github.com/bergside/typeui)：我用 slock 很爽的时候，也发现了这个好看的 Design Skill。
- Codex 5.5：虽然很快，20 分钟就把我的额度烧完了，但它真的很强。尤其是在我 Claude Code 周额度用完的时候，很感谢。
- Obsidian & Logseq：很喜欢。

## Thanks

- [typeUI](https://github.com/bergside/typeui): I found this beautiful Design Skill while happily using slock.
- Codex 5.5: It burned through my quota in about 20 minutes, but it is genuinely strong. I am especially grateful when my Claude Code weekly quota is gone.
- Obsidian & Logseq: I love them.

## License

MIT for the plugin code. Vendored PDF.js files retain their Apache-2.0 license in `vendor/pdfjs/LICENSE`.
