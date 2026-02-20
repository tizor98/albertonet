# Albertonet Interface System

## Direction and Feel
- Product direction: developer craft journal (projects + writing + contact), not generic portfolio templates.
- Intended feel: calm, precise, editorial-engineering hybrid.
- Signature expression: shipping narrative language across key sections ("Building / Writing / Shipping") and metadata-driven hierarchy.

## Domain and Color World
- Domain concepts: build logs, changelogs, code review, release status, technical writing, portfolio proof.
- Color world anchors:
  - Graphite ink: `#111827`
  - Paper surface: `#F3F1EA`
  - Surface white: `#FFFFFF`
  - Commit green: `#15803D`
  - Review blue: `#1D4ED8`
  - Warm amber: `#B45309`
  - Issue red: `#B91C1C`

## Depth Strategy
- Strategy: borders-only hierarchy with subtle surface shifts.
- Do not use dramatic shadows for cards or navigation shells.
- Elevation structure:
  - Canvas: `--bg-canvas`
  - Surface layer: `--bg-surface-1`
  - Card/control layer: `--bg-surface-2`
  - Inset controls: `--bg-surface-inset`
- Border progression:
  - Soft: `--border-soft`
  - Default: `--border-default`
  - Strong emphasis: `--border-strong`

## Spacing and Radius
- Base unit: `4px` with an 8px rhythm.
- Preferred spacing scale: `4, 8, 12, 16, 20, 24, 32, 40, 48`.
- Radius scale:
  - Controls: `--radius-control`
  - Surfaces/cards: `--radius-surface`

## Typography
- Primary text stack: `var(--font-poppins), "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif`.
- Metadata and status stack: `--font-mono` with tabular numbers.
- Text hierarchy:
  - Primary: `--fg-primary`
  - Secondary: `--fg-secondary`
  - Tertiary/meta: `--fg-tertiary`
  - Muted: `--fg-muted`

## Component Patterns
- Navigation:
  - Header and page share the same background world; separate with subtle border.
  - Active links use underline + accent color.
  - Mobile nav uses explicit toggle state (`aria-expanded`), backdrop, Escape close.
- Cards:
  - Use `ui-card` + optional `ui-card-hover`.
  - Keep metadata in `ui-meta`; tags in `ui-chip`.
  - Avoid mixed card treatments on the same screen.
- Actions:
  - Primary action: `ui-btn-primary`.
  - Secondary action: `ui-btn-secondary`.
  - Text action: `ui-link-inline`.
- Status:
  - Use `ui-status-badge` with semantic variants (`ui-status-success`, `ui-status-warning`).
- Forms:
  - Inputs/textareas use inset surfaces and border hierarchy.
  - Field errors are inline and mapped per field (`custom-field-error`, `custom-input-error`, `custom-text-area-error`).
  - Submit loading state is explicit (`aria-busy`, disabled, loading label).

## Reuse Rules
- Prefer existing primitives in `src/presentation/styles/global.css` before adding new one-off utilities.
- Every new color should map to existing semantic tokens first.
- New reusable patterns should be documented here when they appear in 2+ components.
