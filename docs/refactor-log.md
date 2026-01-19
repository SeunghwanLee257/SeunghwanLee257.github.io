# CSS Refactor Log

| 항목 | 변경 전 위치 | 변경 후 위치 | 비고 |
| --- | --- | --- | --- |
| `.svc-slider`, `.svc-track`, `.svc-item` | `css/04.sections.css` | `css/03.components.css` | 섹션 내부 정의를 공통 컴포넌트 레이어로 이동 |
| Material Icons 폰트 강제 지정 | `css/04.sections.css` | `css/01.base.css` | 전역 베이스에서 1회만 선언 |
| lang dropdown/`header.is-compact`/`header--lang-hidden` 애니메이션 | `css/02.layout.css` 내 중복 블록 | `css/02.layout.css` 단일 블록 | 가시성·전환 로직 통합 |
| 상태 클래스(`.open`, `.active` 등) | `css/02.layout.css`, `css/03.components.css`, `css/04.sections.css`, `js/walllnut.bundle.js` | `.is-open`/`.is-active`/`.is-compact` 컨벤션 | 99.overrides에서 이전 명칭 주석 처리 |
| 반응형 근접 배치 정리 | 산재한 `@media` 블록 | `css/02.layout.css`, `css/05.i18n.css` 인접 배치 | 모바일·태블릿·데스크톱 규칙을 컴포넌트 정의 바로 아래로 이동 |
