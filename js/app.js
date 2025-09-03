/* =========================================================
   WaLLLnut Landing - App Script (UI + i18n unified, EN/KR)
   ========================================================= */
(function () {
  'use strict';

  /* -------- Helpers -------- */
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (n, a, b) { return Math.max(a, Math.min(b, n)); };
  var stripTags = function (h) { return String(h).replace(/<[^>]*>/g, ''); };
  var norm = function (s) { return String(s).replace(/\s+/g, ' ').trim(); };

  /* =========================================================
     i18n dictionary (EN + KO) — keys used by autowire
     ========================================================= */
  var I18N = {
    en: {
      'lang.label':'Language',
      'nav.tech':'Technology','nav.service':'Service','nav.goal':'Goal','nav.exp':'Experience','nav.team':'Team','nav.advisors':'Advisors',
      'label.days':'Days','label.hours':'Hours','label.seconds':'Seconds',
      'slogan':'waLLLnut’s vision is to ensure both <strong>“transparency”</strong> and <strong>“confidentiality”</strong> of data in the next-generation internet infrastructure.',
      'sec.tech':'01. Our Technology','sec.service':'02. Our Service','sec.goal':'03. Our Goal','sec.exp':'04. Our Experience','sec.team':'05. Team Member',

      // Section01 Top Banner
      '.s-t-01':'How much time is left on your data clock?',
      '.s-t-02':'Most data on the internet is effectively irreversible',

      // Tech A
      'pA.title':'GHE16',
      'pA.subtitle':'A 16-bit integer computation–centric deterministic FHE structure that eliminates floating-point operations, ensuring identical results regardless of the execution environment',
      'common.keyFeatures':'Key Features',

      /* ✅ 강조+꼬리 분리 키 */
      'highlight.float':'Elimination of floating-point',
      'pA.kf1.tail':' operations, ensuring identical results regardless of the execution environments',
      'pA.kf2.tail':' environment-specific error issues',

      'pA.kf3':'Ultra-fast 2.89 ms bootstrapping through GINX gate optimization (suitable for real-time and low-latency applications)',
      'common.reference':'Reference: ePrint 2024/1916',

      // Tech B
      'pB.title':'FHE16-based MPC (SSFHE)',
      'pB.subtitle':'A new FHE (FHE16) is based on 16-bit integer arithmetic, utilizing composite numbers of 16-bit primes as its modulus values.',
      'pB.kf1':'O(1) complexity for each of communication, computation,<br> rounds and input size',
      'pB.kf2':'O(n κ d²) complexity for generation of evaluation key (ev)',
      'pB.kf3':'CRT-SPDZ–based secure random number and distribution sampling (including Discrete Gaussian)',
      'pB.kf4':'Circuit Privacy with active security in a dishonest majority setting',

      // Service slides meta
      'svc.meta.keyword':'Keyword',
      'svc.1.desc':'Normal transactions stay on-chain, while sensitive data/compute run <strong>in a confidential FHE layer—keeping state public.</strong>',
      'svc.1.meta.title2':'Hide',
      'svc.1.meta.ref':'Encrypted data stays hidden',
      'svc.2.desc':'On Solana, we apply <strong>FHE to sensitive state and code,</strong> enabling private execution <strong>hidden from external observers.</strong>',
      'svc.2.meta.title2':'Solana',
      'svc.2.meta.ref':'Encrypted data stays hidden',
      'svc.3.desc':'Block trading bots from doing <br>MEV extraction in order to <strong>boost asset growth and returns</strong>',
      'svc.3.meta.title2':'Fair asset growth',
      'svc.3.meta.ref':'Block trading bots to protect<br>your assets and boost returns',
      'svc.4.desc':'Demographic vote stats—<br><strong>no disclosure of individual choices or identities.</strong>',
      'svc.4.meta.title2':'Privately',
      'svc.4.meta.ref':'Safe and private voting',

      // Goal
      'goal.caption':'waLLLnut’s Confidential Layer locks data with FHE, MPC, and threshold cryptography while running verifiable on-chain compute. It opens only what’s needed, with user consent—reducing MEV bots’ edge and keeping markets fair.',
      'goal.q1':'What does waLLLnut actually do—and what are we confident about? 🫥💪',
      'goal.a1':'We\'re a research-driven company building on quantum-resistant FHE (Fully Homomorphic Encryption) and MPC (Multi-Party Computation) to make data security and privacy sustainable. Moreover, multi-users’ data can be securely and privately processed — decrypting only when needed and extracting statistical insights if necessary.📊📈',
      'goal.q2':'Hashes for waLLLnut\'s upcoming pre-release research outcomes and keywords slated for public disclosure. 📊🔬🏗️',
      'goal.hash.disclose':'<strong>(To be disclosed in Oct. 2025)</strong>',
      'goal.q3':'So, what\'s in waLLLnut\'s product lineup? 🚀',
      'goal.a3.1':'Flagship Product — Deterministic Confidential Layer 🏁',
      'goal.a3.2':'Executes blockchain state data on FHE16, enabling public verification. 🔍',
      'goal.a3.3':'Unlike traditional ZK systems limited to fixed states,FHE16-based technology supports dynamic state verification. 🔄✅',

      // Experience / use cases
      'usecases.title':'Use Cases',
      'use1.title':'Protecting DeFi transaction data and preventing MEV',
      'use1.desc':'Keep your crypto trades private so others can\'t peek at your orders.<br>Block unfair bot tactics that jump ahead to profit from your trade (often called MEV).',
      'use2.title':'On-chain voting (selective anonymity + public verifiability)',
      'use2.desc':'Vote on the blockchain while your identity and choice stay private.<br>Anyone can still verify the overall results are real.',
      'use3.title':'Data marketplaces (perform computations without revealing raw data)',
      'use3.desc':'Buy and sell insights without handing over your raw data.<br>The marketplace runs computations on protected data, so the originals stay private.',
      'use4.title':'Privacy-preserving messaging/SNS',
      'use4.desc':'Chat and share on social without giving up your privacy.<br>Your content stays encrypted, and you decide who sees what.',
      'prop.f1':'Each private state is deterministically encrypted under FHE16 and recorded on-chain',
      'prop.f2':'Any state change can be verified by all network participants',
      'prop.f3':'State disclosure is propagated across the network via a Threshold Decryption protocol',

      // Team Member
      'member1.role': 'Seunghwan Lee (CEO)',
      'member1.description': 'Leads FHE16 and MPC R&D <br> Hanyang University',

      'member2.role': 'Dohyuk Kim (CTO)',
      'member2.description': 'Leads FHE16 and MPC Implementation',

      'member3.role': 'Dong-Joon Shin (CSO)',
      'member3.description': 'Establishes Academic-Industry Strategies',

      'member4.role': 'Yunsik Ham',
      'member4.description': 'Blockchain+Cryptography Developer',

      'member5.role': 'Youngjun Kim',
      'member5.description': 'Cryptography & Server Developer',

      'member6.role': 'KiIn Shin',
      'member6.description': 'Marketing Manager and Graphic Designer',

      'member7.role': 'JiIn Shin',
      'member7.description': 'PR Manager and UIUX Designer',


      'prof.1.name':  'Jon-Lark Kim:',
      'prof.1.affil': 'Professor of Sogang University',

      'prof.2.name':  'Young-Sik Kim:',
      'prof.2.affil': 'Professor of DGIST',

      'prof.3.name':  'Jooyoung Lee:',
      'prof.3.affil': 'Professor of KAIST',

      'prof.4.name':  'Yongwoo Lee:',
      'prof.4.affil': 'Professor of Inha University',

      'prof.5.name':  'Jong-Seon No:',
      'prof.5.affil': 'Emeritus Professor of Seoul National University',


      // Advisors / footer
      'advisors.title':'waLLLnut collaborates with distinguished professors from<br>leading universities in Korea for technical advisory and joint research.',
      'footer.copy':'© 2025 waLLLnut · All rights reserved.',

    },
    ko: {
      'lang.label':'언어',
      'nav.tech':'기술','nav.service':'서비스','nav.goal':'목표','nav.exp':'경험','nav.team':'팀','nav.advisors':'자문',
      'label.days':'일','label.hours':'시간','label.seconds':'초',
      'slogan':'waLLLnut의 비전은 차세대 인터넷 인프라에서 데이터의 <strong>“투명성”</strong>과 <strong>“기밀성”</strong>을 모두 보장하는 것입니다.',
      'sec.tech':'01. Our Technology','sec.service':'02. Our Service','sec.goal':'03. Our Goal','sec.exp':'04. Our Experience','sec.team':'05. Team Member',

      // Section01 Top Banner
      '.s-t-01':'여러분의 데이터는 인터넷에 얼마나 머무를까요?',
      '.s-t-02':'인터넷 안에 있는 대다수의 데이터는 삭제가 불가능한 데이터 입니다.',

      // Tech A
      'pA.title':'Ultra-Low-Latency',
      'pA.subtitle':'16비트 정수 연산 중심의 결정론적 FHE 구조로 부동소수 연산을 제거하여, 실행 환경에 상관없이 동일한 결과를 보장합니다',
      'common.keyFeatures':'핵심 특징',

      /* ✅ 강조+꼬리 분리 키 */
      'highlight.float':'부동소수점 연산 제거',
      'pA.kf1.tail':'로 실행 환경과 무관하게 동일한 결과 보장',
      'pA.kf2.tail':' 연산 환경별 오차 제거',

      'pA.kf3':'GINX 게이트 최적화를 통한 2.89ms 초고속 부트스트래핑 (실시간·저지연 애플리케이션 적합)',
      'common.reference':'참고: ePrint 2024/1916',

      // Tech B
      'pB.title':'FHE16 기반 MPC (SSFHE)',
      'pB.subtitle':'새로운 FHE(FHE16)는 16비트 정수 산술을 기반으로 하며, 모듈러로 16비트 소수의 합성수를 활용합니다.',
      'pB.kf1':'통신·연산·라운드·입력 크기 각각에 대해 O(1) 복잡도',
      'pB.kf2':'평가 키(ev) 생성의 복잡도: O(n κ d²)',
      'pB.kf3':'CRT-SPDZ 기반 안전한 난수·분포 샘플링(이산 가우시안 포함)',
      'pB.kf4':'불신 다수 환경에서 능동 보안의 서킷 프라이버시',

      // Service slides meta
      'svc.meta.keyword':'키워드',
      'svc.1.desc':'일반 트랜잭션은 온체인에 유지하고, <br>민감 데이터/연산은 <strong>기밀 FHE 레이어에서 수행—상태는 공개로 유지.</strong>',
      'svc.1.meta.title2':'숨김',
      'svc.1.meta.ref':'암호화된 데이터는 <br>숨겨진 상태를 유지합니다',
      'svc.2.desc':'Solana에서 <strong>민감한 상태와 코드에 FHE를 적용</strong>하여<br>외부 관찰자로부터 <strong>숨겨진 비공개 실행</strong>을 가능하게 합니다.',
      'svc.2.meta.title2':'Solana',
      'svc.2.meta.ref':'암호화된 데이터는 <br>숨겨진 상태를 유지합니다',
      'svc.3.desc':'MEV 추출을 일으키는 트레이딩 봇을 차단하여 <br><strong>자산 성장과 수익을 향상</strong>합니다',
      'svc.3.meta.title2':'공정한 자산 성장',
      'svc.3.meta.ref':'봇을 차단해 자산을 보호하고<br>수익을 높이세요',
      'svc.4.desc':'개인 선택·신원을 공개하지 않고<br>인구통계 기반 통계만 제공합니다.',
      'svc.4.meta.title2':'비공개로',
      'svc.4.meta.ref':'안전하고 프라이버시를 <br>지키는 투표',

      // Goal
      'goal.caption':'월넛의 Confidential Layer는 FHE·MPC·임계값 암호로 데이터를 잠근 채, <br>검증 가능한 온체인 연산을 실행합니다. 필요한 순간에 필요한 만큼만 <br>사용자가 열고, MEV 봇의 이점은 줄어 시장은 더 공정해집니다.',
      'goal.q1':'waLLLnut은 무엇을 하고, 어디에 자신이 있을까요? 🫥💪',
      'goal.a1':'우리는 양자내성 FHE와 MPC를 바탕으로 보안·프라이버시의 지속가능성을 연구·구현합니다. 다수 사용자의 데이터도 필요한 경우에만 복호화하며, 필요 시 통계적 인사이트만 안전하게 추출할 수 있습니다.📊📈',
      'goal.q2':'공개 예정인 사전 연구성과 및 키워드의 해시 목록입니다. 📊🔬🏗️',
      'goal.hash.disclose':'(2025년 10월 공개 예정)',
      'goal.q3':'waLLLnut 제품 라인업은 무엇인가요? 🚀',
      'goal.a3.1':'플래그십 — 결정론적 기밀 레이어 🏁',
      'goal.a3.2':'블록체인 상태데이터를 FHE16에서 실행하고 공개 검증을 지원합니다. 🔍',
      'goal.a3.3':'고정 상태에 한정되는 전통적 ZK와 달리, FHE16은 동적 상태 검증을 지원합니다. 🔄✅',

      // Experience / use cases
      'usecases.title':'활용 사례',
      'use1.title':'DeFi 거래 데이터 보호 및 MEV 방지',
      'use1.desc':'주문이 노출되지 않도록 거래를 비공개로 유지합니다.<br>선점 이익을 노리는(소위 MEV) 부정 봇 전술을 차단합니다.',
      'use2.title':'온체인 투표(선택적 익명성 + 공개 검증)',
      'use2.desc':'신원과 선택은 비공개로 지키면서 투표합니다.<br>동시에 누구나 결과의 진위를 검증할 수 있습니다.',
      'use3.title':'데이터 마켓플레이스(원본 공개 없는 연산)',
      'use3.desc':'원본 데이터를 넘기지 않고 인사이트만 사고팝니다.<br>보호된 데이터 위에서 연산이 수행되어 원본은 안전합니다.',
      'use4.title':'프라이버시 보존 메신저/SNS',
      'use4.desc':'프라이버시를 포기하지 않고 소통하세요.<br>콘텐츠는 암호화되며, 공개 범위는 사용자가 결정합니다.',
      'prop.f1':'각 프라이빗 상태는 FHE16으로 결정론적으로 암호화되어 온체인에 기록',
      'prop.f2':'모든 네트워크 참여자가 상태 변경을 검증 가능',
      'prop.f3':'임계값 복호화 프로토콜로 상태 공개가 네트워크에 전파',

      // Team Member
      'member1.role': '이승환(CEO)',
      'member1.description': '한양대 전자공학 박사, <br>FHE16 연구·개발 총괄',

      'member2.role': '김도혁(CTO)',
      'member2.description': '한양대 전자공학 박사과정, <br>FHE 상용화·납품 개발 경험',

      'member3.role': '신동준(CSO)',
      'member3.description': '한양대 전자공학 교수, <br>학계·산업 네트워킹 보유',

      'member4.role': '함윤식',
      'member4.description': '블록체인 메인 개발자, <br>ZK + Blockchain 프로젝트 리드 경험',

      'member5.role': '김영준',
      'member5.description': '암호·서버 개발자, <br>LWE 및 네트워크 구현 경험',

      'member6.role': '신기인',
      'member6.description': '마케팅 매니저 · 그래픽 디자이너',

      'member7.role': '신지인',
      'member7.description': 'PR 매니저 · UI/UX 디자이너',

      'prof.1.name':  '김종락 교수님',
      'prof.1.affil': '서강대학교 교수',

      'prof.2.name':  '김영식 교수님 ',
      'prof.2.affil': 'DGIST 교수',

      'prof.3.name':  '이주영 교수님',
      'prof.3.affil': 'KAIST 교수',

      'prof.4.name':  '이용우 교수님',
      'prof.4.affil': '인하대학교 교수',

      'prof.5.name':  '노종선 교수님',
      'prof.5.affil': '서울대학교 명예교수',


      // Advisors / footer
      'advisors.title':'waLLLnut는 한국 주요 대학의 저명한 교수진과 함께<br>기술 자문 및 공동 연구를 진행합니다.',
      'footer.copy':'© 2025 waLLLnut · All rights reserved.'
    }
  };
  window.I18N = I18N; // 디버깅용 노출

  var LANG_CODES = { en: 'eng', ko: 'kor' };

  // 번역 제외(요청): material-icons 전체, 슬라이더 컨트롤(.svc-cont), 드롭다운 아이콘
  var I18N_EXCLUDE = [
    '.material-icons', '.material-icons *',
    '.svc-cont', '.svc-cont *',
    '.goal-dropdown-icon'
  ];
  var EXCLUDE_SELECTOR = I18N_EXCLUDE.join(',');

  function isExcluded(el) {
    if (!el) return false;
    if (EXCLUDE_SELECTOR && el.closest && el.closest(EXCLUDE_SELECTOR)) return true;
    if (el.hasAttribute('data-no-i18n')) return true;
    return false;
  }

  function applyI18n(lang) {
    var fb = 'en';
    document.documentElement.setAttribute('lang', lang);

    // 제외영역 내부 data-i18n 제거
    if (EXCLUDE_SELECTOR) {
      $$(EXCLUDE_SELECTOR).forEach(function (root) {
        if (root.hasAttribute('data-i18n')) root.removeAttribute('data-i18n');
        $$('[data-i18n]', root).forEach(function (el) { el.removeAttribute('data-i18n'); });
      });
    }

    $$('[data-i18n]').forEach(function (el) {
      if (isExcluded(el)) return;
      var key = el.getAttribute('data-i18n');
      var val = (I18N[lang] && I18N[lang][key]) || (I18N[fb] && I18N[fb][key]) || '';
      if (val) el.innerHTML = val;
    });
  }

  function getSavedLang() { try { return localStorage.getItem('lang'); } catch (e) { return null; } }
  function saveLang(v)     { try { localStorage.setItem('lang', v); } catch (e) {} }

  /* =========================================================
     🔒 범위 고정 바인딩: 부모 p.fron-text는 제외하고,
        .black-f(강조)와 그 뒤 꼬리만 각각 번역
     ========================================================= */
  function bindStrongAndTail(p, strongKey, tailKey) {
    if (!p) return;

    // 부모가 통째로 덮어쓰지 않도록 보호
    if (p.hasAttribute('data-i18n')) p.removeAttribute('data-i18n');
    p.setAttribute('data-no-i18n', '');

    // 강조에 고정 키 부여
    var strong = p.querySelector('.black-f');
    if (strong && !strong.hasAttribute('data-i18n')) {
      strong.setAttribute('data-i18n', strongKey);
    }

    // 강조 뒤의 모든 형제 노드를 꼬리 span으로 래핑 + 키 부여
    if (strong && !p.querySelector('[data-i18n="'+ tailKey +'"]')) {
      var tail = document.createElement('span');
      tail.setAttribute('data-i18n', tailKey);

      var node = strong.nextSibling;
      while (node) {
        var next = node.nextSibling;
        tail.appendChild(node); // 기존 텍스트/노드 이동
        node = next;
      }
      p.appendChild(tail);
    }
  }

  /* ------ auto wiring (selectors) ------ */
  function setKey(el, key) { if (el && !isExcluded(el) && !el.hasAttribute('data-i18n')) el.setAttribute('data-i18n', key); }
  function setKeyBySel(sel, key) { setKey($(sel), key); }
  function setKeyList(sel, keys) {
    var list = $$(sel); keys.forEach(function (k, i) { if (list[i]) setKey(list[i], k); });
  }

  function autowireBySelectors() {
    setKeyList('.nav a', ['nav.tech','nav.service','nav.goal','nav.exp','nav.team','nav.advisors']);

    setKeyBySel('#tech-label','sec.tech');
    setKeyBySel('#service-label','sec.service');
    setKeyBySel('#goal-label','sec.goal');
    setKeyBySel('#exp-label','sec.exp');
    setKeyBySel('#team-label','sec.team');

    setKeyList('.count-wrap .time-label', ['label.days','label.hours','label.seconds']);
    setKeyBySel('#sec02 .strip p', 'slogan');

    // Tech A (❗ pA.kf1 / pA.kf2는 bindStrongAndTail로 처리하므로 여기서 설정하지 않음)
    setKeyBySel('#panel-a .tech-title-lg#tab-a', 'pA.title');
    setKeyBySel('#panel-a .tech-subtitle', 'pA.subtitle');
    setKeyBySel('#panel-a .captionKey', 'common.keyFeatures');
    setKeyBySel('#panel-a .tech-body li:nth-child(3)', 'pA.kf3');
    setKeyBySel('#panel-a .tech-ref a', 'common.reference');

    // Tech B
    setKeyBySel('#panel-b .tech-title-lg#tab-b', 'pB.title');
    setKeyBySel('#panel-b .tech-subtitle', 'pB.subtitle');
    setKeyBySel('#panel-b .captionKey', 'common.keyFeatures');
    setKeyBySel('#panel-b .tech-body li:nth-child(1)', 'pB.kf1');
    setKeyBySel('#panel-b .tech-body li:nth-child(2)', 'pB.kf2');
    setKeyBySel('#panel-b .tech-body li:nth-child(3)', 'pB.kf3');
    setKeyBySel('#panel-b .tech-body li:nth-child(4)', 'pB.kf4');
    setKeyBySel('#panel-b .tech-ref a', 'common.reference');

    // Service slides (titles 번역 제외, desc/meta만)
    function S(n, s) { return '.svc-item:nth-of-type(' + n + ') ' + s; }
    setKeyBySel(S(1,'.svc-desc'), 'svc.1.desc');
    setKeyBySel(S(1,'.svc-c-title'), 'svc.meta.keyword');
    setKeyBySel(S(1,'.svc-c-title2'),'svc.1.meta.title2');
    setKeyBySel(S(1,'.svc-c-ref'),   'svc.1.meta.ref');

    setKeyBySel(S(2,'.svc-desc'), 'svc.2.desc');
    setKeyBySel(S(2,'.svc-c-title'), 'svc.meta.keyword');
    setKeyBySel(S(2,'.svc-c-title2'),'svc.2.meta.title2');
    setKeyBySel(S(2,'.svc-c-ref'),   'svc.2.meta.ref');

    setKeyBySel(S(3,'.svc-desc'), 'svc.3.desc');
    setKeyBySel(S(3,'.svc-c-title'), 'svc.meta.keyword');
    setKeyBySel(S(3,'.svc-c-title2'),'svc.3.meta.title2');
    setKeyBySel(S(3,'.svc-c-ref'),   'svc.3.meta.ref');

    setKeyBySel(S(4,'.svc-desc'), 'svc.4.desc');
    setKeyBySel(S(4,'.svc-c-title'), 'svc.meta.keyword');
    setKeyBySel(S(4,'.svc-c-title2'),'svc.4.meta.title2');
    setKeyBySel(S(4,'.svc-c-ref'),   'svc.4.meta.ref');

    // Goal
    setKeyBySel('.goal-caption .p', 'goal.caption');
    setKeyBySel('.goal-dropdown-card:nth-of-type(1) .goal-dropdown-question', 'goal.q1');
    setKeyBySel('.goal-dropdown-card:nth-of-type(1) .goal-dropdown-content .goal-dropdown-text', 'goal.a1');

    setKeyBySel('.goal-dropdown-card:nth-of-type(2) .goal-dropdown-question', 'goal.q2');
    $$('.goal-dropdown-card:nth-of-type(2) .item-drop p:first-child').forEach(function (p) {
      setKey(p, 'goal.hash.disclose');
    });

    setKeyBySel('.goal-dropdown-card:nth-of-type(3) .goal-dropdown-question', 'goal.q3');
    var ps3 = $$('.goal-dropdown-card:nth-of-type(3) .goal-dropdown-content .goal-dropdown-text');
    if (ps3[0]) setKey(ps3[0], 'goal.a3.1');
    if (ps3[1]) setKey(ps3[1], 'goal.a3.2');
    if (ps3[2]) setKey(ps3[2], 'goal.a3.3');

    // Use cases
    setKeyBySel('.use-cases-title', 'usecases.title');
    var u = $$('.use-cases-section .use-case');
    if (u[0]) { setKey(u[0].querySelector('.use-case-title'), 'use1.title'); setKey(u[0].querySelector('.use-case-desc'), 'use1.desc'); }
    if (u[1]) { setKey(u[1].querySelector('.use-case-title'), 'use2.title'); setKey(u[1].querySelector('.use-case-desc'), 'use2.desc'); }
    if (u[2]) { setKey(u[2].querySelector('.use-case-title'), 'use3.title'); setKey(u[2].querySelector('.use-case-desc'), 'use3.desc'); }
    if (u[3]) { setKey(u[3].querySelector('.use-case-title'), 'use4.title'); setKey(u[3].querySelector('.use-case-desc'), 'use4.desc'); }

    // Property features
    setKeyList('.property-features li', ['prop.f1','prop.f2','prop.f3']);

    // Team Member
    setKeyBySel('.s-t-02', '.s-t-02');

    // Team Member cards (순서대로 1~7)
    (function bindTeam(){
      var cards = $$('.team-grid .team-member');
      cards.forEach(function(card, i){
        var n = i + 1;
        var nameEl = card.querySelector('.member-name-role');
        var descEl = card.querySelector('.member-description');
        if (nameEl) setKey(nameEl, 'member'+n+'.role');
        if (descEl) setKey(descEl, 'member'+n+'.description');
      });
    })();

    // Professors List
    (function bindAdvisors(){
      function P(n, s){ return '.professor-list .list-item:nth-of-type(' + n + ') ' + s; }
      // 이름(굵게)과 소속(링크 텍스트)만 번역, 이메일은 건드리지 않음
      setKeyBySel(P(1, '.pro-name strong'),  'prof.1.name');
      setKeyBySel(P(1, '.pro-list-link'),    'prof.1.affil');

      setKeyBySel(P(2, '.pro-name strong'),  'prof.2.name');
      setKeyBySel(P(2, '.pro-list-link'),    'prof.2.affil');

      setKeyBySel(P(3, '.pro-name strong'),  'prof.3.name');
      setKeyBySel(P(3, '.pro-list-link'),    'prof.3.affil');

      setKeyBySel(P(4, '.pro-name strong'),  'prof.4.name');
      setKeyBySel(P(4, '.pro-list-link'),    'prof.4.affil');

      setKeyBySel(P(5, '.pro-name strong'),  'prof.5.name');
      setKeyBySel(P(5, '.pro-list-link'),    'prof.5.affil');
    })();



    // Advisors / Footer
    setKeyBySel('#sec08 .s08-comt-inner .s08-title','advisors.title');
    var footerCopy = $('footer .container');
    if (footerCopy && !footerCopy.hasAttribute('data-i18n')) footerCopy.setAttribute('data-i18n','footer.copy');

    // Dropdown label
    var label = $('#langLabel');
    if (label && !label.hasAttribute('data-i18n')) label.setAttribute('data-i18n', 'lang.label');
  }

  /* ------ text-match wiring (English → key), fron-text는 제외 ------ */
  function autowireByTextMatch() {
    var map = new Map();
    var en = I18N.en || {};
    Object.keys(en).forEach(function (k) { map.set(norm(stripTags(en[k])), k); });

    var nodes = $$('main, header, footer')
      .map(function (root) { return Array.prototype.slice.call(root.querySelectorAll('a,h1,h2,h3,h4,h5,h6,p,button,div,span,li')); })
      .reduce(function (a, b) { return a.concat(b); }, [])
      .filter(function (el) {
        return !el.hasAttribute('data-i18n') &&
               !el.classList.contains('fron-text') &&   // 부모 p 보호
               !isExcluded(el) &&
               !el.hasAttribute('data-no-i18n');
      });

    nodes.forEach(function (el) {
      var key = map.get(norm(el.innerHTML || el.textContent || ''));
      if (key) el.setAttribute('data-i18n', key);
    });
  }

  /* -------- Language dropdown (fixed) -------- */
  function openLangMenu() {
    var btn = $('#langBtn'), menu = $('#langMenu');
    if (!btn || !menu) return;
    btn.setAttribute('aria-expanded', 'true');
    menu.hidden = false;
    menu.style.display = 'block';

    var current = menu.querySelector('[aria-selected="true"]') || menu.querySelector('[role="option"]');
    $$('#langMenu [role="option"]').forEach(function (li) { li.classList.remove('focused'); });
    if (current) current.classList.add('focused');

    if (!document._langDocClick) {
      document._langDocClick = function (e) {
        if (!menu.contains(e.target) && !btn.contains(e.target)) closeLangMenu();
      };
      document.addEventListener('click', document._langDocClick, true);
    }
    if (!document._langKeydown) {
      document._langKeydown = function (e) {
        if ($('#langMenu').hidden) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); moveLangFocus(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); moveLangFocus(-1); }
        else if (e.key === 'Enter') {
          e.preventDefault();
          var focused = $('#langMenu .focused') || $('#langMenu [aria-selected="true"]');
          if (focused) chooseLang(focused);
        } else if (e.key === 'Escape') {
          e.preventDefault(); closeLangMenu(); var b = $('#langBtn'); if (b) b.focus();
        }
      };
      document.addEventListener('keydown', document._langKeydown);
    }
  }
  function closeLangMenu() {
    var btn = $('#langBtn'), menu = $('#langMenu');
    if (!btn || !menu) return;
    btn.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
    menu.style.display = 'none';
  }
  function moveLangFocus(dir) {
    var menu = $('#langMenu'); if (!menu || menu.hidden) return;
    var list = $$('#langMenu [role="option"]'); if (!list.length) return;
    var idx = -1;
    for (var i = 0; i < list.length; i++) if (list[i].classList.contains('focused')) { idx = i; break; }
    if (idx < 0) for (var j = 0; j < list.length; j++) if (list[j].getAttribute('aria-selected') === 'true') { idx = j; break; }
    var next = (idx + dir + list.length) % list.length;
    list.forEach(function (li) { li.classList.remove('focused'); });
    list[next].classList.add('focused');
    list[next].scrollIntoView({ block: 'nearest' });
  }
  function chooseLang(li) {
    if (!li) return;
    setLanguage(li.getAttribute('data-lang'));
    closeLangMenu();
    var b = $('#langBtn'); if (b) b.focus();
  }

  /* -------- Smooth nav scroll -------- */
  function getHeaderOffset() { var header = $('.header'); return header ? (header.getBoundingClientRect().height || 0) : 0; }
  function smoothScrollTo(targetSelector) {
    var el = $(targetSelector); if (!el) return;
    var top = window.scrollY + el.getBoundingClientRect().top - getHeaderOffset() - 16;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }
  function bindNavScroll() {
    $$('.nav a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); smoothScrollTo(a.getAttribute('href')); });
    });
  }

  /* -------- Tech panels -------- */
  function initTechPanels() {
    var panels = $$('.tech-panel');
    if (!panels.length) return;
    function activate(panel) {
      panels.forEach(function (p) {
        var active = p === panel;
        p.classList.toggle('active', active);
        p.classList.toggle('inactive', !active);
        p.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
    }
    panels.forEach(function (p) {
      var head = $('.inactive-head', p);
      if (!head) return;
      head.addEventListener('click', function (ev) { ev.stopPropagation(); activate(p); });
      head.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(p); }
      });
      head.setAttribute('tabindex', '0');
      head.setAttribute('role', 'button');
      head.setAttribute('aria-controls', p.id || '');
    });
  }

