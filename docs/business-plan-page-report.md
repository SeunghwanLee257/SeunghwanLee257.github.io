# waLLLnut 사업계획서형 페이지 개편 보고서

작성일: 2026-05-24
대상: `walllnut.com` 정적 페이지

## 1. 개편 방향

이번 수정의 목표는 페이지를 단순 기술/제품 소개가 아니라 하나의 사업계획서 흐름으로 읽히게 만드는 것이다. 첫 화면에서 A/B/C 사업 축을 노출하고, 이후 섹션은 문제 정의, 실행 전략, 제품 트랙, 기술 차별성, 비즈니스 모델, GTM, 로드맵 순서로 이어지도록 재구성했다.

공개 페이지에서는 비공개 B2C 제품명과 내부 코드명은 사용하지 않았다. A 트랙은 `B2C 수요 예측 및 물량 배분`, 상태는 `2026 Coming Soon`으로만 표현했다.

## 2. Good_IR 반영 내용

### A. B2C Demand Forecasting & Allocation

반영한 핵심 내용:

- 비공개 수요 조사와 지불 의향 분석을 기반으로 가격, 물량, 재입고 의사결정을 지원
- 출시 전 수요 리포트, 판매자/크리에이터 온보딩, 거래 수수료, 프리미엄 판매자 도구, 정품/물류 모듈로 확장 가능한 구조
- 공개 페이지에서는 특정 제품명, 내부 브랜드명, 파트너명, 세부 운영 전략을 숨김

페이지 반영 위치:

- Hero A 카드
- Market Problem A 카드
- Business Tracks A 탭
- Business Model & GTM A 카드
- Roadmap 2026 A 항목

### B. B2B PET Risk Intelligence

반영한 핵심 내용:

- 보험 청구 교차검증, 신원 불일치, 이상 거래, FDS, 감사 가능한 리스크 흐름
- 원본 고객/거래 데이터를 이동하지 않고 필요한 검증 결과와 의심 신호만 출력
- PoC, 유료 파일럿, 구독 또는 건당 과금으로 이어지는 GTM 경로
- D-Testbed/TIPS 자료의 보험·금융 리스크 PoC 방향을 공개 가능한 수준으로 요약

페이지 반영 위치:

- Hero B 카드
- Market Problem B 카드
- Business Tracks B 탭
- Competitive Position 표
- Business Model & GTM B 카드
- Roadmap 2026 B 항목

### C. Blockchain Confidential Infrastructure

반영한 핵심 내용:

- FHE16 기반 기밀 상태, 암호화 실행, threshold disclosure, 공개 검증성
- SVM/EVM 모듈, 개발자 문서, SDK, 파트너 통합으로 확장 가능한 인프라 트랙
- 기존 블록체인 중심 메시지는 C 트랙 안으로 흡수하고, 회사 전체 메시지는 PET 사업 포트폴리오로 확장

페이지 반영 위치:

- Hero C 카드
- Market Problem C 카드
- Business Tracks C 탭
- Technology Moat
- Developer Infrastructure
- Roadmap 2027+ C 항목

## 3. 현재 페이지 구조

1. Market Problem: A/B/C 시장별 원본 데이터 공유 한계
2. Executive Summary: 하나의 PET 엔진과 세 가지 사업 트랙
3. Business Tracks: A B2C, B B2B, C Blockchain 탭
4. Technology Moat: FHE16과 SSFHE 기반 공통 엔진
5. Competitive Position: 표준 분석, MPC/PSI, ZK, TEE 대비 포지션
6. Business Model & GTM: 각 트랙의 수익화와 시장 진입 방식
7. Team: 연구 기반 실행팀
8. Ecosystem: 연구, 파일럿, 기술 협력
9. Developer Infrastructure: GitHub, 문서, SDK, 브라우저 실행 경로
10. Roadmap: 2024 연구 기반부터 2028 크로스마켓 PET 플랫폼까지
11. Research
12. Press & Media
13. Contact / Business Plan Request

## 4. 디자인 판단

디자인은 블록체인/크립토 느낌을 줄이고, 사업계획서·기술 포트폴리오·엔터프라이즈 인텔리전스에 가까운 톤으로 정리했다.

- 직접 제작한 CSS 그래픽과 SVG만 신규 시각 자산으로 사용
- 사용자 확인으로 회사 소유가 확인된 기존 hero/summary/FHE16 계열 wallpaper는 복원하고, 출처가 아직 확인되지 않은 섹션 이미지, 기관/언론 로고는 활성 페이지에서 제외
- A/B/C는 카드, 그래프, 감사 로그, 암호화 상태 흐름으로 구분
- 기존 waLLLnut orange는 유지하되 단색 팔레트가 되지 않도록 neutral, teal, ink 계열을 함께 사용
- 공개 전 B2C 제품명은 문구, 파일명, JS 번역 문자열 어디에도 넣지 않음

## 5. 라이선스 확인

현재 활성 페이지 기준으로 새로 사용하는 디자인 소스는 직접 제작 CSS/SVG 그래픽이다. 상업적 사용 가능한 오픈소스 의존성은 다음 문서에 정리했다.

- `docs/asset-rights-register.md`
- `docs/third-party-notices.md`

확인된 항목:

- Asap Condensed: SIL Open Font License 1.1, 상업적 사용 가능
- Pretendard: SIL Open Font License 1.1, 상업적 사용 가능
- Google Material Icons: Apache License 2.0, 상업적 사용 가능
- Tailwind CSS, Chart.js, AOS, Animate.css: MIT, 상업적 사용 가능

보류/추가 확인 필요:

- 회사 로고와 favicon은 내부 브랜드 자산임을 확인해야 함
- 팀/알럼나이 사진은 촬영자 권리와 당사자 사용 동의를 보관해야 함
- IR PDF는 공개 배포 전 포함 이미지, 로고, 외부 자료 권리 확인이 필요함

## 6. 검증 기준

배포 전 최소 확인 항목:

- 비공개 B2C 제품명과 내부 코드명이 public HTML/CSS/JS에 없는지 검색
- 복원된 `asset/bg/sec01-bg.jpeg`, `asset/bg/sec02-bg.png`, `asset/bg/sec04-FHE16-bg.png`, `asset/bg/sec04-SSFHE-bg.png` 외에 출처 불명 `asset/graphic`, `asset/icon` 이미지가 활성 페이지에 남아 있지 않은지 검색
- JS 문법 검사
- 로컬 서버에서 첫 화면과 주요 섹션 렌더링 확인
- 모바일 폭에서 Hero, Business Model 카드, Competitive Position 표가 겹치지 않는지 확인
