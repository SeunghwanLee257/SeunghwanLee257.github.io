# waLLLnut Auction — Sellan 플로팅 SDK

첫 화면에는 기존 FHE16 공용 상단 메뉴, ‘기존 브라우저’ 배경 안내와 우측 하단 Sellan 버튼을 표시한다.
버튼을 누르면 SDK의 Shadow DOM 창에서 상품 선택·입찰 입력·FHE 결과 확인을 진행한다.
상단 메뉴는 `../_shared/fhe16-theme.css`로 다른 FHE16 데모와 같은 모양을 유지한다.

```html
<script async src="./sdk/auction-widget.js" data-sellan-demo="./catalog.json"></script>
```

위 태그 하나로 SDK가 플로팅 버튼과 입찰창을 직접 생성한다. 별도의 페이지 JavaScript나
상품 목록 UI가 필요하지 않다. 상품 설정과 예시 이미지는 SDK 창에서만 사용한다.
다른 상점에 상품별 진입 버튼이 필요하면 `data-sellan-auction="moon-blue"`처럼
catalog의 상품 ID를 연결할 수 있다.

`auction-widget.js` → `@sellan/sdk/demo/auction-widget` → `@sellan/sdk/demo/auction`
→ 같은 사이트의 FHE16 v58 순서다. 페이지의 `app.js`는 제거했다.
이 설치는 같은 origin에서 실행하는 **정적 체험용**이며 운영용 인증·호스팅 설치와 다르다.

SDK 내부의 상품 이미지는 이 데모를 위해 생성한 가상 토이 4종이다.

- 초기 화면과 입찰 제출은 FHE 자산을 읽지 않는다. 승자 계산 시 처음 로딩한다.
- SDK 설정을 읽는 동안 플로팅 영역에 연결 중 상태를 표시한다. 연결 실패 시 같은 위치의
  ‘다시 연결’ 버튼으로 재시도하며, 성공하면 SDK 상품 선택 창이 바로 열린다.
- 같은 페이지에서 창을 닫아도 입력·입찰·계산 결과가 유지된다. 계산 중 닫아도 계속 실행한다.
- 같은 설치 스크립트를 중복 삽입해도 위젯은 하나다. 상점 CSS와 SDK UI는 분리된다.
- 금액은 1~2,147,483,647원의 정수다. 만원 단위 반올림을 하지 않는다.
- 동점이면 SDK에 먼저 등록한 입찰을 선택한다. 단일 승자의 본인 입찰가 낙찰 체험이다.
- FHE 오류나 잘못된 연산 결과를 평문 계산으로 대체하지 않는다. 승자 확정을 중단한다.
- 표시는 입찰 기록 해시이며 암호문이나 독립 검증 증거가 아니다.
- 데이터는 현재 브라우저 메모리에 있다. 실제 신원 인증·결제·배송을 처리하지 않는다.
- 공개 FHE16 빌드는 진단용이다. 비밀 입찰 운영이나 안전한 키 분리를 보장하지 않는다.

SDK 소스는 인접 `raremine-next/packages/sdk/src/demo/auction-widget.ts`,
`auction-loader.ts`, `auction-catalog.ts`, `auction.ts`와 `src/runtime/fhe16.ts`다.
상품 설정은 `catalog.json`이고 가격은 예시 데이터다. RareMine 루트에서 재생성·검증한다.

```sh
npm run sellan:walllnut:build
node scripts/smoke-walllnut-auction.mjs
node scripts/smoke-walllnut-auction.mjs --url https://walllnut.com/demo/Auction/
```

`sdk/build.json`의 SHA-256으로 `sdk/auction.js`와 `sdk/auction-widget.js`를 확인한다.
생성된 JS는 직접 수정하지 않는다. FHE16의 기존 `dist/`·`build/` 자산은 별도로 유지한다.
브라우저 검증에는 Puppeteer와 Chrome이 필요하다.
