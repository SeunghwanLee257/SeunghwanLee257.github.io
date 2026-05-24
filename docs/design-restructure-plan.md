# waLLLnut 사이트 디자인 개편안

작성일: 2026-05-24

## 1. 디자인 원칙

이번 개편의 기준은 "블록체인 회사처럼 보이는 사이트"가 아니라 "PET 기반 기밀 연산 기술을 여러 시장에 적용하는 회사"로 보이게 하는 것이다. 첫 화면에서 A/B/C 사업 축이 즉시 보여야 하고, 각 축은 같은 기술 코어에서 파생된 포트폴리오처럼 읽혀야 한다.

모든 시각 자료는 무료 라이선스와 상업적 이용 가능 여부가 확인된 것만 사용한다. 출처가 불명확한 이미지, 외부 로고, 스톡 이미지, 커뮤니티 템플릿, 저작권자가 명확하지 않은 AI 생성 이미지는 사용하지 않는다.

## 2. 라이선스 안전 정책

사용 가능:

- 직접 제작한 SVG, CSS 그래픽, Canvas/WebGL 그래픽
- waLLLnut이 직접 보유한 로고, 팀 사진, 제품 자료
- OFL 1.1 폰트: Asap Condensed, Pretendard
- Apache 2.0 아이콘: Google Material Icons
- MIT 라이브러리: Chart.js, AOS, Tailwind CSS
- 라이선스 원문과 출처 URL이 확인된 오픈소스 자산

사용 보류:

- 출처가 없는 배경 이미지와 그래픽 PNG/JPEG
- 대학, 언론사, 파트너사 로고
- 확인되지 않은 SNS/브랜드 아이콘
- Figma Community 템플릿, 무료 이미지 사이트 이미지, 생성형 이미지 중 권리 조건이 문서화되지 않은 것
- "무료"라고만 표시되고 상업적 이용, 2차 가공, 재배포 조건이 명확하지 않은 자료

## 3. 전체 톤

현재 사이트는 기술력은 보이지만 블록체인 인프라 쪽으로 메시지가 강하게 쏠려 있다. 개편 후에는 밝은 배경, 얇은 선, 데이터 테이블, 신호 그래프, 암호화 블록, 감사 로그 형태의 그래픽을 사용해 B2C/B2B/Blockchain을 하나의 PET 기술 포트폴리오로 보여주는 방향이 적합하다.

권장 스타일:

- 배경: white, near-white, light gray 중심
- 강조색: 기존 waLLLnut orange를 제한적으로 사용
- 보조색: teal, ink, neutral gray 계열을 섞어 단조로운 단색 팔레트 방지
- 카드 반경: 8px 이하
- 그래픽: 직접 만든 데이터 플로우, 노드, 그래프, 테이블 UI
- 분위기: crypto/neon보다 enterprise intelligence, privacy tech, applied cryptography

## 4. Hero 섹션

목표는 첫 화면에서 "waLLLnut은 PET 기반으로 소비자 수요, 기업 리스크, 블록체인 기밀 인프라를 다룬다"를 바로 전달하는 것이다.

권장 문구:

- EN: Privacy-preserving intelligence for consumer, enterprise, and blockchain markets
- KO: 소비자 수요, 기업 리스크, 블록체인 기밀 인프라를 위한 PET 기반 인텔리전스

구성:

- 좌측 또는 중앙에 회사 메시지
- 바로 아래 A/B/C 3개 트랙 요약
- 우측 또는 배경에는 직접 제작한 "encrypted signal map" 그래픽
- A 트랙에는 `2026 Coming Soon` 배지 표시
- 비공개 B2C 제품명과 내부 코드명은 사용 금지

그래픽은 외부 사진 없이 CSS/SVG로 제작한다. 예: 여러 익명 신호가 PET Engine으로 들어가고 A/B/C 세 출력으로 나뉘는 구조.

## 5. Problem 섹션

기존 "Blockchain transparency is a bug" 중심의 문제 정의는 너무 좁다. 다음 3개 문제로 확장한다.

