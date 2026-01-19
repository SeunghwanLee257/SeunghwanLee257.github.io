# Accessibility & I18n Checklist

## Accordion (Goal Dropdown)
- **Findings**: `.goal-dropdown-header` buttons expose `aria-expanded` but lack `aria-controls`. Content panels `.goal-dropdown-content` have no `id`/`aria-labelledby`.
- **Recommendation**: Add unique `id` to each content panel and point header via `aria-controls`. Optionally give header an `id` and set `aria-labelledby` on panel. *(TODO: implement once confirmed.)*

## Language Toggle
- **Current pattern**: `.lang-toggle` uses `role="group"` on container with `aria-pressed` toggling per button.
- **Recommendation**: Document usage as toggle buttons (press state) or migrate to radio/tablist pattern. Update README or component guide. *(TODO: add documentation snippet.)*

## Color Contrast
- **Color**: `#FF952D` versus white yields contrast ratio ≈ 2.19:1 (fails 4.5:1 normal text).
- **Suggestion**: Consider darker variant (e.g. `#D86B00`) or add text-shadow/outline when used on light backgrounds. Include fallback in design tokens. *(TODO: evaluate with design.)*

## Additional Notes
- Ensure `.goal-dropdown-question` text is programmatically associated with panels after `aria-controls` fix.
- Review `.lang-toggle` documentation to clarify keyboard navigation (arrow keys vs tabbing).
- No automated contrast regression tests yet; consider adding a manual check list.
