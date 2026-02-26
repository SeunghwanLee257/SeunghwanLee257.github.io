---
theme: default
background: https://cover.sli.dev
class: text-center
highlighter: shiki
lineNumbers: false
drawings:
  persist: false
transition: slide-left
title: KOSCOM STO Privacy Layer | LatticA
---

# STO Payment Leg을 위한
# **프라이버시 인프라**

토큰증권(STO) 결제 시 거래 정보 보호 및 규제 준수를 동시에 달성

<div class="pt-12">
  <span class="px-2 py-1 rounded bg-blue-500 text-white">KOSCOM</span>
  <span class="px-2 py-1 rounded bg-teal-500 text-white">STO</span>
  <span class="px-2 py-1 rounded bg-purple-500 text-white">STABLECOIN</span>
</div>

<div class="abs-br m-6 text-sm">
  LatticA | ZK + FHE Infrastructure
</div>

---
transition: fade-out
---

# 한국 STO 시장 현황

<div class="grid grid-cols-3 gap-4 mt-8">
  <div class="bg-blue-50 p-4 rounded-lg text-center">
    <div class="text-2xl font-bold text-blue-600">2023.02</div>
    <div class="text-sm">금융위 STO 가이드라인</div>
  </div>
  <div class="bg-blue-50 p-4 rounded-lg text-center">
    <div class="text-2xl font-bold text-blue-600">2024.02</div>
    <div class="text-sm">토큰증권 발행 시작</div>
  </div>
  <div class="bg-teal-50 p-4 rounded-lg text-center border-2 border-teal-500">
    <div class="text-2xl font-bold text-teal-600">2025</div>
    <div class="text-sm">Stablecoin 결제 논의</div>
  </div>
</div>

<div class="mt-8 p-4 bg-gray-100 rounded-lg">
  <span class="font-bold">11개</span> 기업이 STO 발행 완료 (2025.01 기준)
</div>

<div class="mt-4 text-xs text-gray-500">
  출처: <a href="https://www.fsc.go.kr/no010101/79241">금융위원회</a> | <a href="https://www.hankyung.com/article/202501027181i">한국경제</a>
</div>

---

# 문제: STO 결제 시 정보 노출

<div class="grid grid-cols-2 gap-8 mt-6">
  <div class="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
    <h3 class="text-lg font-bold text-red-700">거래 금액 노출</h3>
    <ul class="mt-2 text-sm">
      <li>블록체인 상 모든 결제 내역 공개</li>
      <li>경쟁사가 거래 규모 파악 가능</li>
    </ul>
  </div>
  <div class="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
    <h3 class="text-lg font-bold text-red-700">거래 관계 노출</h3>
    <ul class="mt-2 text-sm">
      <li>누가 누구와 거래하는지 추적 가능</li>
      <li>기업 전략 및 파트너십 유출 우려</li>
    </ul>
  </div>
</div>

<div class="mt-8 p-4 bg-yellow-50 border border-yellow-400 rounded-lg">
  <span class="font-bold">⚠️ 현재 상황:</span> Stablecoin 결제가 시작되면 모든 거래 내역이 체인에 기록 → 경쟁사/제3자가 분석 가능
</div>

---

# 기존 방식의 한계

| 기능 | 일반 블록체인 | 프라이빗 체인 | **LatticA** |
|------|:---:|:---:|:---:|
| 금액 비공개 | ❌ | 제한적 | ✅ |
| 주소 비공개 | ❌ | 내부만 | ✅ |
| 규제 준수 (AML/KYC) | ✅ | ✅ | ✅ |
| 감독 기관 감사 | ✅ | 제한적 | ✅ |

<div class="mt-6 p-4 bg-blue-50 rounded-lg text-center">
  <span class="font-bold">핵심 요구사항:</span> 프라이버시 + 규제준수 = 양립 가능해야 함<br>
  → <span class="text-blue-600 font-bold">LatticA는 둘 다 제공</span>
</div>

---
layout: two-cols
---

# ZK + FHE 아키텍처

<div class="mt-4 space-y-4">
  <div class="p-3 bg-blue-50 rounded">
    <div class="font-bold text-blue-700">영지식 증명 (ZKP)</div>
    <div class="text-sm">데이터 공개 없이 유효성 검증</div>
  </div>
  <div class="p-3 bg-teal-50 rounded border-2 border-teal-400">
    <div class="font-bold text-teal-700">동형암호 (FHE)</div>
    <div class="text-sm">암호화 상태로 연산 수행</div>
  </div>
  <div class="p-3 bg-blue-50 rounded">
    <div class="font-bold text-blue-700">MPC Threshold</div>
    <div class="text-sm">다자간 연산으로 복호화 분산</div>
  </div>
</div>

::right::