- Consumer demand: 수요 신호가 흩어져 있고 초기 물량 배분이 불확실함
- Enterprise risk: 신원, 이상거래, 민감 리스크 데이터를 조직 간 직접 공유하기 어려움
- Blockchain: 기본 공개 상태가 금융, 거버넌스, 기관 사용 사례를 제한함

시각적으로는 3개의 작은 분석 패널을 배치한다. 아이콘은 Material Icons 또는 직접 제작한 선형 아이콘만 사용한다.

## 6. Solutions 섹션

현재 `Coprocessor / Solana / DeFi / Voting` 4탭은 블록체인 중심으로 읽힌다. 이를 A/B/C 3탭으로 바꾼다.

권장 탭:

- A. B2C Demand Forecasting & Allocation
- B. B2B PET Risk Intelligence
- C. Blockchain Confidential Infrastructure

A 탭:

- 메시지: 익명화된 수요 신호를 기반으로 출시 전 수요 예측과 물량 배분 의사결정을 지원
- 표시: `2026 Coming Soon`
- 금지: 비공개 B2C 제품명, 내부 코드명, 특정 브랜드/플랫폼명
- 그래픽: 수요 곡선, 재고 박스, 익명 신호 점

B 탭:

- 메시지: 신원, 이상거래, 리스크 데이터를 직접 노출하지 않고 탐지와 검증을 수행
- 키워드: PET, FHE, MPC, anomaly detection, identity risk, transaction risk
- 그래픽: ID 노드, 리스크 스코어, 감사 로그, 이상 신호 하이라이트

C 탭:

- 메시지: 블록체인 상태와 검증 로직에 기밀성을 부여하는 인프라
- 키워드: confidential state, encrypted execution, threshold disclosure, verifiable result
- 그래픽: 암호화 상태, verifier, chain module

## 7. Technology 섹션

기술 섹션은 사업 축보다 한 단계 아래에 있는 공통 엔진으로 보여야 한다. "Shared PET Engine" 구조가 적합하다.

권장 구성:

- FHE16: 고성능 완전동형암호 연산
- FHE16-based MPC / SSFHE: 협업 계산과 조건부 복호화
- Threshold Disclosure: 필요한 경우에만 제한적으로 공개

각 기술 카드에는 "A/B/C 어디에 쓰이는지" 칩을 붙인다. 예: FHE16은 A 수요 신호 분석, B 리스크 탐지, C 암호화 상태 계산에 공통 적용.

사용자 확인으로 회사 소유가 확인된 기존 FHE16 계열 배경은 유지하고, 직접 제작한 흐름도와 수식형 라벨은 보조 오버레이로 사용한다.

## 8. Use Case 섹션

현재 4개 슬라이더형 블록체인 유스케이스는 3컬럼 포트폴리오 그리드로 바꾸는 편이 좋다.

권장 카드:

| Track | Title | Visual | CTA |
| --- | --- | --- | --- |
| A | B2C Demand Forecasting & Allocation | Masked demand graph | 2026 Coming Soon |
| B | B2B PET Risk Intelligence | Risk graph + audit log | Discuss enterprise pilot |
| C | Blockchain Confidential Infrastructure | Encrypted state flow | View technical docs |

이 섹션에서는 설명을 길게 늘리지 말고, 각 사업 축이 독립적인 시장을 향한다는 사실을 명확히 보여준다.

## 9. Roadmap 섹션

로드맵은 단일 블록체인 타임라인보다 A/B/C 3개 swimlane이 적합하다.

- A lane: prototype, closed alpha, 2026 coming soon
- B lane: enterprise pilot, PET risk model, compliance-ready reporting
- C lane: SVM/EVM confidential layer, threshold disclosure, developer docs

이렇게 구성하면 출시 전인 A를 노출하되 제품명을 숨길 수 있고, B/C도 같은 기술 코어의 확장으로 보인다.

## 10. 현재 자산 교체 판단

복원 가능으로 전환한 기존 wallpaper:

- `asset/bg/sec01-bg.jpeg`
- `asset/bg/sec02-bg.png`
- `asset/bg/sec04-FHE16-bg.png`
- `asset/bg/sec04-SSFHE-bg.png`

사용자가 FHE16이 들어간 사진은 회사 소유라고 확인했으므로 기술 섹션 배경으로 복원한다. hero/summary wallpaper도 회사 내부 wallpaper로 확인된 범위에서 복원하되, 원본 제작 파일과 승인 기록은 `asset-rights-register.md`에 계속 남긴다.

출처 증빙 전 계속 보류:

- `asset/bg/sec03slide01.png`
- `asset/bg/sec03slide02.png`
- `asset/bg/sec03slide03.png`
- `asset/bg/sec03slide04.png`
- `asset/graphic/sec05-slide*.png`
- `asset/graphic/sec06-usecase-*.png`
- `asset/graphic/sec06-Roadmap-title-img.png`
- 외부 기관, 언론, SNS, 파트너 로고

유지 가능하나 증빙 필요:

- `asset/head-logo.svg`
- `asset/icon/head-logo.svg`
- `asset/logo-filled-*.png`
- 팀 사진
- IR PDF 및 회사가 직접 작성한 자료

즉시 수정 권장:

- `asset/icon/hanyang-logo.svg` 404: 텍스트 표기로 대체하거나 승인된 로고 파일과 사용 허가 확인
- `asset/icon/news-naver.png` 404: 언론 로고 대신 텍스트 링크 사용
- `asset/OGP-1200_630.png` 404: 현재 존재하는 `asset/OGP-1200_640.png`로 맞추거나 직접 제작 OGP 이미지 생성

## 11. 자산 폴더 운영안

권장 구조:

```text
asset/
  brand/       waLLLnut 보유 로고와 브랜드 자산
  generated/   코드 또는 내부 제작 그래픽
  vendor/      라이선스 확인된 외부 오픈소스 자산
  legacy/      출처 확인 전 기존 자산, production 제외
docs/
  asset-rights-register.md
  third-party-notices.md
```

`asset-rights-register.md`에는 파일명, 제작자, 출처 URL, 라이선스, 상업적 이용 가능 여부, 비고를 기록한다. 출처가 비어 있는 파일은 production에서 제외하는 규칙을 둔다.

## 12. 결론

디자인은 "자체 제작 데이터 그래픽 중심의 PET 포트폴리오 사이트"로 바꾸는 것이 가장 안전하다. 이 방향이면 저작권 위험을 낮추면서도 A/B/C 사업 구조가 명확해지고, 아직 공개하면 안 되는 B2C 제품명도 숨길 수 있다.

최종 공개 메시지는 다음 순서가 좋다.

1. waLLLnut = PET 기반 기밀 연산 회사
2. A = B2C 수요 예측 및 물량 배분, 2026 Coming Soon
3. B = B2B 신원 및 이상거래 리스크 인텔리전스
4. C = Blockchain confidential infrastructure
5. 이 모든 것을 FHE16, MPC/SSFHE, threshold disclosure가 받치는 구조


## 13. 2026-05-24 추가 구현: Benchmark / Evidence 분리

- `benchmark.html`: 메인 히어로에서 벤치마크 슬라이드를 분리해 FHE16 연산 카테고리별 차트, 요약 지표, 대표 샘플 테이블을 한 페이지에서 확인하도록 구성했다.
- `traction.html`: 언론, 트랙션, 논문을 하나의 사업 근거 페이지로 묶었다. A는 B2C 수요 검증과 2026 Coming Soon, B는 B2B PET 리스크 PoC, C는 블록체인 기밀 인프라 근거로 읽히게 배치했다.
- 두 페이지 모두 외부 이미지/로고를 새로 사용하지 않았다. 배경은 사용자가 회사 소유로 확인한 기존 wallpaper만 재사용하고, UI는 CSS와 Material Icons로 구성했다.
- 메인 페이지의 Benchmark 메뉴는 `benchmark.html`, Research 메뉴는 `traction.html#papers`, `traction.html#press`, `traction.html#traction`으로 연결한다.
