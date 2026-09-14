# walllnut 경매 SDK 체험

`app.js` → `auction-sdk.js` → `@sellan/sdk/demo/auction` → 같은 사이트의 FHE16 v58
순서로 실행한다. SDK가 입찰 기록, 정확한 원 단위 입력, Worker·키 생성 수명,
최고가·차순위 비교, 동점 순서, 동일 요청 결과 재사용을 담당한다.

- 초기 화면과 입찰 제출은 FHE 자산을 읽지 않는다. 승자 계산 시 처음 로딩한다.
- 금액은 1~2,147,483,647원의 정수다. 만원 단위 반올림을 하지 않는다.
- 동점이면 SDK에 먼저 등록한 입찰을 선택한다. 단일 승자의 본인 입찰가 낙찰 체험이다.
- FHE 오류나 잘못된 연산 결과를 평문 계산으로 대체하지 않는다. 승자 확정을 중단한다.
- 표시는 입찰 기록 해시이며 암호문이나 독립 검증 증거가 아니다.
- 데이터는 현재 브라우저 메모리에 있다. 실제 신원 인증·결제·배송을 처리하지 않는다.
- 공개 FHE16 빌드는 진단용이다. 비밀 입찰 운영이나 안전한 키 분리를 보장하지 않는다.

소스는 인접 `raremine-next/packages/sdk/src/demo/auction.ts`와
`src/runtime/fhe16.ts`에 있다. RareMine 루트에서 재생성·검증한다.

```sh
npm run sellan:walllnut:build
node scripts/smoke-walllnut-auction.mjs
node scripts/smoke-walllnut-auction.mjs --url https://walllnut.com/demo/Auction/
```

`sdk/build.json`의 SHA-256으로 실제 배포된 `sdk/auction.js`를 확인한다.
생성된 JS는 직접 수정하지 않는다. FHE16의 기존 `dist/`·`build/` 자산은 별도로 유지한다.
브라우저 검증에는 Puppeteer와 Chrome이 필요하다.
