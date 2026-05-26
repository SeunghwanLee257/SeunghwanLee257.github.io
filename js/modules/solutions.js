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
        title: 'FHE16 privacy execution engine',
        body: '<p>FHE16 lets software calculate on encrypted data, so customers can use sensitive signals without first exposing or pooling the raw data.</p><div class="solution-detail-grid"><article><strong>Business role</strong><span>The same engine supports demand intelligence, risk checks, and confidential blockchain modules.</span></article><article><strong>Compatibility rule</strong><span>Implementations following the LibFHE16Python specification are designed to return the same result across devices.</span></article></div><ul class="solution-bullet-list"><li>16-bit integer execution avoids floating-point drift.</li><li>Browser, server, GPU, FPGA, and Python bindings can share the same circuit semantics.</li><li>Device-free result consistency reduces integration risk for customers.</li></ul>',
        sub: 'LibFHE16Python-compatible · Device-free deterministic output',
        visual: 'fhe16',
        image: './asset/generated/tech-fhe16-photo-v2.jpg',
        alt: 'FHE16 deterministic homomorphic encryption visual'
      },
      browser: {
        title: 'A. SignalSafe Browser Runtime',
        body: '<p>The browser build is the lowest-friction entry point: users can run privacy-preserving checks from a normal web page before raw data reaches a server.</p><div class="solution-detail-grid"><article><strong>What it unlocks</strong><span>Private surveys, willingness-to-pay checks, pre-screening, and lightweight confidential workflows.</span></article><article><strong>Why it matters commercially</strong><span>It shortens trial cycles for B2C and enterprise users because no special hardware or installation is required.</span></article></div><ul class="solution-bullet-list"><li>Near-term release path for demos and onboarding.</li><li>Reduces raw-data collection on the server side.</li><li>Keeps outputs compatible with LibFHE16Python semantics.</li></ul>',
        sub: 'Soon · Client-side encrypted execution',
        visual: 'browser',
        image: './asset/generated/business-demand-photo-v2.jpg',
        alt: 'FHE16 browser runtime visual'
      },
      sdk: {
        title: 'B. ConsistentCompute SDK',
        body: '<p>The SDK packages FHE16 for production systems: server first, GPU acceleration around 2027, and FPGA acceleration around 2028.</p><div class="solution-detail-grid"><article><strong>What customers buy</strong><span>Integration into risk engines, encrypted analytics, batch scoring, and high-throughput confidential workloads.</span></article><article><strong>Device-free promise</strong><span>Different hardware targets can run compatible implementations without changing the meaning of the result.</span></article></div><ul class="solution-bullet-list"><li>Server SDK for API integration and controlled production rollout.</li><li>GPU path for vectorized encrypted workloads and throughput-first execution.</li><li>FPGA path for deployment control, latency, and power efficiency.</li></ul>',
        sub: 'Server build · GPU ~2027 · FPGA ~2028',
        visual: 'sdk',
        image: './asset/generated/tech-ssfhe-photo-v2.jpg',
        alt: 'FHE16 SDK hardware acceleration visual'
      },
      mpc: {
        title: 'C. KeyMesh MPC 제어 레이어',
        body: '<p>KeyMesh uses FHE16-based MPC to make keys and result release jointly controlled instead of owned by a single operator.</p><div class="solution-detail-grid"><article><strong>What it unlocks</strong><span>Threshold decryption, regulated disclosure, cross-organization audit, and key rotation.</span></article><article><strong>Why FHE16 matters</strong><span>Deterministic integer execution reduces platform drift when participants compute or validate shares on different devices.</span></article></div><ul class="solution-bullet-list"><li>Supports policy-based key custody and threshold result release.</li><li>Fits B2B identity, FDS, insurance, and blockchain confidential-state workflows.</li><li>Compatible circuit semantics lower coordination cost across participants.</li></ul>',
        sub: 'Distributed key management · Threshold disclosure',
        visual: 'mpc',
        image: './asset/generated/business-chain-photo-v2.jpg',
        alt: 'FHE16-based MPC key management visual'
      }
    },
    ko: {
      fhe16: {
        title: 'FHE16 프라이버시 실행 엔진',
        body: '<p>FHE16은 암호화된 데이터 위에서 바로 계산하게 해, 고객이 원본을 공개하거나 한곳에 모으지 않고도 민감 신호를 활용할 수 있게 합니다.</p><div class="solution-detail-grid"><article><strong>사업적 역할</strong><span>같은 엔진이 수요 인텔리전스, 리스크 검증, 블록체인 기밀 모듈을 지탱합니다.</span></article><article><strong>호환 규칙</strong><span>LibFHE16Python 스펙을 따르면 디바이스가 달라도 같은 결과를 목표로 합니다.</span></article></div><ul class="solution-bullet-list"><li>16비트 정수 실행으로 부동소수점 오차와 플랫폼 드리프트를 줄입니다.</li><li>브라우저, 서버, GPU, FPGA, Python 바인딩이 같은 회로 의미를 공유합니다.</li><li>디바이스 프리 결과 일관성은 고객 통합 리스크를 낮춥니다.</li></ul>',
        sub: 'LibFHE16Python 호환 · 디바이스 프리 결정론적 결과',
        visual: 'fhe16',
        image: './asset/generated/tech-fhe16-photo-v2.jpg',
        alt: 'FHE16 deterministic homomorphic encryption visual'
      },
      browser: {
        title: 'A. SignalSafe 브라우저 런타임',
        body: '<p>브라우저 빌드는 가장 낮은 진입장벽의 제품 경로입니다. 일반 웹페이지에서 원본이 서버에 도착하기 전에 프라이버시 보존 검사를 실행할 수 있습니다.</p><div class="solution-detail-grid"><article><strong>무엇을 여는가</strong><span>비공개 설문, 지불 의향 체크, 사전 검증, 가벼운 기밀 워크플로를 엽니다.</span></article><article><strong>상업적 의미</strong><span>특수 하드웨어나 설치가 없어 B2C와 기업 고객의 체험 주기를 짧게 만듭니다.</span></article></div><ul class="solution-bullet-list"><li>데모와 온보딩을 위한 가장 가까운 출시 경로입니다.</li><li>서버의 원본 데이터 수집 부담을 줄입니다.</li><li>출력은 LibFHE16Python 의미론과 호환되도록 유지합니다.</li></ul>',
        sub: '곧 공개 · 클라이언트 사이드 암호화 실행',
        visual: 'browser',
        image: './asset/generated/business-demand-photo-v2.jpg',
        alt: 'FHE16 browser runtime visual'
      },
      sdk: {
        title: 'B. ConsistentCompute SDK',
        body: '<p>SDK는 FHE16을 프로덕션 시스템에 넣기 위한 제품입니다. 서버를 먼저 제공하고, GPU 가속은 2027년 전후, FPGA 가속은 2028년 전후 경로로 확장합니다.</p><div class="solution-detail-grid"><article><strong>고객이 사는 것</strong><span>리스크 엔진, 암호화 분석, 배치 스코어링, 고처리량 기밀 워크로드 통합입니다.</span></article><article><strong>디바이스 프리 약속</strong><span>하드웨어가 달라도 결과 의미를 바꾸지 않고 호환 구현을 실행하는 것입니다.</span></article></div><ul class="solution-bullet-list"><li>서버 SDK는 API 통합과 통제된 프로덕션 롤아웃을 지원합니다.</li><li>GPU 경로는 벡터화된 암호화 워크로드와 throughput-first 실행을 겨냥합니다.</li><li>FPGA 경로는 배포 통제, 지연시간, 전력 효율을 겨냥합니다.</li></ul>',
        sub: '서버 우선 · GPU ~2027 · FPGA ~2028',
        visual: 'sdk',
        image: './asset/generated/tech-ssfhe-photo-v2.jpg',
        alt: 'FHE16 SDK hardware acceleration visual'
      },
      mpc: {
        title: 'C. KeyMesh MPC 제어 레이어',
        body: '<p>KeyMesh는 FHE16-based MPC로 키와 결과 공개를 단일 운영자가 아니라 여러 참여자가 함께 통제하게 합니다.</p><div class="solution-detail-grid"><article><strong>무엇을 여는가</strong><span>임계값 복호화, 규제형 공개, 기관 간 감사, 키 로테이션을 엽니다.</span></article><article><strong>FHE16이 필요한 이유</strong><span>여러 참여자가 다른 디바이스에서 share를 계산하거나 검증해도 정수 기반 결정론 실행으로 플랫폼 드리프트를 줄입니다.</span></article></div><ul class="solution-bullet-list"><li>정책 기반 키 보관과 threshold result release를 지원합니다.</li><li>B2B 신원, FDS, 보험, 블록체인 기밀 상태 워크플로에 맞습니다.</li><li>호환 가능한 회로 의미론으로 참여자 조율 비용을 낮춥니다.</li></ul>',
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

