# Open Source Checklist

## Repository

- [ ] Move source into `src/` and keep `main.js` as a generated release artifact.
- [ ] Add TypeScript build with `esbuild`, following the Obsidian sample plugin shape.
- [ ] Bundle PDF.js into `main.js`, or document a release flow that includes `vendor/pdfjs`.
- [ ] Add screenshots or a short GIF of the canvas-to-presentation flow.
- [ ] Replace placeholder author metadata if publishing under a personal or company account.

## Obsidian Release

- [ ] Keep `manifest.json`, `versions.json`, and `package.json` versions in sync.
- [ ] Upload release assets expected by Obsidian: `manifest.json`, `main.js`, and `styles.css`.
- [ ] Decide whether to remove the default `Cmd+Option+P` hotkey before community submission. It is useful locally, but the official checklist advises against default hotkeys for public plugins.
- [ ] Confirm `isDesktopOnly` remains correct while PDF bitmap rendering depends on desktop file paths.
- [ ] Test in a dedicated development vault before testing in a real vault.

## Quality

- [ ] Run `npm run check`.
- [ ] Test a canvas with one PDF, multiple PDFs, one image, one Markdown file, and one URL.
- [ ] Test missing PPTX/Keynote PDF exports.
- [ ] Test keyboard-only playback from start to finish.
- [ ] Test the left-edge slide index with pointer hover and keyboard focus.
- [ ] Run `npm run verify:canvas` against the Spark Lab experiment canvas before changing playback order code.
