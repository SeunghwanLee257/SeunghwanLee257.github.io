# waLLLnut.com 섹션 개편 및 디자인 소스 감사 보고서

작성일: 2026-05-24
대상: `walllnut.com` 정적 사이트 (`index.html`, `js/modules/*`, `asset/*`)

## 1. 결론 요약

- 사이트의 핵심 섹션은 3개 축으로 재정렬하는 것이 맞다.
- A축은 공개 전 제품명을 노출하지 말고, `B2C 수요 예측 및 물량 배분 서비스`로 우회 표현한다. 표기는 `2026 Coming Soon`까지만 둔다.
- B축은 `B2B 신원 검증 및 이상 거래 탐지`를 중심으로, PET(Privacy-Enhancing Technology)를 활용한 기업용 리스크 인텔리전스/컴플라이언스 제품군으로 잡는다.
- C축은 현재 사이트의 강점인 블록체인/FHE16/Confidential Coprocessor를 담당하게 한다.
- 폰트는 현재 사용 방식 기준으로 상업 사이트 사용에 큰 문제는 없어 보인다. 다만 라이선스 고지 파일을 저장소에 남기는 것이 좋다.
- 이미지/그래픽 자산은 저장소 안에 출처/구매/제작 증빙이 모두 정리되어 있지는 않다. 다만 2026-05-24 사용자 확인으로 FHE16이 들어간 기존 사진은 회사 소유로 보고 복원한다. 나머지 자산은 배포 전 권리대장 확인이 필요하다.

## 2. 권장 정보 구조

### A. B2C Demand Intelligence

공개명:

- 국문: `B2C 수요 예측 및 물량 배분 서비스`
- 영문: `B2C Demand Forecasting & Allocation`
- 상태 배지: `2026 Coming Soon`

공개하지 말 것:

- 비공개 B2C 제품명 또는 이를 유추할 수 있는 코드명
- 특정 상품군, 출시 파트너, 운영 방식의 세부 구조
- “레어”, “마인”, “채굴”, “희소 상품” 등 직접 연상어

권장 문구:

> 소비자 수요 신호와 공급 제약을 프라이버시 보존 방식으로 분석해, 출시 전 수요 예측과 물량 배분 의사결정을 지원합니다. Product name undisclosed. 2026 Coming Soon.

### B. B2B PET Risk Intelligence

공개명:

- 국문: `B2B PET 기반 신원 및 이상 거래 탐지`
- 영문: `B2B PET Risk Intelligence`

핵심 메시지:

- 기업 간 데이터는 원본을 공유하기 어렵다.
- FHE/MPC/ZK/Threshold 등 PET 기술을 이용해 신원 검증, 이상 거래 탐지, 감사 증빙, 규정준수 판정을 지원한다.
- “탐지”가 맞고, 사용자가 말한 “참지”는 오타로 보인다.

권장 문구:

> 기업 간 민감 데이터는 노출하지 않고, 신원 적합성·거래 패턴·위험 신호만 검증합니다. PET 기술을 활용해 이상 거래 탐지와 감사 가능한 컴플라이언스 흐름을 지원합니다.

### C. Blockchain Confidential Infrastructure

공개명:

- 국문: `블록체인 기밀 연산 인프라`
- 영문: `Blockchain Confidential Infrastructure`

핵심 메시지:

- 현재 사이트의 `Confidential Coprocessor`, `Solana`, `DeFi`, `Voting` 메시지를 C축 하위 사례로 흡수한다.
- C축은 “블록체인 전체가 메인 사업”처럼 보이기보다 “검증 가능한 기밀 연산 인프라”로 배치한다.

권장 문구:

> FHE16 기반 기밀 코프로세서로 온체인 검증성과 데이터 기밀성을 동시에 제공합니다. Solana/EVM 모듈, MEV 완화, 비공개 투표, 규정준수 분석 등 블록체인 응용을 지원합니다.

## 3. 현재 코드 기준 변경 위치

### 3.1 Solutions 섹션

현재 `index.html`의 `#sec03`은 4개 탭이다.

- `Coprocessor`
- `Solana`
- `DeFi`
- `Voting`

수정 방향:

- 탭을 3개로 줄인다: `A. B2C`, `B. B2B`, `C. Blockchain`
- `data-solution` 키도 `consumer`, `enterprise`, `blockchain`로 바꾼다.
- 관련 위치: `index.html` 452-474, `js/modules/solutions.js` 11-68

권장 키 구조:

```js
consumer: {
  title: 'B2C Demand Forecasting & Allocation',
  body: 'Analyze demand signals and supply constraints with privacy-preserving computation. Product name undisclosed. Launching in 2026.',
  sub: '2026 Coming Soon',
  bg: "url('./asset/bg/sec03slide01.png')"
}
```

```js
enterprise: {
  title: 'B2B PET Risk Intelligence',
  body: 'Verify identity, detect anomalous transactions, and support audit-ready compliance without exposing raw business data.',
  sub: 'Privacy-preserving identity and transaction risk analysis',
  bg: "url('./asset/bg/sec03slide02.png')"
}
```

