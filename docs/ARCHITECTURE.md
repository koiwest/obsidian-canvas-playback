# Architecture

Canvas Playback keeps the root files loadable by Obsidian while the project matures toward a bundled TypeScript plugin shape.

## Core Invariant

Slide-like files must play as isolated fullscreen steps. PDF pages are rendered to canvas bitmaps. PowerPoint files (`.ppt`, `.pptx`, `.pps`, `.pot`) are counted from the OOXML package, expanded into first-class `pptx-page` steps, and rendered lazily with the PPTX renderer when a page becomes active. Internal PowerPoint slide jumps are mapped back to Canvas Playback indices. Keynote files (`.key`) are parsed inside the plugin and currently expand into internal slide-thumbnail steps. ODP sources still resolve to PDFs. Figma Slides are rendered through the Figma API into local PNG steps when a token is available. Do not reintroduce an iframe PDF viewer or Figma iframe as the primary playback path, because that breaks page isolation.

## Runtime Files

- `main.js` contains the Obsidian plugin runtime.
- `design-systems.js` mirrors theme tokens as a design-system reference. Runtime tokens are currently inlined in `main.js` because Obsidian release plugins are safest when `main.js` is self-contained.
- `styles.css` owns the stage, slide index, media surfaces, and issue UI.
- `vendor/pdfjs/` contains the PDF.js module and worker used for single-page bitmap rendering.
- `scripts/verify-canvas.js` validates a real Canvas path outside Obsidian.

## Playback Pipeline

1. Read the active `.canvas` file.
2. Analyze valid directed edges and derive one playback chain.
3. Normalize each Canvas node into a playable item.
4. Expand PDFs into `pdf-page` items, parse PowerPoint nodes into `pptx-page` items, parse `.key` files into cached `keynote-image` items, auto-convert remaining local deck files into cached PDFs when needed, and expand Figma Slides into cached `figma-image` items.
5. Render the current item first.
6. Preload nearby items only after the active slide has switched.

## Figma Slides

Figma Slides use Native Render Mode by default. The plugin reads `GET /v1/files/:key`, finds `SLIDE` nodes in document-tree order, calls `GET /v1/images/:key` with `format=png&scale=2`, downloads the returned temporary image URLs into `cache/figma/`, and renders only those local PNG files. Cache directories are fingerprinted with Figma `version` and `lastModified`, plus render options, so file changes invalidate old images.

When a Canvas opens, the background preloader scans only the main playback chain and caches the configured first N Figma pages. If no token is configured, the token cannot access the file, or Figma returns an unsupported file type for the Slides structure endpoint, playback falls back to Figma Live Embed Mode with an explicit non-pixel-perfect warning.

## Design System

The left-edge slide index is the reference component for the current visual language: sharp borders, compact type, visible active state, and no persistent chrome over the slide. New surfaces should reuse `--cp-*` tokens and preserve that rhythm.

## Repository Direction

The next structural step is to move authored source into `src/`, bundle with `esbuild`, and keep `main.js` as a generated release artifact. Until then, root files remain the working Obsidian plugin and `main.js` should not require local runtime modules.
