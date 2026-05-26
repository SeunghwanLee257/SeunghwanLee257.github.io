/**
 * Solutions Tab Module
 * Handles solution content switching
 */

import { $$, $, toggleClass, setAttr } from '../utils/dom.js';
import { safeExecute } from '../utils/error-handler.js';

// Translations are managed in language.js
// This function gets translations from the language module
function getSolutionData(key, lang = 'en') {
  const translations = {
    en: {
      fhe16: {
        title: 'FHE16 Deterministic Homomorphic Runtime',
        body: '<p>Fully homomorphic encryption allows computation directly on encrypted data: the input stays hidden, the circuit runs on ciphertext, and only the permitted result is decrypted.</p><div class="solution-detail-grid"><article><strong>What it solves</strong><span>Private comparison, scoring, arithmetic, allocation, and verification workflows where raw data cannot move.</span></article><article><strong>Compatibility rule</strong><span>If an implementation follows the LibFHE16Python specification, outputs are compatible and deterministic across devices.</span></article></div><ul class="solution-bullet-list"><li>16-bit integer execution avoids floating-point drift.</li><li>Browser, server, GPU, FPGA, and Python bindings can share the same circuit semantics.</li><li>Device-free result consistency: the same encrypted input and operation produce the same decrypted output.</li></ul>',
        sub: 'LibFHE16Python-compatible · Device-free deterministic output',
        visual: 'fhe16',
        image: './asset/generated/tech-fhe16-photo-v2.jpg',
        alt: 'FHE16 deterministic homomorphic encryption visual'
      },
      browser: {
        title: 'A. FHE16 Browser Runtime',
        body: '<p>Web Browser build brings encrypted computation to the client side. Users can run sensitive checks in the browser before data ever reaches a server.</p><div class="solution-detail-grid"><article><strong>Impact</strong><span>Lower trust requirements for consumer surveys, private scoring, eligibility checks, and lightweight confidential apps.</span></article><article><strong>Release path</strong><span>Browser runtime is the nearest-term build path and unlocks demos, onboarding, and edge execution.</span></article></div><ul class="solution-bullet-list"><li>Solves private form analysis, hidden willingness-to-pay checks, and encrypted pre-screening.</li><li>Reduces server-side raw data collection.</li><li>Keeps FHE16 outputs compatible with LibFHE16Python semantics.</li></ul>',
        sub: 'Soon · Client-side encrypted execution',
        visual: 'browser',
        image: './asset/generated/business-demand-photo-v2.jpg',
        alt: 'FHE16 browser runtime visual'
      },
      sdk: {
        title: 'B. FHE16 Device-Free SDK',
        body: '<p>SDK build packages the same FHE16 spec for server deployments first, then GPU acceleration around 2027 and FPGA acceleration around 2028.</p><div class="solution-detail-grid"><article><strong>What it solves</strong><span>Production integration for enterprise risk engines, encrypted analytics, batch scoring, and high-throughput workloads.</span></article><article><strong>Device-free promise</strong><span>Different hardware targets can run compatible implementations without changing the meaning of the result.</span></article></div><ul class="solution-bullet-list"><li>Server SDK for API integration and controlled production rollout.</li><li>GPU path for parallel throughput and vectorized encrypted workloads.</li><li>FPGA path for appliance-grade latency, power, and deployment control.</li></ul>',
        sub: 'Server build · GPU ~2027 · FPGA ~2028',
        visual: 'sdk',
        image: './asset/generated/tech-ssfhe-photo-v2.jpg',
        alt: 'FHE16 SDK hardware acceleration visual'
      },
      mpc: {
        title: 'C. FHE16 KeyMesh MPC',
        body: '<p>FHE16-based MPC turns key management into a distributed control layer. No single party needs to hold full authority over keys, disclosure, or result release.</p><div class="solution-detail-grid"><article><strong>What it solves</strong><span>Threshold decryption, joint governance, regulated disclosure, cross-organization audit, and key rotation.</span></article><article><strong>Why FHE16 matters</strong><span>Deterministic integer execution prevents platform drift when multiple parties compute or validate shares on different devices.</span></article></div><ul class="solution-bullet-list"><li>Supports policy-based key custody and threshold result release.</li><li>Fits B2B identity, FDS, insurance, and blockchain confidential-state workflows.</li><li>Compatible circuit semantics make MPC participants easier to coordinate.</li></ul>',
        sub: 'Distributed key management · Threshold disclosure',
        visual: 'mpc',
        image: './asset/generated/business-chain-photo-v2.jpg',
        alt: 'FHE16-based MPC key management visual'
      }
    },
    ko: {
      fhe16: {
        title: 'FHE16 결정론적 동형암호 런타임',
        body: '<p>완전동형암호는 암호화된 값 위에서 그대로 계산하는 기술입니다. 원본은 숨겨진 상태로 남고, 회로는 암호문 위에서 실행되며, 허용된 결과만 복호화됩니다.</p><div class="solution-detail-grid"><article><strong>무엇을 푸는가</strong><span>원본 데이터를 이동할 수 없는 비교, 스코어링, 산술, 물량 배분, 검증 워크플로를 풉니다.</span></article><article><strong>호환 규칙</strong><span>LibFHE16Python 스펙대로 만들면 구현체가 달라도 결과 의미가 호환되고, 디바이스와 무관하게 동일한 결과를 냅니다.</span></article></div><ul class="solution-bullet-list"><li>16비트 정수 실행으로 부동소수점 오차와 플랫폼 드리프트를 제거합니다.</li><li>브라우저, 서버, GPU, FPGA, Python 바인딩이 같은 회로 의미를 공유합니다.</li><li>동일한 암호문 입력과 연산은 어느 디바이스에서도 같은 복호화 결과로 이어집니다.</li></ul>',
        sub: 'LibFHE16Python 호환 · 디바이스 프리 결정론적 결과',
        visual: 'fhe16',
        image: './asset/generated/tech-fhe16-photo-v2.jpg',
        alt: 'FHE16 deterministic homomorphic encryption visual'
      },
      browser: {
        title: 'A. FHE16 브라우저 런타임',
        body: '<p>Web Browser build는 암호화 연산을 클라이언트 쪽으로 끌어옵니다. 사용자는 민감한 값을 서버에 보내기 전에 브라우저 안에서 암호화된 검사를 수행할 수 있습니다.</p><div class="solution-detail-grid"><article><strong>파급효과</strong><span>소비자 수요조사, 비공개 스코어링, 자격 검증, 가벼운 기밀 앱에서 서버 신뢰 요구를 낮춥니다.</span></article><article><strong>출시 경로</strong><span>브라우저 런타임은 가장 가까운 빌드 경로이며 데모, 온보딩, 엣지 실행을 열어줍니다.</span></article></div><ul class="solution-bullet-list"><li>비공개 설문 분석, 지불 의향 체크, 암호화 사전 검증 문제를 풉니다.</li><li>서버가 원본 데이터를 수집해야 하는 부담을 줄입니다.</li><li>FHE16 결과는 LibFHE16Python 의미론과 호환되도록 유지됩니다.</li></ul>',
        sub: '곧 공개 · 클라이언트 사이드 암호화 실행',
        visual: 'browser',
        image: './asset/generated/business-demand-photo-v2.jpg',
        alt: 'FHE16 browser runtime visual'
      },
      sdk: {
        title: 'B. FHE16 디바이스 프리 SDK',
        body: '<p>SDK build는 동일한 FHE16 스펙을 서버 배포부터 패키징하고, 이후 GPU 가속은 2027년 전후, FPGA 가속은 2028년 전후 경로로 확장합니다.</p><div class="solution-detail-grid"><article><strong>무엇을 푸는가</strong><span>기업 리스크 엔진, 암호화 분석, 배치 스코어링, 고처리량 워크로드의 프로덕션 통합을 풉니다.</span></article><article><strong>디바이스 프리 약속</strong><span>서로 다른 하드웨어 타깃에서도 결과의 의미를 바꾸지 않고 호환 구현을 실행할 수 있습니다.</span></article></div><ul class="solution-bullet-list"><li>서버 SDK는 API 통합과 통제된 프로덕션 롤아웃을 지원합니다.</li><li>GPU 경로는 병렬 처리량과 벡터화된 암호화 워크로드를 겨냥합니다.</li><li>FPGA 경로는 어플라이언스급 지연시간, 전력, 배포 통제를 겨냥합니다.</li></ul>',
        sub: '서버 우선 · GPU ~2027 · FPGA ~2028',
        visual: 'sdk',
        image: './asset/generated/tech-ssfhe-photo-v2.jpg',
        alt: 'FHE16 SDK hardware acceleration visual'
      },
      mpc: {
        title: 'C. FHE16 KeyMesh MPC',
        body: '<p>FHE16-based MPC는 키 관리를 분산 제어 레이어로 만듭니다. 한 주체가 키, 공개 권한, 결과 릴리즈를 단독으로 쥘 필요가 없습니다.</p><div class="solution-detail-grid"><article><strong>무엇을 푸는가</strong><span>임계값 복호화, 공동 거버넌스, 규제형 공개, 기관 간 감사, 키 로테이션 문제를 풉니다.</span></article><article><strong>FHE16이 필요한 이유</strong><span>여러 참여자가 서로 다른 디바이스에서 share를 계산하거나 검증해도 정수 기반 결정론 실행으로 플랫폼 드리프트를 막습니다.</span></article></div><ul class="solution-bullet-list"><li>정책 기반 키 보관과 threshold result release를 지원합니다.</li><li>B2B 신원, FDS, 보험, 블록체인 기밀 상태 워크플로에 맞습니다.</li><li>호환 가능한 회로 의미론으로 MPC 참여자 조율 비용을 낮춥니다.</li></ul>',
        sub: '분산 키 관리 · 임계값 공개',
        visual: 'mpc',
        image: './asset/generated/business-chain-photo-v2.jpg',
        alt: 'FHE16-based MPC key management visual'
      }
    }
  };

  const langData = translations[lang] || translations.en;
  return langData[key] || langData.fhe16;
}

