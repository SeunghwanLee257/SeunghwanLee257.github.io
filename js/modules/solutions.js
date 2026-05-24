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
      consumer: {
        title: 'B2C Demand Forecasting & Allocation',
        body: 'Convert private willingness-to-pay and launch demand into <strong>pricing, allocation, and restock decisions</strong>. Product name undisclosed. Launching in 2026.',
        sub: '2026 Coming Soon',
        visual: 'consumer'
      },
      enterprise: {
        title: 'B2B PET Risk Intelligence',
        body: 'Support insurance claim cross-check, FDS, identity mismatch, and anomalous transaction workflows <strong>without exposing raw business data</strong>.',
        sub: 'PET-based identity, fraud, and transaction risk analysis',
        visual: 'enterprise'
      },
      blockchain: {
        title: 'Blockchain Confidential Infrastructure',
        body: 'Package confidential state, encrypted execution, and threshold disclosure into developer-facing blockchain infrastructure while preserving <strong>public verifiability</strong>.',
        sub: 'Confidential modules for verifiable blockchain networks',
        visual: 'blockchain'
      }
    },
    ko: {
      consumer: {
        title: 'B2C 수요 예측 및 물량 배분',
        body: '비공개 지불 의향과 출시 수요를 <strong>가격, 물량 배분, 재입고 의사결정</strong>으로 전환합니다. 제품명은 비공개입니다.',
        sub: '2026 Coming Soon',
        visual: 'consumer'
      },
      enterprise: {
        title: 'B2B PET 리스크 인텔리전스',
        body: '원본 데이터를 노출하지 않고 보험 청구 교차검증, FDS, 신원 불일치, 이상 거래 선별 워크플로를 지원합니다.',
        sub: '신원, 사기, 거래 리스크를 위한 PET 기반 분석',
        visual: 'enterprise'
      },
      blockchain: {
        title: '블록체인 기밀 연산 인프라',
        body: '기밀 상태, 암호화 실행, 임계값 공개를 개발자용 블록체인 인프라로 패키징하면서 공개 검증성을 유지합니다.',
        sub: '검증 가능한 블록체인 네트워크를 위한 기밀 모듈',
        visual: 'blockchain'
      }
    }
  };

  const langData = translations[lang] || translations.en;
  return langData[key] || langData.consumer;
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

  setSolutionContent('consumer');
}

