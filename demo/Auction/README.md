# waLLLnut objects — 아트토이 상점 + Sellan SDK

상점은 상품 소개·검색·정렬·관심 작품을 담당한다. 상품의 입찰 버튼을 누르면 SDK가
독립된 Shadow DOM 창을 띄우고 입찰 입력부터 FHE 결과까지 처리한다.

```html
<script async src="./sdk/auction-widget.js" data-sellan-demo="./catalog.json"></script>
```

상품 버튼에는 `data-sellan-auction="moon-blue"`처럼 catalog의 상품 ID를 연결한다.
값이 비어 있으면 전체 작품 선택 창이 열린다. 우측 Sellan 버튼은 SDK가 직접 생성한다.

`auction-widget.js` → `@sellan/sdk/demo/auction-widget` → `@sellan/sdk/demo/auction`
→ 같은 사이트의 FHE16 v58 순서다. `app.js`에는 입찰·Worker·FHE 코드를 넣지 않는다.
이 설치는 같은 origin에서 실행하는 **정적 체험용**이며 운영용 인증·호스팅 설치와 다르다.

페이지 구성은 사용자가 제공한 [NOW&NEVER](https://nowandnever.co.kr/shop_view/?idx=22)의
상품 상세, [이글루토이](https://iglootoy.com/category/art-toy/135/)의 상품 목록,
[HAOR](https://haor.kr/shop)의 여백과 필터를 참고했다. 이미지는 이 데모를 위해 생성한
가상 토이 4종이다. 참조 상점의 상품 사진이나 브랜드를 복제하지 않았다.

- 초기 화면과 입찰 제출은 FHE 자산을 읽지 않는다. 승자 계산 시 처음 로딩한다.
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