function getCurrentLang() {
  try {
    return localStorage.getItem('lang') || document.documentElement.getAttribute('lang') || 'en';
  } catch(e) {
    return 'en';
  }
}

export function initSolutions() {
  const solutionButtons = $$('.solutions-tab');
  const solutionCard = $('[data-solution-card]');
  const solutionTitle = $('[data-solution-title]');
  const solutionBody = $('[data-solution-body]');
  const solutionSub = $('[data-solution-sub]');
  const solutionVisual = $('[data-solution-visual]');
  const solutionImage = $('[data-solution-image]');

  const setSolutionContent = (key) => {
    return safeExecute(() => {
      if (!solutionCard || !solutionTitle || !solutionBody || !solutionSub || !solutionVisual) return;
      const lang = getCurrentLang();
      const payload = getSolutionData(key, lang);
      solutionCard.classList.add('is-transitioning');
      requestAnimationFrame(() => {
        solutionTitle.textContent = payload.title;
        solutionBody.innerHTML = payload.body; // Use innerHTML to support <br> tags
        solutionSub.textContent = payload.sub;
        solutionVisual.dataset.visual = payload.visual;
        solutionVisual.style.backgroundImage = '';
        if (solutionImage && payload.image) {
          solutionImage.src = payload.image;
          solutionImage.alt = payload.alt || payload.title;
        }
        solutionCard.classList.remove('is-transitioning');
      });
    }, 'Solutions: setSolutionContent');
  };
  
  // Listen for language changes
  document.addEventListener('language:changed', () => {
    const activeBtn = $('.solutions-tab.is-active');
    if (activeBtn) {
      const key = activeBtn.dataset.solution;
      if (key) {
        setSolutionContent(key);
      }
    }
  });

  solutionButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) return;
      solutionButtons.forEach(b => {
        toggleClass(b, 'is-active', false);
        setAttr(b, 'aria-selected', false);
      });
      toggleClass(btn, 'is-active', true);
      setAttr(btn, 'aria-selected', true);
      setSolutionContent(btn.dataset.solution);
    });
  });

  const activeBtn = $('.solutions-tab.is-active');
  setSolutionContent(activeBtn?.dataset.solution || 'fhe16');
}

