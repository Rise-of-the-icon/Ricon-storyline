# RICON Theme Contrast Guide

Approved text/background pairings for the dark cinematic theme.

## Core Pairings

- `--text-primary` (`#F0EBE3`) on `#080808` / `#0c0c0c` for headings and key labels.
- `--text-body` (`rgba(240,235,227,0.82)`) on dark panels for primary paragraph copy.
- `--text-caption` (`rgba(240,235,227,0.72)`) on dark panels for supporting body/caption text.
- `--text-meta` (`#8f8f8f`) on dark surfaces for small metadata and status lines.
- `--text-disabled` (`#8a8a8a`) for disabled text controls, paired with reduced-emphasis borders.

## State Colors

- Focus ring: `--focus-ring` (`#7BC8E8`) on dark interactive surfaces.
- Gold action labels/buttons: `#C9A84C` on dark backgrounds.
- Error emphasis text: `--error-text` (`#ffb3b3`) on dark backgrounds.

## Notes

- Keep disabled controls distinguishable by using both text and border/background changes.
- Avoid introducing new low-luminance grays (`#444`/`#555`) for small text on dark backgrounds.
- For tiny metadata (`8px–10px`), prefer `--text-meta` or brighter.
