# waLLLnut 경매·쿠지·가챠 — Sellan 플로팅 SDK

첫 화면에는 기존 FHE16 공용 상단 메뉴, 블러 처리한 웹페이지 예시, 선명한 ‘기존 브라우저’
표시와 우측 하단 Sellan 버튼을 배치한다. 배경 예시는 HTML/CSS로 만든 비활성 화면이며
참여 동작은 SDK가 담당한다. 블러는 배경 페이지에만 적용한다.
버튼을 누르면 해당 캠페인의 SDK 참여 창을 바로 연다. 전환 탭은 두지 않는다.
상단 메뉴는 `../_shared/fhe16-theme.css`로 다른 FHE16 데모와 같은 모양을 유지한다.
SDK는 월넛의 남색·하늘색 계열과 간결한 상품 목록·참여 패널을 사용한다.

```html
<script async src="./sdk/sellan-widget.js" data-sellan-demo="./catalog.json"></script>
```

위 태그 하나로 SDK가 플로팅 버튼과 참여 창을 직접 생성한다. 별도의 페이지 JavaScript나
상품 목록 UI가 필요하지 않다. 상품 설정과 예시 이미지는 SDK 창에서만 사용한다.
다른 상점에 상품별 진입 버튼이 필요하면 `data-sellan-auction="moon-blue"`처럼
catalog의 상품 ID를 연결할 수 있다.

