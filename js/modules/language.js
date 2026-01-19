/**
 * Language Toggle Module
 * Handles i18n language switching
 */

import { setupButtonHandlers } from '../utils/event-handlers.js';
import { $$, toggleClass, setAttr } from '../utils/dom.js';
import { safeExecute } from '../utils/error-handler.js';
import { showToast } from '../utils/toast.js';

const translations = {
  en: {
    'nav.vision': 'Vision',
    'nav.solutions': 'Solutions',
    'nav.tech': 'Technology',
    'nav.team': 'Team',
    'hero.headline': 'Confidential Coprocessor for Fair and Verifiable RWA Markets<br>FHE16 + MPC + Threshold Cryptography — Privacy that scales with performance.',
    'vision.title': 'Confidential and Verifiable Computation',
    'vision.subtitle': 'This layer uses FHE, MPC, and Threshold Cryptography to perform verifiable<br>computations on the blockchain while keeping sensitive data confidential.',
    'solution.coprocessor.title': 'Deterministic Confidential Coprocessor',
    'solution.coprocessor.body': 'Normal transactions stay on-chain, while sensitive data/compute run in a confidential FHE coprocessor—keeping state public.',
    'solution.coprocessor.sub': 'Encrypted data stays hidden',
    'solution.solana.title': 'Confidential Coprocessor for Solana',
    'solution.solana.body': 'Keep sensitive programs off-chain while preserving Solana\'s throughput. Deterministic FHE execution guarantees verifiable state updates.',
    'solution.solana.sub': 'Layered security for high-throughput chains',
    'solution.defi.title': 'Fair DeFi Pipelines',
    'solution.defi.body': 'Encrypt bids, strategies, and liquidity routes so MEV bots cannot front-run while traders keep full custody of their assets.',
    'solution.defi.sub': 'Protect every trade, sustain fair markets',
    'solution.voting.title': 'Confidential Governance Voting',
    'solution.voting.body': 'Collect votes privately, publish tallies publicly. Threshold decryption reveals aggregate outcomes without exposing individual choices.',
    'solution.voting.sub': 'Selective transparency for collective decisions',
    'tech.keyFeatures': 'Key Features',
    'tech.fhe16.title': 'FHE16',
    'tech.fhe16.subtitle': 'A 16-bit integer computation–centric deterministic FHE structure that eliminates floating-point operations, ensuring identical results regardless of the execution environment',
    'tech.fhe16.feature1': '<mark>Elimination of floating-point operations</mark>, ensuring identical results regardless of execution environments',
    'tech.fhe16.feature2': 'Elimination of floating-point environment-specific error issues',
    'tech.fhe16.feature3': '<mark>Ultra-fast 2.89 ms bootstrapping</mark> through GINX gate optimization (suitable for real-time and low-latency applications)',
    'tech.mpc.title': 'FHE16-based MPC (SSFHE)',
    'tech.mpc.subtitle': 'An efficient MPC that combines FHE16 and CRT-SPDZ, utilizing composite numbers of 16-bit primes as modulus values and effective sampling.',
    'tech.mpc.feature1': '<mark>O(1) complexity</mark> for each of communication, computation, rounds and input size',
    'tech.mpc.feature2': 'O(n κ d²) complexity for generation of <mark>evaluation key (ev)</mark>',
    'tech.mpc.feature3': '<mark>CRT-SPDZ–based</mark> secure random number and distribution sampling (including Discrete Gaussian)',
    'tech.mpc.feature4': 'Circuit Privacy with <mark>active security in a dishonest majority</mark> setting',
    'property.feature1': 'Each private state is deterministically encrypted under FHE16 and recorded on-chain.',
    'property.feature2': 'Any state change can be verified by all network participants.',
    'property.feature3': 'State disclosure is propagated via a Threshold Decryption protocol.',
    'usecases.title': 'Use case',
    'usecase.1.title': 'Protecting DeFi transaction data & preventing MEV',
    'usecase.1.desc': 'Keep your crypto trades private so others can\'t peek at your orders. Block unfair bot tactics that jump ahead to profit from your trade (often called MEV).',
    'usecase.2.title': 'On-chain voting (selective anonymity + public verifiability)',
    'usecase.2.desc': 'Vote on the blockchain while your identity and choice stay private. Anyone can still verify the overall results are real.',
    'usecase.3.title': 'Data marketplaces (perform computations without revealing raw data)',
    'usecase.3.desc': 'Buy and sell insights without handing over your raw data. The marketplace runs computations on protected data, so the originals stay private.',
    'usecase.4.title': 'Privacy-preserving messaging/SNS',
    'usecase.4.desc': 'Chat and share on social without giving up your privacy. Your content stays encrypted, and you decide who sees what.',
    'advisors.title': '<strong>waLLLnut</strong> collaborates with distinguished professors from<br>leading universities in Korea for technical advisory and joint research.',
    'advisor.kimjl.title': 'Professor of Sogang University',
    'advisor.kimys.title': 'Professor of DGIST',
    'advisor.leejy.title': 'Professor of KAIST',
    'advisor.leeyw.title': 'Professor of Inha University',
    'advisor.nojs.title': 'Emeritus Professor of Seoul National University'
  },
  ko: {
    'nav.vision': '비전',
    'nav.solutions': '솔루션',
    'nav.tech': '기술',
    'nav.team': '팀',
    'hero.headline': '공정하고 신뢰할 수 있는 실물자산(RWA) 시장을 위한<br>비공개 연산 플랫폼 FHE16, MPC, 임계값 암호화를 결합해<br>성능 저하 없이 확장 가능한 프라이버시를 제공합니다.',
    'vision.title': '기밀 및 검증 가능한 컴퓨테이션',
    'vision.subtitle': '이 계층은 동형 암호(FHE), 다자간 계산(MPC), 그리고 **임계값 암호(Threshold Cryptography)**를 활용하여 민감한 데이터를 기밀로 유지하는 동시에 블록체인 상에서 검증 가능한 컴퓨테이션을 수행합니다.',
    'solution.coprocessor.title': 'Deterministic Confidential Coprocessor',
    'solution.coprocessor.body': '일반 거래는 온체인에 그대로 남겨두고,<br>민감한 데이터·연산은 기밀 FHE 보조 프로세서에서 실행해 상태는 공개로 유지합니다.',
    'solution.coprocessor.sub': '암호화된 데이터는 숨겨진 상태를 유지합니다',
    'solution.solana.title': 'Confidential Coprocessor for Solana',
    'solution.solana.body': 'Solana에서 민감한 상태와 코드에 FHE를 적용하여<br>외부 관찰자로부터 숨겨진 비공개 실행을 가능하게 합니다.',
    'solution.solana.sub': '암호화된 데이터는 숨겨진 상태를 유지합니다',
    'solution.defi.title': 'Fair DeFi',
    'solution.defi.body': 'MEV 추출을 일으키는 트레이딩 봇을 차단하여<br>자산 성장과 수익을 향상합니다',
    'solution.defi.sub': '봇을 차단해 자산을 보호하고 수익을 높이세요',
    'solution.voting.title': 'Confidential Voting',
    'solution.voting.body': '개인 선택·신원을 공개하지 않고<br>인구통계 기반 통계만 제공합니다.',
    'solution.voting.sub': '안전하고 프라이버시를 지키는 투표',
    'tech.keyFeatures': '핵심 특징',
    'tech.fhe16.title': 'FHE16',
    'tech.fhe16.subtitle': '16비트 정수 연산 중심의 결정론적 FHE 구조로 부동소수 연산을 제거하여, 실행 환경에 상관없이 동일한 결과를 보장합니다',
    'tech.fhe16.feature1': '<mark>부동소수점 연산 제거</mark>, 실행 환경과 무관하게 동일한 결과 보장',
    'tech.fhe16.feature2': 'Elimination of floating-point environment-specific error issues',
    'tech.fhe16.feature3': '<mark>2.89ms 초고속 부트스트래핑</mark> — GINX 게이트 최적화를 통해 (실시간·저지연 애플리케이션 적합)',
    'tech.mpc.title': 'FHE16 기반 MPC (SSFHE)',
    'tech.mpc.subtitle': 'FHE16과 CRT-SPDZ를 결합한 효율적인 MPC로, 16비트 소수의 합성수를 모듈러로 활용하고 효율적인 샘플링을 지원합니다.',
    'tech.mpc.feature1': '<mark>O(1) 복잡도</mark> — 통신·연산·라운드·입력 크기 각각',
    'tech.mpc.feature2': 'O(n κ d²) 복잡도 — <mark>평가 키(ev) 생성</mark>',
    'tech.mpc.feature3': '<mark>CRT-SPDZ 기반</mark> 안전한 난수 및 분포 샘플링(이산 가우시안 포함)',
    'tech.mpc.feature4': '서킷 프라이버시 — <mark>불신 다수 환경의 능동 보안</mark> setting',
    'property.feature1': '각 프라이빗 상태는 FHE16으로 결정론적으로 암호화되어 온체인에 기록',
    'property.feature2': '모든 네트워크 참여자가 상태 변경을 검증 가능',
    'property.feature3': '임계값 복호화 프로토콜로 상태 공개가 네트워크에 전파',
    'usecases.title': 'Use case',
    'usecase.1.title': 'DeFi 거래 데이터 보호 및 MEV 방지',
    'usecase.1.desc': '주문이 노출되지 않도록 거래를 비공개로 유지합니다. 선점 이익을 노리는(소위 MEV) 부정 봇 전술을 차단합니다.',
    'usecase.2.title': '온체인 투표(선택적 익명성 + 공개 검증)',
    'usecase.2.desc': '신원과 선택은 비공개로 지키면서 투표합니다. 동시에 누구나 결과의 진위를 검증할 수 있습니다.',
    'usecase.3.title': '데이터 마켓플레이스(원본 공개 없는 연산)',
    'usecase.3.desc': '원본 데이터를 넘기지 않고 인사이트만 사고 팝니다. 보호된 데이터 위에서 연산이 수행되어 원본은 안전합니다.',
    'usecase.4.title': '프라이버시 보존 메신저/SNS',
    'usecase.4.desc': '프라이버시를 포기하지 않고 소통하세요. 콘텐츠는 암호화되며, 공개 범위는 사용자가 결정합니다.',
    'advisors.title': '<strong>waLLLnut</strong>는 한국 주요 대학의 저명한 교수진과 함께<br>기술 자문 및 공동 연구를 진행합니다.',
    'advisor.kimjl.title': '서강대학교 교수',
    'advisor.kimys.title': 'DGIST 교수',
    'advisor.leejy.title': 'KAIST 교수',
    'advisor.leeyw.title': '인하대학교 교수',
    'advisor.nojs.title': '서울대학교 명예교수'
  }
};