/* -------- Service slider (buttons + drag/swipe) -------- */
function initServiceSlider() {
  var track = $('#svc-track');
  var items = $$('#svc-track .svc-item');
  if (!track || !items.length) return;

  var bF = $('#svc-first'), bP = $('#svc-prev'), bN = $('#svc-next'), bL = $('#svc-last');
  var idx = 0;           // 현재 슬라이드
  var dx = 0;            // 드래그 offset(px)
  var dragging = false;
  var startX = 0, startY = 0;

  // 드래그 중 수평만 캡처하도록 힌트
  track.style.touchAction = 'pan-y';

  function applyTransform() {
    // 기본 이동(-idx*100%)에 드래그 px 오프셋을 더해 자연스러운 추적
    track.style.transform = 'translateX(calc(' + (-(idx * 100)) + '% + ' + dx + 'px))';
  }
  function update() {
    dx = 0;
    track.style.transition = 'transform 320ms ease';
    applyTransform();
    items.forEach(function (it, i) { it.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
    if (bF) bF.disabled = (idx === 0);
    if (bP) bP.disabled = (idx === 0);
    if (bL) bL.disabled = (idx === items.length - 1);
    if (bN) bN.disabled = (idx === items.length - 1);
  }
  function go(n) { idx = clamp(n, 0, items.length - 1); update(); }

  // 버튼
  if (bF) bF.addEventListener('click', function (e) { e.stopPropagation(); go(0); });
  if (bP) bP.addEventListener('click', function (e) { e.stopPropagation(); go(idx - 1); });
  if (bN) bN.addEventListener('click', function (e) { e.stopPropagation(); go(idx + 1); });
  if (bL) bL.addEventListener('click', function (e) { e.stopPropagation(); go(items.length - 1); });

  // ====== 드래그/스와이프 ======
  function viewportWidth() {
    var vp = track.parentElement;
    return (vp && vp.clientWidth) || window.innerWidth || 1;
  }
  function dragStart(x, y) {
    dragging = true;
    startX = x; startY = y;
    dx = 0;
    track.style.transition = 'none';
    track.style.willChange = 'transform';
  }
  function dragMove(x, y, e) {
    if (!dragging) return;
    var moveX = x - startX;
    var moveY = Math.abs(y - startY);

    // 가로 스와이프가 의도라면 스크롤 방지
    if (Math.abs(moveX) > moveY && e && e.cancelable) e.preventDefault();

    // 양끝에서 살짝 고무줄 저항
    var atStart = (idx === 0 && moveX > 0);
    var atEnd   = (idx === items.length - 1 && moveX < 0);
    dx = (atStart || atEnd) ? moveX * 0.35 : moveX;

    applyTransform();
  }
  function dragEnd() {
    if (!dragging) return;
    dragging = false;

    var w = viewportWidth();
    var threshold = Math.min(140, Math.max(50, w * 0.18)); // 화면 18% 또는 50~140px

    track.style.transition = 'transform 320ms ease';
    if (Math.abs(dx) > threshold) {
      if (dx < 0) idx = clamp(idx + 1, 0, items.length - 1);
      else        idx = clamp(idx - 1, 0, items.length - 1);
    }
    dx = 0;
    applyTransform();
    update();
    track.style.willChange = '';
  }

  // Pointer Events 우선, 미지원 브라우저는 터치/마우스로 대체
  if ('PointerEvent' in window) {
    track.addEventListener('pointerdown', function (e) { dragStart(e.clientX, e.clientY); track.setPointerCapture(e.pointerId); });
    window.addEventListener('pointermove', function (e) { if (dragging) dragMove(e.clientX, e.clientY, e); }, { passive: false });
    window.addEventListener('pointerup',   dragEnd);
    window.addEventListener('pointercancel', dragEnd);
  } else {
    // 터치
    track.addEventListener('touchstart', function (e) {
      var t = e.touches[0]; dragStart(t.clientX, t.clientY);
    }, { passive: true });
    track.addEventListener('touchmove', function (e) {
      var t = e.touches[0]; dragMove(t.clientX, t.clientY, e);
    }, { passive: false });
    track.addEventListener('touchend', dragEnd);
    // 마우스(데스크톱)
    track.addEventListener('mousedown', function (e) { dragStart(e.clientX, e.clientY); });
    window.addEventListener('mousemove', function (e) { if (dragging) dragMove(e.clientX, e.clientY, e); });
    window.addEventListener('mouseup', dragEnd);
  }

  window.addEventListener('resize', update, { passive: true });
  update();
}


  /* -------- Goal accordion -------- */
  function initGoalAccordion() {
    $$('.goal-dropdown-card').forEach(function (card) {
      var btn = $('.goal-dropdown-header', card);
      var content = $('.goal-dropdown-content', card);
      if (!btn || !content) return;

      function setInitial() {
        var isOpen = btn.getAttribute('aria-expanded') === 'true';
        card.classList.toggle('open', isOpen);
        content.style.overflow = 'hidden';
        content.style.maxHeight = isOpen ? 'none' : '0px';
      }
      setInitial();

      content.addEventListener('transitionend', function (e) {
        if (e.propertyName !== 'max-height') return;
        if (btn.getAttribute('aria-expanded') === 'true') content.style.maxHeight = 'none';
      });

      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = btn.getAttribute('aria-expanded') === 'true';
        if (!isOpen) {
          btn.setAttribute('aria-expanded', 'true');
          card.classList.add('open');
          content.style.maxHeight = '0px';
          void content.offsetHeight;
          content.style.maxHeight = content.scrollHeight + 'px';
        } else {
          if (content.style.maxHeight === '' || getComputedStyle(content).maxHeight === 'none') {
            content.style.maxHeight = content.scrollHeight + 'px';
            void content.offsetHeight;
          }
          btn.setAttribute('aria-expanded', 'false');
          card.classList.remove('open');
          content.style.maxHeight = '0px';
        }
      });
    });
  }

  /* -------- Countdown -------- */
  function initCountdown() {
    var wrap = $('.count-wrap');
    if (!wrap) return;

    var elDays  = $('#days', wrap);
    var elHours = $('#hours', wrap);
    var elSecs  = $('#seconds', wrap);
    if (!elDays || !elHours || !elSecs) return;

    var paused = { days: false, hours: false, seconds: false };
    $$('.time-box', wrap).forEach(function (box) {
      var unit = box.getAttribute('data-unit');
      box.addEventListener('mouseenter', function () { if (unit) paused[unit] = true; });
      box.addEventListener('mouseleave', function () { if (unit) paused[unit] = false; });
    });

    var deadlineStr = wrap.getAttribute('data-deadline');
    var mode = deadlineStr ? 'deadline' : 'manual';

    var d = parseInt((elDays.textContent || '').replace(/\D+/g,''), 10)  || 0;
    var h = parseInt((elHours.textContent || '').replace(/\D+/g,''), 10) || 0;
    var s = parseInt((elSecs.textContent || '').replace(/\D+/g,''), 10)  || 0;

    function render() {
      if (!paused.days)    elDays.textContent  = String(d);
      if (!paused.hours)   elHours.textContent = String(h).padStart(2,'0');
      if (!paused.seconds) elSecs.textContent  = String(s).padStart(2,'0');
    }

    function tickManual() {
      if (d <= 0 && h <= 0 && s <= 0) {
        clearInterval(timerId);
        wrap.setAttribute('aria-label', 'countdown finished');
        return;
      }
      if (paused.seconds) return;

      s -= 1;
      if (s < 0) {
        if (paused.hours) { s = 0; return; }
        s = 59; h -= 1;
        if (h < 0) {
          if (paused.days) { h = 0; return; }
          h = 23; d = Math.max(0, d - 1);
        }
      }
      render();
    }

    function startDeadline() {
      var deadline = new Date(deadlineStr).getTime();
      function rafLoop() {
        var now = Date.now();
        var remain = Math.max(0, Math.floor((deadline - now) / 1000));
        var nd = Math.floor(remain / (24 * 3600));
        remain -= nd * 24 * 3600;
        var nh = Math.floor(remain / 3600);
        remain -= nh * 3600;
        var ns = remain;

        if (!paused.days)    d = nd;
        if (!paused.hours)   h = nh;
        if (!paused.seconds) s = ns;

        render();
        if (deadline > now) requestAnimationFrame(rafLoop);
        else wrap.setAttribute('aria-label', 'countdown finished');
      }
      rafLoop();
    }

    render();
    var timerId = null;
    if (mode === 'deadline') startDeadline();
    else timerId = setInterval(tickManual, 1000);
  }

  /* -------- Init -------- */

  // 아이콘/컨트롤 영역을 i18n 완전 차단
  (function protectIconsAndControls(){
    $$('.material-icons, .material-icons *, .svc-cont, .svc-cont *').forEach(function(el){
      el.setAttribute('data-no-i18n', '');
      if (el.hasAttribute('data-i18n')) el.removeAttribute('data-i18n');
    });
  })();

  document.addEventListener('DOMContentLoaded', function () {
    var langBtn = $('#langBtn');
    if (langBtn && !langBtn.getAttribute('aria-controls')) langBtn.setAttribute('aria-controls', 'langMenu');

    /* ✅ 먼저 범위 고정 바인딩을 적용해 p.fron-text 보호 + 자식 키 주입 */
    bindStrongAndTail(
      document.querySelector('#panel-a .tech-body li:nth-of-type(1) .fron-text'),
      'highlight.float',   // black-f(강조) 공통 키
      'pA.kf1.tail'        // 꼬리 전용 키
    );
    bindStrongAndTail(
      document.querySelector('#panel-a .tech-body li:nth-of-type(2) .fron-text'),
      'highlight.float',
      'pA.kf2.tail'
    );

    // 그 다음 자동 바인딩
    autowireBySelectors();
    autowireByTextMatch();

    // 초기 언어 결정 및 적용
    var htmlLang = (document.documentElement.getAttribute('lang') || '').slice(0,2);
    var initial = getSavedLang() || (htmlLang || 'en');
    setLanguage(initial);

    // 언어 드롭다운 바인딩
    var langMenu = $('#langMenu');
    if (langBtn && langMenu) {
      langBtn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var exp = langBtn.getAttribute('aria-expanded') === 'true';
        if (exp) closeLangMenu(); else openLangMenu();
      });
      langBtn.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault(); e.stopPropagation(); openLangMenu();
        }
      });
      langMenu.addEventListener('click', function (e) {
        e.stopPropagation();
        var li = e.target.closest('[role="option"]');
        if (li) chooseLang(li);
      });
    }

    bindNavScroll();
    initTechPanels();
    initServiceSlider();
    initGoalAccordion();
    initCountdown();
  });

  function setLanguage(lang) {
    saveLang(lang);
    applyI18n(lang);

    var btnText = $('#langBtnText');
    if (btnText) btnText.textContent = (LANG_CODES[lang] || lang);

    var menu = $('#langMenu');
    if (menu) {
      $$('#langMenu [role="option"]').forEach(function (li) {
        li.setAttribute('aria-selected', li.getAttribute('data-lang') === lang ? 'true' : 'false');
      });
    }
  }
})();