<div class="p-4 bg-gray-100 rounded-lg mt-10 ml-4">
  <div class="text-sm font-bold">감독 기관 질의</div>
  <code class="text-xs">"X 기업의 월간 거래 총액 > 10억?"</code>
  <div class="text-center my-2">↓</div>
  <div class="text-sm font-bold text-teal-600">FHE 응답</div>
  <code class="text-xs">TRUE (암호화 상태로 계산됨)</code>
</div>

---

# 코스콤 STO 적용 시나리오

<div class="flex items-center justify-center gap-2 mt-6 text-sm">
  <div class="p-3 bg-blue-100 rounded text-center">
    <div class="font-bold">1. STO 발행</div>
  </div>
  <span>→</span>
  <div class="p-3 bg-blue-100 rounded text-center">
    <div class="font-bold">2. Stablecoin 결제</div>
  </div>
  <span>→</span>
  <div class="p-3 bg-teal-100 rounded text-center border-2 border-teal-500">
    <div class="font-bold">3. LatticA</div>
  </div>
  <span>→</span>
  <div class="p-3 bg-blue-100 rounded text-center">
    <div class="font-bold">4. 규제 준수</div>
  </div>
</div>

<div class="grid grid-cols-3 gap-4 mt-8">
  <div class="p-4 bg-gray-50 rounded-lg text-center">
    <div class="text-2xl">🏢</div>
    <div class="font-bold">기업 고객</div>
    <div class="text-xs mt-1">경쟁사에 거래 정보 비공개</div>
  </div>
  <div class="p-4 bg-gray-50 rounded-lg text-center">
    <div class="text-2xl">🏛️</div>
    <div class="font-bold">코스콤</div>
    <div class="text-xs mt-1">차별화된 STO 인프라 제공</div>
  </div>
  <div class="p-4 bg-gray-50 rounded-lg text-center">
    <div class="text-2xl">📋</div>
    <div class="font-bold">금융당국</div>
    <div class="text-xs mt-1">암호화 상태로 감사 가능</div>
  </div>
</div>

---

# Why LatticA

<div class="grid grid-cols-3 gap-6 mt-6">
  <div class="p-4 bg-teal-50 rounded-lg text-center border-2 border-teal-400">
    <div class="text-3xl font-bold text-teal-600">1.9x</div>
    <div class="font-bold">FHE 성능</div>
    <div class="text-xs">ZAMA 대비 부트스트래핑 속도</div>
  </div>
  <div class="p-4 bg-gray-50 rounded-lg text-center">
    <div class="text-xl font-bold">Cross-Platform</div>
    <div class="font-bold">결정론적 연산</div>
    <div class="text-xs">CPU/GPU/FPGA 동일 결과</div>
  </div>
  <div class="p-4 bg-blue-50 rounded-lg text-center">
    <div class="text-xl font-bold">Compliance</div>
    <div class="font-bold">금융 규제 대응</div>
    <div class="text-xs">AML/KYC + 감사 로그 내장</div>
  </div>
</div>

<div class="mt-6 text-center">
  <span class="px-4 py-2 bg-green-500 text-white rounded-full font-bold">Production Ready - PoC 즉시 진행 가능</span>
</div>

<div class="mt-4 text-xs text-gray-500 text-center">
  출처: <a href="https://eprint.iacr.org/2025/2150">ePrint 2025/2150</a>
</div>

---

# 협력 방안: 코스콤과 함께

<div class="flex items-center justify-center gap-4 mt-8">
  <div class="p-6 bg-blue-50 rounded-lg text-center w-48">
    <div class="text-xs text-blue-600 font-bold">Phase 1</div>
    <div class="text-sm text-gray-500">1-2개월</div>
    <div class="text-lg font-bold mt-2">PoC 구축</div>
    <div class="text-xs mt-1">테스트넷에서 검증</div>
  </div>
  <span class="text-2xl">→</span>
  <div class="p-6 bg-blue-50 rounded-lg text-center w-48">
    <div class="text-xs text-blue-600 font-bold">Phase 2</div>
    <div class="text-sm text-gray-500">3-4개월</div>
    <div class="text-lg font-bold mt-2">파일럿</div>
    <div class="text-xs mt-1">선별 고객사 실증</div>
  </div>
  <span class="text-2xl">→</span>
  <div class="p-6 bg-teal-50 rounded-lg text-center w-48 border-2 border-teal-500">
    <div class="text-xs text-teal-600 font-bold">Phase 3</div>
    <div class="text-sm text-gray-500">6개월+</div>
    <div class="text-lg font-bold mt-2">상용화</div>
    <div class="text-xs mt-1">STO 결제 시스템 통합</div>
  </div>
</div>

---
layout: center
class: text-center
---

# 감사합니다

**LatticA** | ZK + FHE Infrastructure

📧 contact@lattica.io | 🔗 lattica.io

<div class="mt-8 text-xs text-gray-500">
  <a href="https://www.koscom.co.kr">KOSCOM</a> | <a href="https://www.fsc.go.kr/no010101/79241">금융위 STO 가이드라인</a>
</div>
