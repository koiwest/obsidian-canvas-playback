# Canvas Playback Design System

## Context And Goals

Canvas Playback should feel like a focused presentation surface: quiet while slides are playing, crisp when controls appear, and visually aligned with neobrutalist Obsidian-adjacent tooling.

## Design Tokens And Foundations

- The active theme defines `--cp-surface`, `--cp-ink`, `--cp-primary`, `--cp-secondary`, `--cp-danger`, `--cp-muted`, `--cp-radius`, `--cp-border`, and `--cp-shadow`.
- Neobrutalism defaults: surface `#FBFBF9`, ink `#1C293C`, primary `#FDC800`, secondary `#432DD7`, danger `#DC2626`.
- Spacing: `4 / 8 / 12 / 16 / 24 / 32`.
- Radius: maximum `8px`; presentation controls should stay sharper than marketing cards.
- Typography: system UI with Inter-compatible metrics; labels use 10-13px, slide content owns the large type.

## Component-Level Rules

- Stage: must stay full viewport and avoid permanent chrome.
- Slide layer: must render centered content with no layout shift between pages.
- Slide index: must be hidden by default, revealed by pointer proximity to the left edge or keyboard focus.
- Slide index panel: width should stay under 260px and height under 52vh.
- Active item: must use the active theme secondary color, readable text, and theme shadow.
- Hover item: should move 2px right, use white fill, and show a clear border.
- Focus-visible: must be visible and equivalent to hover or stronger.

## Accessibility Requirements And Testable Acceptance Criteria

- All clickable outline items must be buttons.
- Keyboard navigation must support next, previous, first, last, full-screen toggle, and exit.
- The hidden outline must appear on focus-within, not only pointer hover.
- Text contrast must meet WCAG AA against the cream surface.
- The active outline item must set `aria-current="true"`.

## Content And Tone Standards

- Use short labels: `Slides`, `4p`, `PDF`, `MD`.
- Do not explain keyboard shortcuts inside the presentation stage.
- File names should be trimmed rather than wrapped into multiple lines.

## Anti-Patterns And Prohibited Implementations

- Do not keep a persistent bottom toolbar over the slide.
- Do not use large promotional headers inside playback UI.
- Do not use low-contrast translucent gray text for active state.
- Do not make the slide index a full-height drawer unless the user explicitly opens a future detailed view.

## QA Checklist

- Open player: no panel should be visible until the pointer reaches the left edge.
- Hover left edge: panel should slide and fade in smoothly.
- Leave panel: panel should fade and slide out without snapping.
- Press `Space` through the last PDF page: playback should continue to the next canvas node.
- Press `Esc` in full screen: full screen exits without immediately closing the modal.
- Press `Esc` again outside full screen: the player closes.
