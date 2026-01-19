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
      coprocessor: {
        title: 'Deterministic Confidential Coprocessor',
        body: 'Normal transactions stay on-chain, while sensitive data/compute run in a confidential FHE coprocessor—keeping state public.',
        sub: 'Encrypted data stays hidden',
        bg: "url('./asset/bg/sec03slide01.png')"
      },
      solana: {
        title: 'Confidential Coprocessor for Solana',
        body: 'Keep sensitive programs off-chain while preserving Solana\'s throughput. Deterministic FHE execution guarantees verifiable state updates.',
        sub: 'Layered security for high-throughput chains',
        bg: "url('./asset/bg/sec03slide02.png')"
      },
      defi: {
        title: 'Fair DeFi Pipelines',
        body: 'Encrypt bids, strategies, and liquidity routes so MEV bots cannot front-run while traders keep full custody of their assets.',
        sub: 'Protect every trade, sustain fair markets',
        bg: "url('./asset/bg/sec03slide03.png')"
      },
      voting: {
        title: 'Confidential Governance Voting',
        body: 'Collect votes privately, publish tallies publicly. Threshold decryption reveals aggregate outcomes without exposing individual choices.',
        sub: 'Selective transparency for collective decisions',
        bg: "url('./asset/bg/sec03slide04.png')"
      }
    },
    ko: {
      coprocessor: {
        title: 'Deterministic Confidential Coprocessor',
        body: '일반 거래는 온체인에 그대로 남겨두고,<br>민감한 데이터·연산은 기밀 FHE 보조 프로세서에서 실행해 상태는 공개로 유지합니다.',
        sub: '암호화된 데이터는 숨겨진 상태를 유지합니다',
        bg: "url('./asset/bg/sec03slide01.png')"
      },
      solana: {
        title: 'Confidential Coprocessor for Solana',
        body: 'Solana에서 민감한 상태와 코드에 FHE를 적용하여<br>외부 관찰자로부터 숨겨진 비공개 실행을 가능하게 합니다.',
        sub: '암호화된 데이터는 숨겨진 상태를 유지합니다',
        bg: "url('./asset/bg/sec03slide02.png')"
      },
      defi: {
        title: 'Fair DeFi',
        body: 'MEV 추출을 일으키는 트레이딩 봇을 차단하여<br>자산 성장과 수익을 향상합니다',
        sub: '봇을 차단해 자산을 보호하고 수익을 높이세요',
        bg: "url('./asset/bg/sec03slide03.png')"
      },
      voting: {
        title: 'Confidential Voting',
        body: '개인 선택·신원을 공개하지 않고<br>인구통계 기반 통계만 제공합니다.',
        sub: '안전하고 프라이버시를 지키는 투표',
        bg: "url('./asset/bg/sec03slide04.png')"
      }
    }
  };
  
  const langData = translations[lang] || translations.en;
  return langData[key] || langData.coprocessor;
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
        solutionVisual.style.backgroundImage = payload.bg;
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

  setSolutionContent('coprocessor');
}