| 별도 체험 주소 | 설치 옵션 |
| --- | --- |
| [경매](https://walllnut.com/demo/Auction/) | `data-sellan-experience="auction"` 또는 생략 |
| [쿠지](https://walllnut.com/demo/Auction/kuji.html) | `data-sellan-experience="kuji"` |
| [가챠](https://walllnut.com/demo/Auction/gacha.html) | `data-sellan-experience="gacha"` |

두 뽑기 페이지도 기존 공용 상단 메뉴를 사용하며 새 메뉴 항목을 추가하지 않는다.
고객에게는 하나의 캠페인을 제공하고 같은 SDK가 해당 참여 UI와 검산을 맡는다.
개발자 API는 `mountSellanDiagnosticWidget({ ...options, experience: 'kuji' })`로 지정한다.

`sellan-widget.js` → `@sellan/sdk/demo/widget`에서 각 체험 client를 호출한다.
경매는 `@sellan/sdk/demo/auction` → 같은 사이트의 FHE16 v58,
뽑기는 `@sellan/sdk/demo/draws` → 같은 사이트의 VLD-1 엔진 `sdk/vld.js` 순서다.
기존 `auction-widget.js` 경로도 같은 파일을 제공한다. 페이지의 `app.js`는 제거했다.
이 설치는 같은 origin에서 실행하는 **정적 체험용**이며 운영용 인증·호스팅 설치와 다르다.

SDK 내부의 상품 이미지는 이 데모를 위해 생성한 가상 토이 4종이다.

- 초기 화면과 입찰 제출은 FHE 자산을 읽지 않는다. 승자 계산 시 처음 로딩한다.
- SDK 설정을 읽는 동안 플로팅 영역에 연결 중 상태를 표시한다. 연결 실패 시 같은 위치의
  ‘다시 연결’ 버튼으로 재시도하며, 성공하면 설정된 SDK 참여 창이 바로 열린다.
- 같은 페이지에서 창을 닫아도 입력·입찰·계산 결과가 유지된다. 계산 중 닫아도 계속 실행한다.
- 같은 설치 스크립트를 중복 삽입해도 위젯은 하나다. 상점 CSS와 SDK UI는 분리된다.
- 금액은 1~2,147,483,647원의 정수다. 만원 단위 반올림을 하지 않는다.
- 동점이면 SDK에 먼저 등록한 입찰을 선택한다. 단일 승자의 본인 입찰가 낙찰 체험이다.
- FHE 오류나 잘못된 연산 결과를 평문 계산으로 대체하지 않는다. 승자 확정을 중단한다.
- 표시는 입찰 기록 해시이며 암호문이나 독립 검증 증거가 아니다.
- 데이터는 현재 브라우저 메모리에 있다. 실제 신원 인증·결제·배송을 처리하지 않는다.
- 공개 FHE16 빌드는 진단용이다. 비밀 입찰 운영이나 안전한 키 분리를 보장하지 않는다.

`catalog.json`의 `draws`는 쿠지·가챠의 설정이다. 화면에 표시할 종류는 위 설치 옵션으로
선택한다. catalog에 없는 모드나 잘못된 옵션이면 연결 실패를 표시한다.

| 체험 | 이번 데모 설정 | 동작 |
| --- | --- | --- |
| 쿠지 | S/A/B/C 1·3·6·10개, 총 20개 / 예시 5,000원 | 남은 재고에 비례하여 티켓을 뽑고 결과 확정 뒤 차감 |
| 가챠 | S/A/B/C 2·8·30·60% / 예시 3,000원 | 매회 같은 확률로 반복 추첨, 동일 상품 중복 당첨 가능 |

1·3·10회를 선택하고 준비하면 확률표와 사전 커밋을 고정한다. 티켓·캡슐을 열면
기존 VLD-1 엔진이 결과 영수증을 생성하고 다시 계산한다. 결과에서 **검증 기록과 체험 안내**를
열어 재검산하거나 VLD 영수증 JSON을 저장할 수 있다. 창을 닫았다 열어도 준비와 결과는
유지된다. 같은 결과를 다시 요청해도 쿠지 수량을 두 번 차감하지 않는다. 쿠지의 품절 상품은
다음 추첨 표에서 제외한다. 가챠의 가중치는 유지한다. 브라우저당 준비 기록은 최대 100회다.

`결과 재계산 일치`는 VLD-1 입력으로 같은 결과가 계산됐다는 뜻이다. 외부 난수 증명과
FHE 재고 봉인은 연결하지 않았다. 난수는 현재 브라우저에서 생성하고 재고도 브라우저마다
독립적이다. 실제 결제·공유 재고·운영자의 재추첨 방지를 보장하는 운영 서비스가 아니다.
영수증의 `coreValid=true`와 `externalProofStatus=not_checked`, `fullyVerified=false`를
구분한다. 이 가챠 체험은 운영 거래 API의 새 mechanism 지원을 의미하지 않는다.

SDK 소스는 인접 `raremine-next/packages/sdk/src/demo/auction-widget.ts`,
`auction-loader.ts`, `auction-catalog.ts`, `auction.ts`, `draw-panel.ts`, `draws.ts`와
`src/runtime/fhe16.ts`다. VLD의 원본은 `FHE16_GATCHA/src`이며 추첨·검증 코드를 재사용한다.
`scripts/vld-browser`는 Node bytes/hash/equality만 브라우저 API로 연결한다.
랜덤 기능의 운영 검증 설계는 인접 SDK의 `docs/RANDOM_VERIFICATION.md`에 있다.
미래 난수 proof와 사전 고정, 참여 포함, 재고/상태, 원장 일관성을 따로 검증하도록 정의했다.
상품 설정은 `catalog.json`이고 가격은 예시 데이터다. RareMine 루트에서 재생성·검증한다.

```sh
npm run sellan:walllnut:build
npm --prefix packages/sdk run build
node scripts/check-walllnut-draws.mjs
node scripts/smoke-walllnut-auction.mjs
node scripts/smoke-walllnut-auction.mjs --url https://walllnut.com/demo/Auction/
```

`sdk/build.json`의 SHA-256으로 SDK와 VLD 엔진을 확인한다. VLD 빌드에는 인접 원본 저장소가
필요하며 배포 실행에는 필요하지 않다. 원본 파일 해시도 manifest에 기록한다.
`sdk/VLD-NOTICES.txt`에 SHA-256 구현의 라이선스를 포함한다.
생성된 JS는 직접 수정하지 않는다. SDK가 import하는 `dist/fhe16-web.mjs`는 사이트 루트의
단일 파일 라이브러리 `/fhe16.js`를 그대로 re-export하는 shim이며, 엔진 빌드는 그 파일 안에 들어 있다.
`kuji.html`·`gacha.html`은 경매 페이지를 기준으로 빌드 스크립트가 생성한다.
브라우저 검증에는 Puppeteer와 Chrome이 필요하다.
