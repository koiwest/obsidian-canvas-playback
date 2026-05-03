# Canvas Playback

在 Obsidian Canvas 里连接 PDF、PPT、视频、图片、网页和笔记，然后按路径顺序全屏播放。

Play connected PDFs, slide decks, videos, images, web pages, and notes from your Obsidian Canvas as a fullscreen presentation.

**Connect files. Play the flow.**

![Canvas Playback demo](docs/assets/canvas-playback-demo.gif)

![Canvas Playback canvas path](docs/assets/canvas-playback-1.png)

![Canvas Playback fullscreen player](docs/assets/canvas-playback-2.png)

## 它解决什么

Canvas 本来就是思路的地图。Canvas Playback 做的事很简单：把这张地图变成一条可播放的路径。你把文件放进 Canvas，用线连接顺序，然后按下播放。每一个节点都成为一个全屏片段。

Canvas is already a map of thought. Canvas Playback turns that map into a playable path. Drop files into a Canvas, connect them in order, then play. Each node becomes a fullscreen step.

## 最重要的原则

PDF、PPT、Keynote、ODP 这类演示文件必须逐页播放。每一步只显示当前页，不能退回到连续文档视图，不能把前后页混在同一个画面里。这是这个插件的核心，不是一个可选细节。

Slide documents such as PDF, PowerPoint, Keynote, and ODP must play page by page. One step means one page. The player must never fall back to a mixed multi-page document viewer. This is the core invariant, not a detail.

## 功能

- 按 Canvas 连接线决定播放顺序。
- 无连接线时，按从左到右、从上到下播放。
- PDF 逐页展开为独立播放步骤。
- PPT、PPTX、Keynote、ODP 等演示文件使用同名 PDF 导出逐页播放。
- 支持图片、视频、音频、Markdown、`.deck`、网页链接和纯文本节点。
- MP3 等音频文件使用适配主视觉的唱片播放器。
- 左侧隐藏式 slide index 可快速跳转，并保持当前播放画面的干净。
- 支持 19 套设计系统。

## Features

- Uses Canvas edges as the playback order.
- Falls back to left-to-right, top-to-bottom order when no edges exist.
- Expands PDFs into individual page steps.
- Plays PowerPoint, Keynote, and ODP files through same-name PDF exports.
- Supports images, videos, audio, Markdown, `.deck`, web links, and text nodes.
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

## 演示文件规则

`ppt`、`pptx`、`key`、`odp` 这类文件需要在同一目录放一份同名 PDF。插件会播放那份 PDF，并逐页展开。例如：

```text
demo.pptx
demo.pdf
```

## Slide File Rule

Files such as `ppt`, `pptx`, `key`, and `odp` need a same-name PDF export next to the source file. Canvas Playback plays the PDF page by page. For example:

```text
demo.pptx
demo.pdf
```

## 媒体支持

图片：`png`, `jpg`, `jpeg`, `webp`, `gif`, `svg`, `avif`, `bmp`

视频：`mp4`, `mov`, `m4v`, `webm`, `ogv`, `avi`, `mkv`

音频：`mp3`, `m4a`, `aac`, `wav`, `ogg`, `opus`, `flac`

笔记与文本：`md`, `markdown`, `deck`

## Media Support

Images: `png`, `jpg`, `jpeg`, `webp`, `gif`, `svg`, `avif`, `bmp`

Videos: `mp4`, `mov`, `m4v`, `webm`, `ogv`, `avi`, `mkv`

Audio: `mp3`, `m4a`, `aac`, `wav`, `ogg`, `opus`, `flac`

Notes and text: `md`, `markdown`, `deck`

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

## 展示素材

现在已有一段动图和两张展示图，放在 `docs/assets/`。

- `canvas-playback-demo.gif`
- `canvas-playback-1.png`
- `canvas-playback-2.png`

## Showcase Assets

The repository includes one animated demo and two screenshots under `docs/assets/`.

- `canvas-playback-demo.gif`
- `canvas-playback-1.png`
- `canvas-playback-2.png`

## License

MIT for the plugin code. Vendored PDF.js files retain their Apache-2.0 license in `vendor/pdfjs/LICENSE`.
