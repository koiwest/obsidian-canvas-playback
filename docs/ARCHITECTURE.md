# Architecture

Canvas Playback keeps the root files loadable by Obsidian while the project matures toward a bundled TypeScript plugin shape.

## Core Invariant

Slide-like files must play as isolated fullscreen steps. PDF pages are rendered to canvas bitmaps. PPT, Keynote, and ODP sources are played through same-name PDF exports. Do not reintroduce an iframe PDF viewer fallback, because that breaks page isolation.

## Runtime Files

- `main.js` contains the Obsidian plugin runtime.
- `design-systems.js` owns theme tokens and the design-system registry.
- `styles.css` owns the stage, slide index, media surfaces, and issue UI.
- `vendor/pdfjs/` contains the PDF.js module and worker used for single-page bitmap rendering.
- `scripts/verify-canvas.js` validates a real Canvas path outside Obsidian.

## Playback Pipeline

1. Read the active `.canvas` file.
2. Analyze valid directed edges and derive one playback chain.
3. Normalize each Canvas node into a playable item.
4. Expand PDFs into `pdf-page` items.
5. Render the current item first.
6. Preload nearby items only after the active slide has switched.

## Design System

The left-edge slide index is the reference component for the current visual language: sharp borders, compact type, visible active state, and no persistent chrome over the slide. New surfaces should reuse `--cp-*` tokens and preserve that rhythm.

## Repository Direction

The next structural step is to move authored source into `src/`, bundle with `esbuild`, and keep `main.js` as a generated release artifact. Until then, root files remain the working Obsidian plugin.