function applyLanguage(lang) {
  return safeExecute(() => {
    setAttr(document.documentElement, 'lang', lang);
    const i18nElements = $$('[data-i18n]');
    i18nElements.forEach(el => {
      // Team 섹션(#sec06)은 언어 변환 제외
      if (el.closest('#sec06')) return;
      // 네비게이션의 team 링크도 제외 (team 섹션 관련)
      const key = el.getAttribute('data-i18n');
      if (key === 'nav.team') return;
      // 기타 제외 요소들
      if (el.querySelector('.material-icons') || el.closest('.hero-nav') || el.closest('.slider-btn')) return;
      
      if (!key) return;
      const val = translations[lang]?.[key] || translations['en']?.[key];
      if (val !== undefined && val !== null) {
        // Use innerHTML to support HTML tags like <br>
        el.innerHTML = val;
      }
    });
    
    const allBtns = $$('.lang-toggle-btn');
    allBtns.forEach(b => {
      const isActive = b.getAttribute('data-lang') === lang;
      toggleClass(b, 'is-active', isActive);
      setAttr(b, 'aria-pressed', isActive);
    });
    
    try {
      localStorage.setItem('lang', lang);
    } catch(e) {
      // Failed to save language preference - show user feedback
      showToast('Language preference could not be saved. Your selection will reset on page reload.', 'info', 4000);
    }
    
    // Dispatch event for other modules to update
    document.dispatchEvent(new CustomEvent('language:changed', { detail: { lang } }));
  }, 'Language: applyLanguage');
}

export function initLanguage() {
  const langToggleBtns = $$('.lang-toggle-btn');
  langToggleBtns.forEach(btn => {
    const handleLangChange = () => {
      const lang = btn.getAttribute('data-lang');
      if (lang) {
        applyLanguage(lang);
      }
    };
    setupButtonHandlers(btn, handleLangChange, true);
  });

  const savedLang = (() => {
    try {
      return localStorage.getItem('lang');
    } catch(e) {
      return null;
    }
  })();
  const initialLang = savedLang || 'en';
  
  const allLangBtns = $$('.lang-toggle-btn');
  allLangBtns.forEach(btn => {
    const btnLang = btn.getAttribute('data-lang');
    const isActive = btnLang === initialLang;
    toggleClass(btn, 'is-active', isActive);
    setAttr(btn, 'aria-pressed', isActive);
  });
  
  applyLanguage(initialLang);
}

