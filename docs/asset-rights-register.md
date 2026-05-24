# Asset Rights Register

Updated: 2026-05-24

This register covers assets still referenced by the public page after the A/B/C redesign. Assets not listed here should stay out of production until provenance is recorded.

| Asset | Use | Source / owner | License / permission status | Commercial use | Action |
| --- | --- | --- | --- | --- | --- |
| `asset/generated/ogp-walllnut.svg` | Open Graph preview | Created in this repository | Company-owned generated SVG | Yes | Keep |
| CSS graphics in `css/04.sections.css` | Supporting overlays and fallback visuals | Created in this repository with CSS gradients and shapes | Company-owned generated design | Yes | Keep |
| `asset/bg/sec01-bg.jpeg` | Hero wallpaper | waLLLnut internal wallpaper | Company-owned per user instruction; keep source proof | Yes | Restored |
| `asset/bg/sec02-bg.png` | Executive summary wallpaper | waLLLnut internal wallpaper | Company-owned per user instruction; keep source proof | Yes | Restored |
| `asset/bg/sec04-FHE16-bg.png` | FHE16 technology wallpaper | waLLLnut internal FHE16 image | User confirmed FHE16 image is company-owned | Yes | Restored |
| `asset/bg/sec04-SSFHE-bg.png` | SSFHE technology wallpaper | waLLLnut internal FHE16/SSFHE image | User confirmed FHE16-related image is company-owned | Yes | Restored |
| `asset/head-logo.svg` | Header logo | waLLLnut brand asset | Internal ownership required | Yes, if brand-owned | Keep with ownership proof |
| `asset/logo-filled-orange.ico` | Favicon | waLLLnut brand asset | Internal ownership required | Yes, if brand-owned | Keep with ownership proof |
| `asset/team/*.jpg`, `asset/team/*.jpeg`, `asset/team/*.JPG` | Team and alumni photos | Internal/company portraits | Photographer and subject consent required | Yes, if consent/ownership is documented | Keep with consent proof |
| `asset/IR/waLLLnut_IR.pdf` | Downloadable IR archive | waLLLnut document | Internal document rights required | Yes, if company-owned and embedded third-party assets are cleared | Audit before external campaign |
| `asset/IR/latticA_IR.pdf` | Downloadable IR archive | waLLLnut/LatticA document | Internal document rights required | Yes, if company-owned and embedded third-party assets are cleared | Audit before external campaign |
| Asap Condensed | Display font | Omnibus-Type | SIL Open Font License 1.1 | Yes | Keep license notice |
| Pretendard | UI font | orioncactus | SIL Open Font License 1.1 | Yes | Keep license notice |
| Google Material Icons | Icons | Google Fonts | Apache License 2.0 | Yes | Keep license notice |
| Chart.js | Benchmark chart | Chart.js project | MIT | Yes | Keep license notice |
| AOS | Scroll animation | michalsnik/aos | MIT | Yes | Keep license notice |
| Animate.css 4.1.1 | Animation CSS | animate.css package metadata | MIT for pinned 4.1.1 package metadata | Yes | Keep version pinned or remove |

## Removed From Active Page

The redesign keeps restored company-owned wallpapers for hero, executive summary, and FHE16/SSFHE technology panels. Still excluded from active page until separate provenance is recorded: `asset/bg/sec03slide*.png`, `asset/graphic/sec06-usecase-*.png`, `asset/graphic/sec06-Roadmap-title-img.png`, unverified institution/media logos, and unverified third-party brand icon SVGs.


## 2026-05-24 Page Split Notes

- `benchmark.html` adds no new visual asset. It reuses `asset/bg/sec04-FHE16-bg.png`, which is recorded above as company-owned per user confirmation, and uses local benchmark JSON files in `data/*.json`.
- `traction.html` adds no new visual asset. It reuses `asset/bg/sec02-bg.png`, which is recorded above as an internal wallpaper.
- Press and paper items are rendered as text links only. No news outlet, university, conference, or partner logo is embedded.
- New UI visuals are CSS-only layouts and Google Material Icons; both are covered by the existing notices.