```js
blockchain: {
  title: 'Blockchain Confidential Infrastructure',
  body: 'Run sensitive state and computation through FHE16-based confidential infrastructure while preserving public verifiability.',
  sub: 'Confidential computation for verifiable networks',
  bg: "url('./asset/bg/sec03slide03.png')"
}
```

### 3.2 Use Case 섹션

현재 `#sec05`의 Use case는 4개 블록체인 중심 사례다.

- DeFi / MEV
- On-chain voting
- Data marketplace
- Messaging / SNS

수정 방향:

- 4개를 3개로 줄이거나, 3개 축 카드로 재구성한다.
- 기존 블록체인 사례는 모두 C축 내부 문구로 압축한다.
- 관련 위치: `index.html` 609-660, `js/modules/language.js`의 `usecase.*`

권장 카드:

1. `A. Consumer Demand Intelligence`
   `2026 Coming Soon` 배지를 크게 노출. 제품명은 비공개.
2. `B. Enterprise PET Risk Intelligence`
   신원 검증, 이상 거래 탐지, 감사 증빙.
3. `C. Blockchain Confidential Infrastructure`
   FHE16, confidential coprocessor, Solana/EVM, MEV/voting/compliance.

### 3.3 Problem / Vision 섹션

현재 Problem은 `Blockchain transparency is a bug, not a feature`로 시작해 C축에만 맞는다. 3축 구조에서는 너무 좁다.

수정 방향:

- 문제 정의를 “민감 데이터는 공유되어야 하지만 노출되면 안 된다”로 넓힌다.
- 블록체인은 C축 사례로 내린다.

권장 문구:

> High-value data is hard to use because it is hard to share safely.

국문:

> 가치 있는 데이터는 활용되어야 하지만, 원본이 노출되는 순간 리스크가 됩니다.

### 3.4 Roadmap

현재 로드맵은 SVM/EVM 모듈 중심이다. 3축 구조에서는 다음처럼 바꾸는 편이 낫다.

- `A. 2026 Coming Soon`: B2C 수요 예측 및 물량 배분 서비스
- `B. Enterprise Pilot`: PET 기반 신원/이상 거래 탐지 PoC
- `C. Blockchain Modules`: SVM/EVM 기반 confidential layer

## 4. 공개 문구 가이드

금지:

- `비공개 B2C 제품명`
- `비공개 B2C 제품명`
- 제품명을 추정하게 하는 약어, 코드명, 내부 프로젝트명
- 특정 출시 파트너 또는 상품 카테고리

사용 가능:

- `2026 Coming Soon`
- `Product name undisclosed`
- `B2C demand forecasting`
- `allocation intelligence`
- `privacy-preserving demand signals`

추천 톤:

- 너무 자세한 서비스 설명을 피한다.
- “소비자 수요”, “공급 제약”, “물량 배분”, “출시 전 예측” 정도까지만 말한다.
- 기술은 FHE/PET로 묶되, A축에서 블록체인 색을 과하게 드러내지 않는다.

## 5. 폰트 및 라이브러리 라이선스 확인

현재 `index.html`에서 사용 중인 외부 소스:

- Google Material Icons: `index.html` 101
- Asap Condensed: `index.html` 102
- Pretendard: `index.html` 103
- Tailwind Play CDN: `index.html` 47
- Chart.js CDN: `index.html` 96
- AOS CDN: `index.html` 42, 1168
- Animate.css CDN: `index.html` 44

확인 결과:

| 항목 | 현재 판단 | 근거 | 조치 |
| --- | --- | --- | --- |
| Asap Condensed | 사용 가능 | Asap 저장소가 SIL Open Font License 1.1 명시 | 라이선스 고지 보관 |
| Pretendard | 사용 가능 | Pretendard LICENSE가 SIL Open Font License 1.1 명시 | 라이선스 고지 보관 |
| Material Icons | 사용 가능 | Google 문서가 Apache License 2.0 명시 | 선택적 attribution 가능 |
| Tailwind CSS | 사용 가능, 단 CDN은 운영 부적합 | Tailwind는 MIT, Play CDN은 개발용이라고 공식 문서 명시 | 운영 배포 전 CSS 빌드 권장 |
| Chart.js | 사용 가능 | Chart.js LICENSE가 MIT 명시 | 라이선스 고지 보관 |
| AOS | 사용 가능 | 저장소 및 로컬 package metadata가 MIT 명시 | 라이선스 고지 보관 |
| Animate.css 4.1.1 | 사용 가능으로 보이나 주의 | 현재 로컬/UNPKG 4.1.1 package metadata는 MIT. 단 최신 upstream 사이트는 Hippocratic License 표기가 보여 버전 기준 고지가 필요 | v4.1.1 고정 또는 제거 검토 |

참고 링크:

- Asap: https://github.com/Omnibus-Type/Asap
- Pretendard: https://github.com/orioncactus/pretendard/blob/main/LICENSE
- Material Icons: https://developers.google.com/fonts/docs/material_icons
- Tailwind Play CDN: https://tailwindcss.com/docs/installation/play-cdn
- Tailwind License: https://github.com/tailwindlabs/tailwindcss/blob/main/LICENSE
- Chart.js License: https://github.com/chartjs/Chart.js/blob/master/LICENSE.md
- AOS: https://github.com/michalsnik/aos
- Animate.css 4.1.1 package metadata: https://app.unpkg.com/animate.css@4.1.1/files/package.json

## 6. 디자인 자산 저작권 리스크

저장소 검색 결과, 모든 `asset/*` 이미지/아이콘/사진에 대한 출처, 구매내역, 제작자, 라이선스 전문이 완전히 정리되어 있지는 않았다. 현재는 사용자 확인으로 회사 소유가 확인된 wallpaper만 복원하고, 나머지는 권리대장 확정 전까지 보류한다.

### 6.1 낮은 리스크

- 회사 로고로 보이는 `asset/head-logo.svg`, `asset/icon/head-logo.svg`
- 팀 내부에서 제작한 것으로 확인 가능한 그래픽
- 직접 촬영했고 구성원 동의가 확보된 팀 사진

단, 위 항목도 실제 제작/촬영/사용권 증빙이 있어야 한다.

### 6.2 중간 리스크

- `asset/bg/*`, `asset/graphic/*` 추상 그래픽
- `asset/sec01-bg.jpeg` / `asset/bg/sec01-bg.jpeg`: 회사 내부 wallpaper로 복원, 원본 제작 증빙 보관 필요
- `asset/OGP-*`
- `asset/icon/lattica.svg`
  이 파일은 SVG 내부에 base64 PNG가 포함되어 있어 원본 출처 관리가 특히 필요하다.

### 6.3 높은 리스크

- SNS/브랜드 아이콘: GitHub, LinkedIn, Instagram, X, YouTube, Behance
  저작권보다 상표/브랜드 가이드라인 리스크가 있다. 공식 로고 사용 조건을 맞춰야 하며, 제휴·인증처럼 보이면 안 된다.
- 누락된 로고 파일: `asset/icon/hanyang-logo.svg`, `asset/icon/news-naver.png`
  현재 로컬 서버에서 404가 난다. 임의로 웹에서 로고를 가져오면 안 되고, 공식 사용 허가 또는 텍스트 fallback이 필요하다.
- `asset/IR/*.pdf`
  PDF 내부에 외부 이미지, 로고, 차트, 기사 캡처가 있으면 별도 권리 확인이 필요하다.

## 7. 필수 조치

1. `docs/asset-rights-register.md`를 만들고 모든 이미지/아이콘/PDF에 대해 `파일명`, `제작자`, `출처 URL`, `라이선스`, `상업 사용 가능 여부`, `증빙 위치`, `승인자`를 기록한다.
2. 증빙이 없는 이미지/그래픽은 배포 전 교체한다.
3. 새 A/B/C 섹션용 이미지는 외부 스톡을 쓰지 말고, 사내 제작 그래픽 또는 명시적으로 상업 사용 가능한 CC0/유료 라이선스 자산만 쓴다.
4. 브랜드 아이콘은 가능하면 공식 브랜드 리소스만 사용하고, 아이콘 파일 옆에 출처를 남긴다.
5. `asset/icon/hanyang-logo.svg`, `asset/icon/news-naver.png`, `asset/OGP-1200_630.png` 404를 해결한다. 특히 OG 이미지는 현재 `asset/OGP-1200_640.png`가 있으므로 메타 태그와 실제 파일명을 맞춰야 한다.
6. 운영 배포 전 Tailwind Play CDN을 제거하고 정적 CSS 빌드로 바꾼다.
7. 라이선스 고지를 `docs/third-party-notices.md` 또는 `NOTICE.md`로 분리해 저장한다.

## 8. 구현 우선순위

1. `index.html`, `js/modules/solutions.js`, `js/modules/language.js`에서 Solutions/Use case를 A/B/C로 재작성
2. Problem/Vision 문구를 3축 메시지에 맞게 확장
3. Roadmap을 A/B/C 사업축 기준으로 정리
4. 누락 이미지 404 수정
5. 자산 권리대장 작성
6. Tailwind CDN 제거 및 CSS 빌드 도입
7. Stylelint 설정 최신화

## 9. 최종 권장 방향

사이트의 공개 메시지는 `waLLLnut = PET 기반 기밀 연산 회사`로 잡고, 제품 축은 다음 순서로 보여주는 것이 좋다.

1. `A. B2C Demand Forecasting & Allocation`
   소비자향 신규 서비스. 제품명 비공개. `2026 Coming Soon`.
2. `B. B2B PET Risk Intelligence`
   신원 검증, 이상 거래 탐지, 감사/컴플라이언스.
3. `C. Blockchain Confidential Infrastructure`
   FHE16, confidential coprocessor, Solana/EVM, MEV/voting/compliance.

이 구조가 현재 블록체인 중심 사이트보다 사업 확장성이 좋고, 미공개 B2C 제품명을 보호하면서도 투자자/파트너가 이해할 수 있는 메시지를 만든다.
