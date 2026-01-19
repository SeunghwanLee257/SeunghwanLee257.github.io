# 버그 수정 요약

## 버그 목록 및 해결 과정

| 번호 | 버그 종류 | 증상 | 원인 | 해결 과정 | 최종 해결 방법 |
|------|----------|------|------|----------|---------------|
| 1 | 벤치마킹 버튼 깜빡임 | 새로고침 시 버튼이 나타났다가 사라지는 현상 | - CSS transition이 display/visibility 변경에 적용됨<br>- JavaScript 실행 순서 문제<br>- 브라우저 캐시<br>- 미디어 쿼리 CSS 규칙이 기본 CSS를 덮어씀<br>- 버튼 생성 시 `is-ready` 클래스가 즉시 추가되어 CSS 로드 전에 보임 | 1. CSS에서 `opacity: 0` 설정<br>2. `is-positioned` 클래스 추가<br>3. 인라인 스타일 추가<br>4. MutationObserver 사용<br>5. Head에 즉시 실행 스크립트 추가<br>6. 버튼을 HTML에서 제거하고 JavaScript로 동적 생성<br>7. 버튼 생성 시 인라인 스타일로 즉시 숨김<br>8. `requestAnimationFrame`으로 다음 프레임에 표시 | - 버튼을 HTML에서 완전히 제거<br>- JavaScript에서 `window.load` 이벤트 후 동적 생성<br>- 버튼 생성 시 인라인 스타일로 즉시 숨김 (`display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;`)<br>- `requestAnimationFrame`을 사용해서 다음 프레임에 `is-ready` 클래스 추가<br>- HTML head에 CSS로 이중 보호 (display, visibility, opacity, pointer-events 모두 숨김)<br>- CSS transition을 `background, color`에만 적용 |
| 2 | 첫 번째 배너 이전 데이터 표시 | 새로고침을 여러 번 하면 이전 데이터가 잠깐 보임 | - `initHeaderAutoHide()`와 `hero-scroll.js` 충돌<br>- CSS transition으로 인한 깜빡임<br>- 브라우저 캐시 | 1. `initHeaderAutoHide()` 비활성화<br>2. `hero-scroll.js`에서 헤더 제어<br>3. 첫 번째 슬라이드 transition 제거<br>4. 캐시 방지 메타 태그 추가 | - `initHeaderAutoHide()` 복원<br>- `hero-scroll.js`에서 헤더 제어 제거<br>- 첫 번째 슬라이드에 `transition: none` 적용<br>- `hero-slider.js`에서 초기 상태 강제 설정 |
| 3 | 헤더 초기 표시 문제 | 헤더가 처음부터 보임 (원래는 스크롤해야 보여야 함) | - `hero-scroll.js`가 헤더를 항상 표시하도록 설정<br>- `initHeaderAutoHide()` 비활성화 | 1. `initHeaderAutoHide()` 복원<br>2. `hero-scroll.js`에서 헤더 제어 제거 | - `initHeaderAutoHide()`가 헤더 제어 담당<br>- `hero-scroll.js`는 hero 스타일만 처리 |
| 4 | sec01-bnner.png 이미지 표시 | 삭제 요청했던 이미지가 여전히 보임 | - HTML에 이미지 요소가 남아있음 | 1. `display: none` 적용<br>2. 이미지 요소 완전 제거 | - HTML에서 `hero-slide-visual--inline` div와 이미지 완전 제거 |
| 5 | scrollTopBtn 존재 | 삭제했던 버튼이 여전히 존재 | - CSS 주석과 JavaScript 주석에 참조가 남아있음 | 1. CSS 주석에서 제거<br>2. JavaScript 주석 제거 | - `css/00.tokens.css`에서 주석 제거<br>- `js/walllnut.bundle.js`에서 주석 제거 |
| 6 | 섹션 번호 오류 | Solutions가 02, Technology가 03으로 표시됨 | - HTML에 잘못된 번호가 하드코딩됨 | 1. Solutions: 02 → 03<br>2. Technology: 03 → 02 | - `index.html`에서 섹션 번호 수정 |
| 7 | 팀 카드 SNS 링크 | 3번째 카드에 X 계정이 없고 인스타그램이 있음 | - HTML에 링크가 없거나 숨겨져 있음 | 1. X 계정 링크 추가<br>2. 인스타그램 링크 제거 | - `index.html`에서 링크 추가/제거 |

## 주요 해결 원칙

1. **CSS Transition 제한**: `display`, `visibility` 변경에는 transition을 적용하지 않음
2. **동적 생성**: 깜빡임을 방지하기 위해 요소를 JavaScript로 동적 생성
3. **실행 순서**: 모든 리소스 로드 후에만 요소 생성 (`window.load`)
4. **캐시 방지**: HTML에 캐시 방지 메타 태그 추가
5. **충돌 방지**: 여러 스크립트가 같은 요소를 제어하지 않도록 역할 분리

