# waLLLnut 카피 기준 (Copy Guidelines)

웹사이트·덱·문서의 모든 문장은 이 기준을 따른다. FHE/암호 회사 30여 곳(Zama, Cornami, Duality, Aleo, Stripe, Vercel 등) 실측 카피 분석에서 도출.

## 5대 원칙

1. **주어는 기술이 아니라 결과/행동.**
   FHE·PET·기밀연산·MPC는 문장의 주어가 아니라 *수단* 자리로 내린다. 헤드라인에 "FHE"를 쓰지 않는다.
   - ❌ "PET 기반 기밀 연산으로 … 연결합니다"
   - ✅ "가장 민감한 데이터를 그대로 활용합니다 — 원본은 한 번도 드러내지 않고"

2. **구체 동사 + 구체 목적어.**
   "연결/축적/패키징/구축/전환" 같은 추상 동사 금지. 독자가 *무엇을 하는지/얻는지*를 쓴다.
   - ❌ "compound the technical core into blockchain infrastructure"
   - ✅ "브라우저에서 암호문 위 정수·실수 연산을 직접 실행"

3. **투자자를 호명하지 않는다. 절박함을 노출하지 않는다.**
   "투자 관점 / Investment thesis / 투자자가 봐야 할 점 / wedge / moat / GTM / 투자자가 이해하기 쉽게" 같은 피치덱 어휘는 전부 금지.
   투자자는 결과·숫자·트랙션·논문을 보고 *스스로* 결론 낸다. Show, don't beg.
   - ❌ "투자자가 먼저 봐야 할 점", "Entry wedge", "Technical moat"
   - ✅ "하나의 프라이버시 엔진, 세 개의 제품", "시작 지점", "핵심 기술"

4. **반증 가능한 숫자·증거를 박는다.**
   2.89ms 부트스트래핑, CRYPTO 2025, bit-exact, 키생성 ~3초, 동료평가 논문 5편, 오픈소스, 라이브 데모.
   형용사보다 숫자 하나가 강하다.

5. **과장 금지.**
   "최고 / 차세대 / 세계 최초 / unbreakable / quantum-proof / best-in-class / state-of-the-art" 금지.
   대신 정확한 사실과 표준 근거("128-bit 보안, 표준 격자 암호"). 한계도 숨기지 않는다.

## 문장 구성 공식

```
[결과/행동] + [대상] + (수단은 뒤에) + (숫자 증거)
```
- 히어로 H1 = 큰 약속(결과), 서브헤드 = "누구를 위해 + 어떻게" + 숫자.
- 두 번째 블록 = 문제(pain)를 독자 언어로.
- 그다음 = 작동 방식(1문장 정의) → 증명(숫자/논문/데모) → CTA.
- CTA는 청중별로: 개발자 "브라우저에서 바로 실행", 기업 "팀과 상담". 섞지 않는다.

## 금지어 목록

`투자 관점` · `Investment thesis` · `투자자가 봐야/신경써야 할 점` · `wedge` · `moat` ·
`GTM` · `go-to-market` · `packaging/패키징` (제품 설명 시) · `compound/축적` ·
`차세대` · `세계 최초` · `unbreakable` · `best-in-class` · `state-of-the-art` ·
`혁신적인`(단독) · `cutting-edge`

## Before → After 예시 (실제 반영됨)

| Before | After |
|---|---|
| PET 기반 기밀 연산으로 … 인프라를 연결합니다 | 가장 민감한 데이터를 그대로 활용합니다 — 원본은 한 번도 드러내지 않고 |
| 투자 관점: … 세 개의 제품 시장으로 패키징합니다 | 하나의 프라이버시 엔진, 세 개의 제품 |
| The privacy engine behind our product lines | Compute on encrypted data — without ever decrypting it |
| 투자자가 먼저 봐야 할 점 | (삭제) 작동 방식 + 트랙별 증명 + Proof 밴드 |
| Entry wedge / Technical moat / Trust promise | 시작 지점 / 핵심 기술 / 보안 약속 |
| First wedge: paid demand intelligence | Paid demand and allocation intelligence |

## 언어

- 기본 언어는 **한국어**(ko-first). 저장된 선택/`?lang=`만 예외.
- ko/en 모두 위 원칙을 따른다. 한 사전(en)에 한글 값이 섞이지 않게 한다.
