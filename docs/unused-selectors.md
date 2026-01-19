# Unused / Quarantined Selectors

| Selector | Declared at | Reason |
| --- | --- | --- |
| `.result-image-area`, `.result-placeholder`, `#versionImage` | `css/99.overrides.css:15` | Legacy gallery block commented out in `index.html`; kept hidden until feature revival |
| `.nav-active-bar` | `css/03.components.css:192` | Mobile nav indicator not rendered anywhere |
| `.actions .action-icon` | `css/04.sections.css:165` | CTA icon wrapper unused; large offset caused layout jumps |
| `body.menu-open` | `css/99.overrides.css:24` | Replaced by global `.menu-locked` state; quarantined to avoid regressions |
