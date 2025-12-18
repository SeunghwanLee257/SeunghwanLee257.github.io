// 항상 맨 위에서 시작
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (location.hash) history.replaceState(null, '', location.pathname + location.search);

 
(function () {
  'use strict';

  /* -------- Helpers -------- */
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (n, a, b) { return Math.max(a, Math.min(b, n)); };
  var stripTags = function (h) { return String(h).replace(/<[^>]*>/g, ''); };
  var norm = function (s) { return String(s).replace(/\s+/g, ' ').trim(); };
  var root = document.scrollingElement || document.documentElement;
  var galleryConfig = {
    basePath:'./images/',
    device:'web',
    container:null,
    image:null,
    placeholder:null,
    loading:null,
    ready:false
  };
  var currentGalleryVersion='ver_121025';
  var currentGalleryLanguage='en';

  /* ================= i18n dict (en/ko) ================= */
  var I18N = {
    en: {
      'lang.label': 'Language',
      'nav.vision': 'Vision',
      'nav.solutions': 'Solutions',
      'nav.tech': 'Technology',
      'nav.service': 'Service',
      'nav.goal': 'Goal',
      'nav.team': 'Team',
      'nav.advisors': 'Advisors',
      'hero.headline': 'Confidential Coprocessor for Fair and Verifiable RWA Markets<br>FHE16 + MPC + Threshold Cryptography — Privacy that scales with performance.',
      'sec02.slogan': 'Run encrypted computation verifiably on-chain<br> with FHE16 and MPC.<br>Only what\'s needed is revealed —<br> privacy preserved, fairness ensured.',
      'slogan': 'waLLLnut\'s vision is to ensure both <strong>"transparency"</strong> and <strong>"confidentiality"</strong> of data in the next-generation internet infrastructure.',
      'sec.tech': '03. Technology',
      'sec.service': '02. Solutions',
      'sec.goal': '01. Vision',
      'sec.team': '04. Team',
      
      
      // Tech A
      'pA.title': 'FHE16',
      'pA.subtitle': 'A 16-bit integer computation–centric deterministic FHE structure that eliminates floating-point operations, ensuring identical results regardless of the execution environment',
      'common.keyFeatures': 'Key Features',

      // 강조 조각
      'highlight.float': 'Elimination of floating-point operations,',
      'highlight.float.short': 'Elimination of floating-point',
      'pA.kf1.tail': ' ensuring identical results regardless of the execution environments',
      'pA.kf2.tail': ' avoiding environment-specific error issues',

      // 3번 항목
      'highlight.boot': 'Ultra-fast 2.89 ms bootstrapping',
      'pA.kf3.tail': ' through GINX gate optimization (suitable for real-time and low-latency applications)',

      'common.reference': 'Reference: ePrint 2024/1916',

      // Tech B (MPC)
      'pB.title': 'FHE16-based MPC (SSFHE)',
      'pB.subtitle': 'An efficient MPC that combines FHE16 and CRT-SPDZ, utilizing composite numbers of 16-bit primes as modulus values and effective sampling.',
      'pB.kf1': 'O(1) complexity for each of communication, computation,<br> rounds and input size',
      'pB.kf2': 'O(n κ d²) complexity for generation of evaluation key (ev)',
      'pB.kf3': 'CRT-SPDZ–based secure random number and distribution sampling (including Discrete Gaussian)',
      'pB.kf4': 'Circuit Privacy with active security in a dishonest majority setting',

      // Tech-B 강조(부분 바인딩)
      'pB.hl1.pre':    '',
      'pB.hl1.strong': 'O(1) complexity',
      'pB.hl1.tail':   ' for each of communication, computation,<br> rounds and input size',

      'pB.hl2.pre':    'O(n κ d²) complexity for generation of ',
      'pB.hl2.strong': 'evaluation key (ev)',
      'pB.hl2.tail':   '',

      'pB.hl3.pre':    '',
      'pB.hl3.strong': 'CRT-SPDZ–based',
      'pB.hl3.tail':   ' secure random number and distribution sampling (including Discrete Gaussian)',

      'pB.hl4.pre':    'Circuit Privacy with ',
      'pB.hl4.strong': 'active security in a dishonest majority',
      'pB.hl4.tail':   ' setting',

      // Service / Goal / Use cases …
      'svc.meta.keyword': 'Keyword',
      'svc.1.desc': 'Normal transactions stay on-chain, while sensitive data/compute run <strong>in a confidential FHE coprocessor—keeping state public.</strong>',
      'svc.1.meta.title2': 'Hide',
      'svc.1.meta.ref': 'Encrypted data stays hidden',
      'svc.2.desc': 'On Solana, we apply <strong>FHE to sensitive state and code,</strong> enabling private execution <strong>hidden from external observers.</strong>',
      'svc.2.meta.title2': 'Solana',
      'svc.2.meta.ref': 'Encrypted data stays hidden',
      'svc.3.desc': 'Block trading bots from doing <br>MEV extraction in order to <strong>boost asset growth and returns</strong>',
      'svc.3.meta.title2': 'Fair asset growth',
      'svc.3.meta.ref': 'Block trading bots to protect<br>your assets and boost returns',
      'svc.4.desc': 'Demographic vote stats—<br><strong>no disclosure of individual choices or identities.</strong>',
      'svc.4.meta.title2': 'Privately',
      'svc.4.meta.ref': 'Safe and private voting',
      'goal.caption': 'waLLLnut\'s Confidential Coprocessor locks data with FHE, MPC, and threshold cryptography while running verifiable on-chain compute. It opens only what\'s needed, with user consent—reducing MEV bots\' edge and keeping markets fair.',
      'goal.q1': 'What does waLLLnut actually do—and what are we confident about? 🫥💪',
      'goal.a1': 'We\'re a research-driven company building on quantum-resistant FHE (Fully Homomorphic Encryption) and MPC (Multi-Party Computation) to make data security and privacy sustainable. Moreover, multi-users\' data can be securely and privately processed — decrypting only when needed and extracting statistical insights if necessary.📊📈',
      'goal.q2': 'Hashes for waLLLnut\'s upcoming pre-release research outcomes and keywords slated for public disclosure. 📊🔬🏗️',
      'goal.hash.disclose': 'f321ce2f5032c6d408f553606755b51378366c99adfa37337c95c1a330577139',
      'goal.q3': 'So, what\'s in waLLLnut\'s product lineup? 🚀',
      'goal.a3.1': 'Flagship Product — Deterministic Confidential Coprocessor 🏁',
      'goal.a3.2': 'Executes blockchain state data on FHE16, enabling public verification. 🔍',
      'goal.a3.3': 'Unlike traditional ZK systems limited to fixed state verification, FHE16 keeps the entire state fully encrypted and enables true dynamic state verification without revealing any computation results.',
      'usecases.title': 'Use Cases',
      'use1.title': 'Protecting DeFi transaction data and preventing MEV',
      'use1.desc': 'Keep your crypto trades private so others can\'t peek at your orders.<br>Block unfair bot tactics that jump ahead to profit from your trade (often called MEV).',
      'use2.title': 'On-chain voting (selective anonymity + public verifiability)',
      'use2.desc': 'Vote on the blockchain while your identity and choice stay private.<br>Anyone can still verify the overall results are real.',
      'use3.title': 'Data marketplaces (perform computations without revealing raw data)',
      'use3.desc': 'Buy and sell insights without handing over your raw data.<br>The marketplace runs computations on protected data, so the originals stay private.',
      'use4.title': 'Privacy-preserving messaging/SNS',
      'use4.desc': 'Chat and share on social without giving up your privacy.<br>Your content stays encrypted, and you decide who sees what.',
      'prop.f1': 'Each private state is deterministically encrypted under FHE16 and recorded on-chain',
      'prop.f2': 'Any state change can be verified by all network participants',
      'prop.f3': 'State disclosure is propagated across the network via a Threshold Decryption protocol',
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
      'prof.1.name': 'Jon-Lark Kim:',
      'prof.1.affil': 'Professor of Sogang University',
      'prof.2.name': 'Young-Sik Kim:',
      'prof.2.affil': 'Professor of DGIST',
      'prof.3.name': 'Jooyoung Lee:',
      'prof.3.affil': 'Professor of KAIST',
      'prof.4.name': 'Yongwoo Lee:',
      'prof.4.affil': 'Professor of Inha University',
      'prof.5.name': 'Jong-Seon No:',
      'prof.5.affil': 'Emeritus Professor of Seoul National University',
      'advisors.title': 'waLLLnut collaborates with distinguished professors from<br>leading universities in Korea for technical advisory and joint research.',
      'footer.copy': '© 2025 waLLLnut · All rights reserved.'
    },
    ko: {
      'lang.label': '언어',
      'nav.vision': '비전',
      'nav.solutions': '솔루션',
      'nav.tech': '기술',
      'nav.team': '팀',
      'hero.headline': '공정하고 신뢰할 수 있는 실물자산(RWA) 시장을 위한<br>비공개 연산 플랫폼 FHE16, MPC, 임계값 암호화를 결합해<br>성능 저하 없이 확장 가능한 프라이버시를 제공합니다.',
      'sec02.slogan': 'FHE16과 MPC로 암호화된 연산을 온체인에서 검증 가능하게 실행합니다.<br>필요한 정보만 공개되어 — 프라이버시는 지켜지고,<br>공정성은 보장됩니다.',
      'slogan': 'waLLLnut의 비전은 차세대 인터넷 인프라에서 데이터의 <strong>"투명성"</strong>과 <strong>"기밀성"</strong>을 모두 보장하는 것입니다.',
      'sec.tech': '03. Technology',
      'sec.service': '02. Solutions',
      'sec.goal': '01. Vision',
      'sec.exp': '04. Our Experience',
      'sec.team': '04. Team',
      

      // Tech A
      'pA.title': 'FHE16',
      'pA.subtitle': '16비트 정수 연산 중심의 결정론적 FHE 구조로 부동소수 연산을 제거하여, 실행 환경에 상관없이 동일한 결과를 보장합니다',
      'common.keyFeatures': '핵심 특징',

      // 강조 조각
      'highlight.float': '부동소수점 연산 제거,',
      'highlight.float.short': '부동소수점 제거',
      'pA.kf1.tail': ' 실행 환경과 무관하게 동일한 결과 보장',
      'pA.kf2.tail': ' 환경별 오차 문제를 방지',

      // 3번 항목
      'highlight.boot': '2.89ms 초고속 부트스트래핑',
      'pA.kf3.tail': ' — GINX 게이트 최적화를 통해 (실시간·저지연 애플리케이션 적합)',

      'common.reference': '참고: ePrint 2024/1916',

      // Tech B (MPC)
      'pB.title': 'FHE16 기반 MPC (SSFHE)',
      'pB.subtitle': 'FHE16과 CRT-SPDZ를 결합한 효율적인 MPC로, 16비트 소수의 합성수를 모듈러로 활용하고 효율적인 샘플링을 지원합니다.',
      'pB.kf1': '통신·연산·라운드·입력 크기 각각에 대해 O(1) 복잡도',
      'pB.kf2': '평가 키(ev) 생성의 복잡도: O(n κ d²)',
      'pB.kf3': 'CRT-SPDZ 기반 안전한 난수·분포 샘플링(이산 가우시안 포함)',
      'pB.kf4': '불신 다수 환경에서 능동 보안의 서킷 프라이버시',

      // Tech-B 강조(부분 바인딩)
      'pB.hl1.pre':    '',
      'pB.hl1.strong': 'O(1) 복잡도',
      'pB.hl1.tail':   ' — 통신·연산·라운드·입력 크기 각각',

      'pB.hl2.pre':    'O(n κ d²) 복잡도 — ',
      'pB.hl2.strong': '평가 키(ev) 생성',
      'pB.hl2.tail':   '',

      'pB.hl3.pre':    '',
      'pB.hl3.strong': 'CRT-SPDZ 기반',
      'pB.hl3.tail':   ' 안전한 난수 및 분포 샘플링(이산 가우시안 포함)',

      'pB.hl4.pre':    '서킷 프라이버시 — ',
      'pB.hl4.strong': '불신 다수 환경의 능동 보안',
      'pB.hl4.tail':   '',

      // Service / Goal / Use cases …
      'svc.meta.keyword': '키워드',
      'svc.1.desc': '일반 거래는 온체인에 그대로 남겨두고, <br>민감한 데이터·연산은 <strong>기밀 FHE 보조 프로세서에서 실행해 상태는 공개로 유지합니다.</strong>',
      'svc.1.meta.title2': '숨김',
      'svc.1.meta.ref': '암호화된 데이터는 <br>숨겨진 상태를 유지합니다',
      'svc.2.desc': 'Solana에서 <strong>민감한 상태와 코드에 FHE를 적용</strong>하여<br>외부 관찰자로부터 <strong>숨겨진 비공개 실행</strong>을 가능하게 합니다.',
      'svc.2.meta.title2': 'Solana',
      'svc.2.meta.ref': '암호화된 데이터는 <br>숨겨진 상태를 유지합니다',
      'svc.3.desc': 'MEV 추출을 일으키는 트레이딩 봇을 차단하여 <br><strong>자산 성장과 수익을 향상</strong>합니다',
      'svc.3.meta.title2': '공정한 자산 성장',
      'svc.3.meta.ref': '봇을 차단해 자산을 보호하고<br>수익을 높이세요',
      'svc.4.desc': '개인 선택·신원을 공개하지 않고<br>인구통계 기반 통계만 제공합니다.',
      'svc.4.meta.title2': '비공개로',
      'svc.4.meta.ref': '안전하고 프라이버시를 <br>지키는 투표',
      'goal.caption': 'waLLLnut의 기밀 보조 프로세서는 FHE, MPC, 임계값 암호화를 활용해 데이터를 잠근 상태로 검증 가능한 온체인 연산을 수행합니다. 사용자가 동의한 필요한 정보만 잠깐 열어, MEV 봇의 이점을 줄이고 시장의 공정성을 지켜줍니다.',
      'goal.q1': 'waLLLnut은 무엇을 하고, 어디에 자신이 있을까요? 🫥💪',
      'goal.a1': '우리는 양자내성 FHE와 MPC를 바탕으로 보안·프라이버시의 지속가능성을 연구·구현합니다. 다수 사용자의 데이터도 필요한 경우에만 복호화하며, 필요 시 통계적 인사이트만 안전하게 추출할 수 있습니다.📊📈',
      'goal.q2': '공개 예정인 사전 연구성과 및 키워드의 해시 목록입니다. 📊🔬🏗️',
      'goal.hash.disclose': '(2025년 10월 공개 예정)',
      'goal.q3': 'waLLLnut 제품 라인업은 무엇인가요? 🚀',
      'goal.a3.1': '플래그십 — 결정적 기밀 보조 프로세서 🏁',
      'goal.a3.2': 'FHE16 기반으로 블록체인 상태 데이터를 실행하여, 누구나 검증 가능한 온체인 연산을 제공합니다. 🔍',
      'goal.a3.3': '고정 상태만 검증 가능한 기존 ZK 시스템과 달리, FHE16 기술은 동적 상태 검증을 지원합니다. 🔄✅',
      'usecases.title': '활용 사례',
      'use1.title': 'DeFi 거래 데이터 보호 및 MEV 방지',
      'use1.desc': '주문이 노출되지 않도록 거래를 비공개로 유지합니다.<br>선점 이익을 노리는(소위 MEV) 부정 봇 전술을 차단합니다.',
      'use2.title': '온체인 투표(선택적 익명성 + 공개 검증)',
      'use2.desc': '신원과 선택은 비공개로 지키면서 투표합니다.<br>동시에 누구나 결과의 진위를 검증할 수 있습니다.',
      'use3.title': '데이터 마켓플레이스(원본 공개 없는 연산)',
      'use3.desc': '원본 데이터를 넘기지 않고 인사이트만 사고팝니다.<br>보호된 데이터 위에서 연산이 수행되어 원본은 안전합니다.',
      'use4.title': '프라이버시 보존 메신저/SNS',
      'use4.desc': '프라이버시를 포기하지 않고 소통하세요.<br>콘텐츠는 암호화되며, 공개 범위는 사용자가 결정합니다.',
      'prop.f1': '각 프라이빗 상태는 FHE16으로 결정론적으로 암호화되어 온체인에 기록',
      'prop.f2': '모든 네트워크 참여자가 상태 변경을 검증 가능',
      'prop.f3': '임계값 복호화 프로토콜로 상태 공개가 네트워크에 전파',
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
      'prof.1.name': '김종락 교수님',
      'prof.1.affil': '서강대학교 교수',
      'prof.2.name': '김영식 교수님',
      'prof.2.affil': 'DGIST 교수',
      'prof.3.name': '이주영 교수님',
      'prof.3.affil': 'KAIST 교수',
      'prof.4.name': '이용우 교수님',
      'prof.4.affil': '인하대학교 교수',
      'prof.5.name': '노종선 교수님',
      'prof.5.affil': '서울대학교 명예교수',
      'advisors.title': 'waLLLnut는 한국 주요 대학의 저명한 교수진과 함께<br>기술 자문 및 공동 연구를 진행합니다.',
      'footer.copy': '© 2025 waLLLnut · All rights reserved.'
    }
  };

  var LANG_CODES = { en: 'eng', ko: 'kor' };
  var I18N_EXCLUDE = [
    '.material-icons', '.material-icons *',
    '.svc-cont', '.svc-cont *',
    '.goal-dropdown-icon'
  ];
  var EXCLUDE_SELECTOR = I18N_EXCLUDE.join(',');

  /* ================= i18n core ================= */
  function isExcluded(el) {
    if (!el) return false;
    if (EXCLUDE_SELECTOR && el.closest && el.closest(EXCLUDE_SELECTOR)) return true;
    if (el.hasAttribute('data-no-i18n')) return true;
    return false;
  }
  function applyI18n(lang) {
    var fb = 'en';
    document.documentElement.setAttribute('lang', lang);
    if (EXCLUDE_SELECTOR) {
      $$(EXCLUDE_SELECTOR).forEach(function (root) {
        root.removeAttribute && root.removeAttribute('data-i18n');
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
  function getSavedLang(){ try{ return localStorage.getItem('lang'); }catch(e){ return null; } }
  function saveLang(v){ try{ localStorage.setItem('lang', v); }catch(e){} }

  /* === pre/strong/tail 3분할 바인더 === */
/* === pre/strong/tail 3분할 바인더 — 안전판 버전 === */
function bindThreeParts(p, preKey, strongKey, tailKey){
  if (!p) return;

  // p 자체는 i18n 대상에서 제외 (자동 텍스트 치환 방지)
  if (p.hasAttribute('data-i18n')) p.removeAttribute('data-i18n');
  p.setAttribute('data-no-i18n','');

  var strong = p.querySelector('.black-f');
  if (!strong) return;

  // 1) pre/tail 보장
  var preSpan = p.querySelector('.hl-pre');
  if (!preSpan){
    preSpan = document.createElement('span');
    preSpan.className = 'hl-pre';
    p.insertBefore(preSpan, p.firstChild);
  }

  var tailSpan = p.querySelector('.hl-tail');
  if (!tailSpan){
    tailSpan = document.createElement('span');
    tailSpan.className = 'hl-tail';
    p.appendChild(tailSpan);
  }

  // 2) pre 정리: strong 앞에 있는 형제들을 preSpan으로 이동
  //    (tailSpan/strong은 제외)
  var node = preSpan.nextSibling;
  while (node && node !== strong && node !== tailSpan){
    var next = node.nextSibling;
    preSpan.appendChild(node);
    node = next;
  }

  // 3) tail 정리: strong 뒤의 형제들을 tailSpan으로 이동
  //    ★ 핵심 수정: tailSpan 자신을 만나면 중단하여 자기-자기 append 방지
  var node2 = strong.nextSibling;
  while (node2 && node2 !== tailSpan){
    var next2 = node2.nextSibling;
    tailSpan.appendChild(node2);
    node2 = next2;
  }

  // 4) i18n 키 바인딩
  if (preKey)    preSpan.setAttribute('data-i18n', preKey);
  if (strongKey) strong.setAttribute('data-i18n', strongKey);
  if (tailKey)   tailSpan.setAttribute('data-i18n', tailKey);
}

  /* === 하이라이트 박스: 보장 + 레이아웃 + 인뷰 애니메이션 === */
  function ensureBox(item){
    var box = item.querySelector('.box');
    if (!box){
      box = document.createElement('div');
      box.className = 'box';
      item.appendChild(box);
    }
    item.style.position = 'relative';
    item.style.overflow = 'visible';

    var p = item.querySelector('.front-text, .fron-text');
    if (p){
      p.style.position = 'relative';
      p.style.zIndex = '1';
      p.setAttribute('data-no-i18n',''); // 문장 보호
    }

    // CSS 없어도 동작하도록 최소 스타일 강제
    box.style.position = 'absolute';
    box.style.left = '0px';
    box.style.top = '0px';
    box.style.height = '0px';
    box.style.width = '0px';
    box.style.background = '#FF952D';
    box.style.borderRadius = '4px';
    box.style.pointerEvents = 'none';
    box.style.zIndex = '0';
    box.style.transformOrigin = 'left center';
    box.style.transform = 'scaleX(0)';
    box.style.transition = 'transform 420ms ease';
    return box;
  }
function layoutHighlight(item){
  var strong = item.querySelector('.front-text .black-f, .fron-text .black-f');
  var box    = ensureBox(item);
  if (!strong) { box.style.transform = 'scaleX(0)'; return; }

  var rs = strong.getBoundingClientRect();
  var ri = item.getBoundingClientRect();

  // strong의 좌상단을 item 기준 좌표로 변환
  var left = rs.left - ri.left;
  var top  = rs.top  - ri.top;

  // 컨테이너 안쪽 폭(패딩 제외) 계산 후, 오른쪽으로 넘치지 않게 클램프
  var cs    = getComputedStyle(item);
  var padL  = parseFloat(cs.paddingLeft)  || 0;
  var padR  = parseFloat(cs.paddingRight) || 0;
  var inner = item.clientWidth - padL - padR;

  var maxW  = Math.max(0, inner - left);
  var width = Math.min(rs.width, maxW);
  var height = Math.max(0, rs.height);

  // 음수/소수 방지
  box.style.left   = Math.max(0, Math.round(left))  + 'px';
  box.style.top    = Math.max(0, Math.round(top))   + 'px';
  box.style.width  = Math.round(width)              + 'px';
  box.style.height = Math.round(height)             + 'px';
}

  function requestHighlightRelayout(){
    var fn=document._walllnutLayoutHighlight;
    if(typeof fn==='function'){
      requestAnimationFrame(fn);
    }
  }

  function initHighlightAnim(){
    var items = Array.prototype.slice.call(document.querySelectorAll('.g-item-ex'));
    if (!items.length) return;

    function layoutAll(){ items.forEach(layoutHighlight); }
    document._walllnutLayoutHighlight = function(){
      layoutAll();
    };
    layoutAll();
    window.addEventListener('resize', layoutAll, { passive:true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutAll);

    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var item = entry.target;
        var box = item.querySelector('.box');
        if (!box) return;

        if (entry.isIntersecting){
          layoutHighlight(item); // 최신 치수 반영
          requestAnimationFrame(function(){ box.style.transform = 'scaleX(1)'; });
        }else{
          box.style.transform = 'scaleX(0)';
        }
      });
    }, { threshold: 0.15, rootMargin: '20% 0px -5% 0px' });

    items.forEach(function(it){ ensureBox(it); io.observe(it); });
  }

  function setKey(el, key){ if (el && !isExcluded(el) && !el.hasAttribute('data-i18n')) el.setAttribute('data-i18n', key); }
  function setKeyBySel(sel, key){ setKey($(sel), key); }
  function setKeyList(sel, keys){ var list=$$(sel); keys.forEach(function(k,i){ if(list[i]) setKey(list[i],k); }); }

  function autowireBySelectors() {
    setKeyList('.nav a', ['nav.tech','nav.service','nav.goal','nav.team','nav.advisors']);
    setKeyBySel('#tech-label','sec.tech');
    setKeyBySel('#service-label','sec.service');
    setKeyBySel('#goal-label','sec.goal');
    setKeyBySel('#exp-label','sec.exp');
    setKeyBySel('#team-label','sec.team');
    setKeyBySel('#sec02 .strip p', 'slogan');

    // Tech A
    setKeyBySel('#panel-a .tech-title-lg#tab-a', 'pA.title');
    setKeyBySel('#panel-a .tech-subtitle', 'pA.subtitle');
    setKeyBySel('#panel-a .captionKey', 'common.keyFeatures');
    setKeyBySel('#panel-a .tech-ref a', 'common.reference');

    // Tech B (li 전체 바인딩 금지! 제목/부제/캡션/레퍼런스만)
    setKeyBySel('#panel-b .tech-title-lg#tab-b', 'pB.title');
    setKeyBySel('#panel-b .tech-subtitle', 'pB.subtitle');
    setKeyBySel('#panel-b .captionKey', 'common.keyFeatures');
    setKeyBySel('#panel-b .tech-ref a', 'common.reference');

    // Service slides
    function S(n,s){ return '.svc-item:nth-of-type('+n+') '+s; }
    setKeyBySel(S(1,'.svc-desc'),'svc.1.desc');
    setKeyBySel(S(1,'.svc-c-title'),'svc.meta.keyword');
    setKeyBySel(S(1,'.svc-c-title2'),'svc.1.meta.title2');
    setKeyBySel(S(1,'.svc-c-ref'),'svc.1.meta.ref');

    setKeyBySel(S(2,'.svc-desc'),'svc.2.desc');
    setKeyBySel(S(2,'.svc-c-title'),'svc.meta.keyword');
    setKeyBySel(S(2,'.svc-c-title2'),'svc.2.meta.title2');
    setKeyBySel(S(2,'.svc-c-ref'),'svc.2.meta.ref');

    setKeyBySel(S(3,'.svc-desc'),'svc.3.desc');
    setKeyBySel(S(3,'.svc-c-title'),'svc.meta.keyword');
    setKeyBySel(S(3,'.svc-c-title2'),'svc.3.meta.title2');
    setKeyBySel(S(3,'.svc-c-ref'),'svc.3.meta.ref');

    setKeyBySel(S(4,'.svc-desc'),'svc.4.desc');
    setKeyBySel(S(4,'.svc-c-title'),'svc.meta.keyword');
    setKeyBySel(S(4,'.svc-c-title2'),'svc.4.meta.title2');
    setKeyBySel(S(4,'.svc-c-ref'),'svc.4.meta.ref');

    // Goal
    setKeyBySel('.goal-caption p', 'goal.caption'); // (.p → p) 수정
    setKeyBySel('.goal-dropdown-card:nth-of-type(1) .goal-dropdown-question', 'goal.q1');
    setKeyBySel('.goal-dropdown-card:nth-of-type(1) .goal-dropdown-content .goal-dropdown-text', 'goal.a1');

    setKeyBySel('.goal-dropdown-card:nth-of-type(2) .goal-dropdown-question', 'goal.q2');
    $$('.goal-dropdown-card:nth-of-type(2) .item-drop p:first-child').forEach(function(p){ setKey(p,'goal.hash.disclose'); });

    setKeyBySel('.goal-dropdown-card:nth-of-type(3) .goal-dropdown-question', 'goal.q3');
    var ps3 = $$('.goal-dropdown-card:nth-of-type(3) .goal-dropdown-content .goal-dropdown-text');
    if (ps3[0]) setKey(ps3[0],'goal.a3.1');
    if (ps3[1]) setKey(ps3[1],'goal.a3.2');
    if (ps3[2]) setKey(ps3[2],'goal.a3.3');

    // Use cases
    setKeyBySel('.use-cases-title','usecases.title');
    var u = $$('.use-cases-section .use-case');
    if (u[0]) { setKey($('.use-case-title',u[0]),'use1.title'); setKey($('.use-case-desc',u[0]),'use1.desc'); }
    if (u[1]) { setKey($('.use-case-title',u[1]),'use2.title'); setKey($('.use-case-desc',u[1]),'use2.desc'); }
    if (u[2]) { setKey($('.use-case-title',u[2]),'use3.title'); setKey($('.use-case-desc',u[2]),'use3.desc'); }
    if (u[3]) { setKey($('.use-case-title',u[3]),'use4.title'); setKey($('.use-case-desc',u[3]),'use4.desc'); }

    // Property features
    setKeyList('.property-features li',['prop.f1','prop.f2','prop.f3']);

    // Team
    (function bindTeam(){
      var cards=$$('.team-grid .team-member');
      cards.forEach(function(card,i){
        var n=i+1, nameEl=$('.member-name-role',card), descEl=$('.member-description',card);
        if(nameEl) setKey(nameEl,'member'+n+'.role');
        if(descEl) setKey(descEl,'member'+n+'.description');
      });
    })();

    // Advisors
    (function bindAdvisors(){
      function P(n,s){ return '.professor-list .list-item:nth-of-type('+n+') '+s; }
      setKeyBySel(P(1,'.pro-name strong'),'prof.1.name');  setKeyBySel(P(1,'.pro-list-link'),'prof.1.affil');
      setKeyBySel(P(2,'.pro-name strong'),'prof.2.name');  setKeyBySel(P(2,'.pro-list-link'),'prof.2.affil');
      setKeyBySel(P(3,'.pro-name strong'),'prof.3.name');  setKeyBySel(P(3,'.pro-list-link'),'prof.3.affil');
      setKeyBySel(P(4,'.pro-name strong'),'prof.4.name');  setKeyBySel(P(4,'.pro-list-link'),'prof.4.affil');
      setKeyBySel(P(5,'.pro-name strong'),'prof.5.name');  setKeyBySel(P(5,'.pro-list-link'),'prof.5.affil');
    })();

    // Footer / label
    setKeyBySel('#sec08 .s08-comt-inner .s08-title','advisors.title');
    var footerCopy=$('footer .container span'); if(footerCopy && !footerCopy.hasAttribute('data-i18n')) footerCopy.setAttribute('data-i18n','footer.copy');
    var label=$('#langLabel'); if(label && !label.hasAttribute('data-i18n')) label.setAttribute('data-i18n','lang.label');
  }

  // 텍스트 매칭 자동 바인딩 (인터랙티브 영역 보호)
  function autowireByTextMatch() {
    var map = new Map(), en = I18N.en || {};
    Object.keys(en).forEach(function(k){ map.set(norm(stripTags(en[k])), k); });

    var roots = $$('main, header, footer');
    var nodes = [];
    roots.forEach(function(root){ nodes = nodes.concat($$('a,h1,h2,h3,h4,h5,h6,p,button,div,span,li', root)); });
    nodes = nodes.filter(function(el){
      return !el.hasAttribute('data-i18n')
             && !el.classList.contains('fron-text') // 과거 오타 호환
             && !el.classList.contains('front-text')
             && !el.classList.contains('g-item-ex') // 강조 아이템 보호
             && !isExcluded(el)
             && !el.hasAttribute('data-no-i18n');
    });
    nodes.forEach(function(el){
      var key = map.get(norm(el.innerHTML || el.textContent || '')); if (key) el.setAttribute('data-i18n', key);
    });
  }

  /*function updateGalleryImage(){
    if(!galleryConfig.ready || !galleryConfig.container) return;
    var container=galleryConfig.container;
    var placeholder=galleryConfig.placeholder;
    var loading=galleryConfig.loading;
    var imageEl=galleryConfig.image;

    if(loading){
      loading.textContent='';
      loading.style.display='none';
    }

    if(imageEl){
      imageEl.hidden=true;
      imageEl.style.display='none';
      imageEl.removeAttribute('src');
    }

    if(placeholder){
      placeholder.style.display='grid';
    }

    var THEMES={
      en:{ bg:'#B91C1C', border:'#9A1919', text:'#FFFFFF' },
      ko:{ bg:'#1E3A8A', border:'#1A2D66', text:'#FFFFFF' }
    };
    var theme=THEMES[currentGalleryLanguage] || { bg:'#4B5563', border:'#374151', text:'#FFFFFF' };
    container.style.background=theme.bg;
    container.style.borderColor=theme.border;
    container.style.color=theme.text;
    if(placeholder) placeholder.style.color=theme.text;
  }*/

  /* ---------------- Language dropdown ---------------- */
  function openLangMenu() {
    var btn=$('#langBtn'), menu=$('#langMenu'); if(!btn||!menu) return;
    btn.setAttribute('aria-expanded','true'); menu.hidden=false; menu.style.display='block';
    var all=$$('#langMenu [role="option"]'); all.forEach(function(li){ li.classList.remove('focused'); });
    var current=menu.querySelector('[aria-selected="true"]')||all[0]; if(current) current.classList.add('focused');

    if(!document._langDocClick){
      document._langDocClick=function(e){ if(!menu.contains(e.target)&&!btn.contains(e.target)) closeLangMenu(); };
      document.addEventListener('click',document._langDocClick,true);
    }
    if(!document._langKeydown){
      document._langKeydown=function(e){
        if(menu.hidden) return;
        if(e.key==='ArrowDown'){ e.preventDefault(); moveLangFocus(1); }
        else if(e.key==='ArrowUp'){ e.preventDefault(); moveLangFocus(-1); }
        else if(e.key==='Enter'){ e.preventDefault(); var f=$('#langMenu .focused')||menu.querySelector('[aria-selected="true"]'); if(f) chooseLang(f); }
        else if(e.key==='Escape'){ e.preventDefault(); closeLangMenu(); btn && btn.focus(); }
      };
      document.addEventListener('keydown',document._langKeydown);
    }
  }
  function closeLangMenu(){ var btn=$('#langBtn'), menu=$('#langMenu'); if(!btn||!menu) return; btn.setAttribute('aria-expanded','false'); menu.hidden=true; menu.style.display='none'; }
  function moveLangFocus(dir){
    var menu=$('#langMenu'); if(!menu||menu.hidden) return; var list=$$('#langMenu [role="option"]'); if(!list.length) return;
    var idx=list.findIndex(function(li){return li.classList.contains('focused');});
    if(idx<0) idx=list.findIndex(function(li){return li.getAttribute('aria-selected')==='true';});
    var next=(idx<0?0:(idx+dir+list.length)%list.length); list.forEach(function(li){li.classList.remove('focused');}); list[next].classList.add('focused'); list[next].scrollIntoView({block:'nearest'});
  }
  function chooseLang(li){ if(!li) return; setLanguage(li.getAttribute('data-lang')); closeLangMenu(); var b=$('#langBtn'); if(b) b.focus(); }
  function setLanguage(lang){
    saveLang(lang); applyI18n(lang);
    var btnText=$('#langBtnText'); if(btnText) btnText.textContent=(LANG_CODES[lang]||lang);
    var menu=$('#langMenu'); if(menu){ $$('#langMenu [role="option"]').forEach(function(li){ li.setAttribute('aria-selected', li.getAttribute('data-lang')===lang?'true':'false'); }); }
    syncLangToggleUI(lang);
    currentGalleryLanguage=lang;
    // if(galleryConfig.ready) updateGalleryImage();
    requestHighlightRelayout();
  }
  function syncLangToggleUI(lang){
    $$('.lang-toggle-btn').forEach(function(btn){
      var targetLang=btn.getAttribute('data-lang');
      var isActive=targetLang===lang;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive?'true':'false');
    });
  }

  /* ================= Smooth Scroll ================= */
  function getHeaderOffset() {
    var header = document.querySelector('.header');
    if (!header) return 0;
    var rect = header.getBoundingClientRect();
    var cs = getComputedStyle(header);
    var fixed = cs.position === 'fixed';
    var sticky = cs.position === 'sticky' && rect.top <= 0 + 1;
    return (fixed || sticky) ? rect.height : 0;
  }

  function smoothScrollTo(targetSelector) {
    var el = document.querySelector(targetSelector);
    if (!el) return;

    var offset = getHeaderOffset() + 12;
    var top = getScrollY() + el.getBoundingClientRect().top - offset;
    if (top < 0) top = 0;

    smoothTo(top);

    setTimeout(function(){
      var now = getScrollY();
      if (Math.abs(now - top) < 2) {
        if (history && history.pushState) history.pushState(null, '', targetSelector);
        else location.hash = targetSelector;
      }
    }, 80);
  }
  window.smoothScrollTo = smoothScrollTo;

  function clearLocks(){
    document.documentElement.classList.remove('menu-locked');
    document.body.classList.remove('menu-locked');
    var overlay = $('.mobile-menu-overlay');
    if (overlay) overlay.classList.remove('is-active');
    var logoMenus = $('.logo-menus');
    if (logoMenus) logoMenus.classList.remove('is-open');
    var nav = $('.nav');
    if (nav) nav.classList.remove('is-open');
    var menuBtn = $('.mobile-menu-btn');
    if (menuBtn) {
      menuBtn.classList.remove('is-active');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  }

  // === Scroll root detection ===
  function getScrollRoot() {
    var cands = [
      document.scrollingElement || null,
      document.documentElement,
      document.body,
      document.querySelector('#main'),
      document.querySelector('main')
    ].filter(Boolean);

    var best = cands[0];
    var bestScore = -1;

    cands.forEach(function(el){
      var cs = getComputedStyle(el);
      var canOverflow = /(auto|scroll)/.test(cs.overflowY) || /(auto|scroll)/.test(cs.overflow);
      var scrollable = (el.scrollHeight - el.clientHeight) > 1;
      var score = (canOverflow?2:0) + (scrollable?3:0) + (el === document.scrollingElement?1:0);
      if (score > bestScore) { best = el; bestScore = score; }
    });

    return best || document.documentElement;
  }

  function getScrollY() {
    var root = getScrollRoot();
    return root === document.body || root === document.documentElement
      ? (window.pageYOffset || window.scrollY || root.scrollTop || 0)
      : root.scrollTop || 0;
  }

  function smoothTo(y) {
    var root = getScrollRoot();

    try { window.scrollTo({ top: y, behavior: 'smooth' }); } catch(_) { window.scrollTo(0, y); }

    try {
      if (root.scrollTo) root.scrollTo({ top: y, behavior: 'smooth' });
      else root.scrollTop = y;
    } catch(_) {
      root.scrollTop = y;
    }
  }

  /* ================= Header nav anchors ================= */
  function initNavigation(){
    (document._walllnutNavHandlers||[]).forEach(function(h){ document.removeEventListener('click',h,true); });
    document._walllnutNavHandlers=[];

    function navClickHandler(e){
      var link=e.target && e.target.closest('.nav a[href^="#"]'); if(!link) return;
      var target=link.getAttribute('href'); if(!target||target==='#') return;
      e.preventDefault(); e.stopImmediatePropagation(); clearLocks(); requestAnimationFrame(function(){ smoothScrollTo(target); });
    }
    document.addEventListener('click',navClickHandler,true);
    document._walllnutNavHandlers.push(navClickHandler);

    window.addEventListener('hashchange',function(){ if(location.hash && document.querySelector(location.hash)) smoothScrollTo(location.hash); });
  }

  /* ================= Header nav highlight only ================= */
function initNavHighlightOnly() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  const links = Array.from(nav.querySelectorAll('a[href^="#"]'))
    .map(a => ({
      link: a,
      target: document.querySelector(a.getAttribute('href'))
    }))
    .filter(e => e.target);

  if (!links.length) return;

  function setActive(link) {
    links.forEach(e => {
      const isActive = e.link === link;
      e.link.classList.toggle('is-active', isActive);
    });
  }

  function onScroll() {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const offset = (document.querySelector('.header')?.offsetHeight || 0) + 60;
    let current = null;

    for (const { link, target } of links) {
      const top = target.offsetTop - offset;
      if (scrollY >= top) current = link;
      else break;
    }

    setActive(current);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();
}


  function initNavActiveLinks(){
    var nav=document.querySelector('.nav'); if(!nav) return;
    var links=Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    var pairs=links.map(function(link){
      var id=link.getAttribute('href');
      if(!id || id==='#') return null;
      var section=document.querySelector(id);
      return section? {link:link, section:section}:null;
    }).filter(Boolean);
    if(!pairs.length) return;

    function setActive(link){
      links.forEach(function(a){
        var isActive=a===link;
        a.classList.toggle('is-active',isActive);
        if(isActive) a.setAttribute('aria-current','true'); else a.removeAttribute('aria-current');
      });
    }

    function resolve(){
      var scrollPos=window.scrollY||document.documentElement.scrollTop||0;
      var header=document.querySelector('.header');
      var offset=(header? header.offsetHeight:0)+16;
      var current=null;
      pairs.forEach(function(pair){
        var top=pair.section.getBoundingClientRect().top + scrollPos;
        if(scrollPos + offset >= top) current=pair.link;
      });
      if(current) setActive(current);
      else setActive(null);
    }

    var ticking=false;
    function onScroll(){
      if(ticking) return;
      ticking=true;
      requestAnimationFrame(function(){ resolve(); ticking=false; });
    }

    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', function(){ resolve(); }, {passive:true});
    resolve();
  }

  function initHeaderScrollState(){
    var header=document.querySelector('.header');
    if(!header) return;
    function update(){
      if(window.scrollY>2) header.classList.add('header--scrolled');
      else header.classList.remove('header--scrolled');
    }
    window.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize', update, {passive:true});
    update();
  }

  function initHeaderAutoHide() {
  // 모든 디바이스에서 적용 (모바일, 태블릿, 웹)
  const header = document.querySelector('.header');
  const langBox = document.querySelector('#langDropdown');
  const heroSection = document.querySelector('#sec01, .hero');
  const scrollRoot = getScrollRoot();
  if (!header || !langBox || !scrollRoot || !heroSection) return;

  let isVisible = false;
  let ticking = false;

  function setVisible(visible) {
    if (isVisible === visible) return;

    isVisible = visible;
    header.classList.toggle('is-visible', visible);
    
    // 뷰포트 크기에 따라 다르게 처리
    const viewportWidth = window.innerWidth;
    const isMobile = viewportWidth <= 767;
    
    if (visible) {
      // visibility 관련 스타일만 제거 (CSS가 제어하도록)
      header.style.removeProperty('transform');
      header.style.removeProperty('opacity');
      header.style.removeProperty('pointer-events');
      header.style.removeProperty('visibility');
      
      // 모바일이 아닐 때는 다른 인라인 스타일도 제거
      if (!isMobile) {
        header.style.removeProperty('background');
        header.style.removeProperty('box-shadow');
        header.style.removeProperty('backdrop-filter');
        header.style.removeProperty('padding');
        header.style.removeProperty('display');
        header.style.removeProperty('flex-direction');
        header.style.removeProperty('justify-content');
        header.style.removeProperty('align-items');
        header.style.removeProperty('gap');
      }
      
      header.classList.add('header--animating');
      setTimeout(() => {
        header.classList.remove('header--animating');
      }, 400);
    } else {
      // 숨김 상태: visibility 관련 스타일만 설정
      header.style.setProperty('transform', 'translateY(-100%)', 'important');
      header.style.setProperty('opacity', '0', 'important');
      header.style.setProperty('pointer-events', 'none', 'important');
      header.style.setProperty('visibility', 'hidden', 'important');
    }
    langBox.classList.toggle('is-open', visible);
  }

  function evaluate() {
    // Hero 섹션의 위치 확인
    const heroRect = heroSection.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const scrollY = scrollRoot === document.documentElement 
      ? window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0
      : scrollRoot.scrollTop || 0;
    
    // Hero가 전체 뷰포트를 차지하는지 확인
    // 페이지 최상단에서 Hero가 뷰포트의 대부분을 차지하고 있는지 확인
    const heroTop = heroRect.top;
    const heroHeight = heroRect.height;
    
    // 페이지 최상단에서 Hero가 뷰포트를 완전히 덮고 있는지 확인
    // 1. 스크롤이 최상단에 있거나 거의 최상단에 있을 때
    // 2. Hero의 top이 0에 가깝고 (페이지 최상단에 위치)
    // 3. Hero의 높이가 viewportHeight의 90% 이상일 때 (100vw를 차지하는 경우)
    const isAtTop = scrollY <= 10; // 스크롤이 최상단에 있을 때
    const isHeroTopNearZero = heroTop >= -10 && heroTop <= 10; // Hero가 최상단에 있는지 (더 엄격)
    const isHeroFullHeight = heroHeight >= viewportHeight * 0.9; // Hero 높이가 뷰포트의 90% 이상 (100vw를 차지)
    
    // 모든 조건을 만족하면 Hero가 전체 뷰포트를 차지하는 것으로 간주
    const isHeroFullViewport = isAtTop && isHeroTopNearZero && isHeroFullHeight;
    
    // Hero가 전체 뷰포트를 차지할 때만 헤더 전체(배경 포함) 숨김
    // 그 외에는 헤더 전체(배경 포함) 표시
    if (isHeroFullViewport) {
      setVisible(false);
    } else {
      // Hero가 전체 뷰포트를 차지하지 않으면 헤더 전체 표시
      setVisible(true);
      // 스크롤 위치에 따라 배경 스타일 제어
      const isAtTopForBg = scrollY <= 5;
      header.classList.toggle('has-scrolled', !isAtTopForBg);
    }
    
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(evaluate);
    }
  }

  function onResize() {
    // 뷰포트 크기 변경 시 헤더의 모든 인라인 스타일 제거 (CSS 미디어 쿼리가 다시 적용되도록)
    const viewportWidth = window.innerWidth;
    const isMobile = viewportWidth <= 767;
    
    // 데스크톱으로 변경될 때만 모바일 전용 인라인 스타일 제거
    if (!isMobile) {
      // 헤더의 모든 인라인 스타일 제거 (visibility 관련 제외)
      const stylePropsToRemove = [
        'background',
        'box-shadow',
        'backdrop-filter',
        'padding',
        'display',
        'flex-direction',
        'justify-content',
        'align-items',
        'gap',
        'overflow-x',
        'overflow-y',
        'box-sizing',
        'width',
        'height',
        'position',
        'top',
        'z-index'
      ];
      
      stylePropsToRemove.forEach(prop => {
        header.style.removeProperty(prop);
      });
      
      // 헤더 자식 요소들의 모든 인라인 스타일 제거
      const headerLeft = header.querySelector('.header-left');
      const headerCenter = header.querySelector('.header-center');
      const headerRight = header.querySelector('.header-right');
      const headerRightGroup = header.querySelector('.header-right-group');
      
      [headerLeft, headerCenter, headerRight, headerRightGroup].forEach(el => {
        if (el) {
          el.style.cssText = '';
        }
      });
      
      // CSS 클래스를 제거했다가 다시 추가하여 스타일 강제 재적용
      const headerClasses = Array.from(header.classList);
      header.className = '';
      requestAnimationFrame(() => {
        headerClasses.forEach(cls => {
          header.classList.add(cls);
        });
        // 강제 리플로우 트리거
        void header.offsetHeight;
      });
    }
    
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(evaluate);
    }
  }

  // 초기 상태: 헤더 즉시 숨김
  header.classList.remove('is-visible');
  header.style.setProperty('transform', 'translateY(-100%)', 'important');
  header.style.setProperty('opacity', '0', 'important');
  header.style.setProperty('pointer-events', 'none', 'important');
  header.style.setProperty('visibility', 'hidden', 'important');
  isVisible = false;
  
  // 초기 상태 확인 (Hero 섹션 위치 기반)
  evaluate();
  
  scrollRoot.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
}



  /* ================= Mobile menu ================= */
  function initMobileMenu(){
    var logoMenus=$('.logo-menus'), nav=$('.nav'); if(!logoMenus||!nav) return; if($('.mobile-menu-btn')) return;
    var menuBtn=document.createElement('button');
    menuBtn.className='mobile-menu-btn'; menuBtn.type='button';
    menuBtn.setAttribute('aria-expanded','false'); menuBtn.setAttribute('aria-controls','mobile-nav'); menuBtn.setAttribute('aria-label','Toggle navigation menu');
    menuBtn.innerHTML='<span class="menu-text">Menu</span>';

    var overlay=$('.mobile-menu-overlay'); if(!overlay){ overlay=document.createElement('div'); overlay.className='mobile-menu-overlay'; document.body.appendChild(overlay); }
    nav.setAttribute('id','mobile-nav');

    var closeBtn=$('.nav-close-btn',nav); if(!closeBtn){ closeBtn=document.createElement('button'); closeBtn.className='nav-close-btn'; closeBtn.type='button'; closeBtn.setAttribute('aria-label','Close menu'); closeBtn.textContent='Close'; nav.insertBefore(closeBtn,nav.firstChild); }

    var logo=$('img',logoMenus); if(logo) logo.parentNode.insertBefore(menuBtn,logo.nextSibling); else logoMenus.appendChild(menuBtn);

    var isMenuOpen=false;
    function openMenu(){
      isMenuOpen=true;
      logoMenus.classList.add('is-open');
      nav.classList.add('is-open');
      menuBtn.classList.add('is-active');
      menuBtn.setAttribute('aria-expanded','true');
      document.documentElement.classList.add('menu-locked');
      document.body.classList.add('menu-locked');
      overlay.classList.add('is-active');
    }
    function closeMenu(){
      isMenuOpen=false;
      logoMenus.classList.remove('is-open');
      nav.classList.remove('is-open');
      menuBtn.classList.remove('is-active');
      menuBtn.setAttribute('aria-expanded','false');
      document.documentElement.classList.remove('menu-locked');
      document.body.classList.remove('menu-locked');
      overlay.classList.remove('is-active');
    }
    function toggleMenu(){ isMenuOpen ? closeMenu() : openMenu(); }

    if(!menuBtn._eventsBound){ menuBtn.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); toggleMenu(); }); menuBtn._eventsBound=true; }
    if(!closeBtn._eventsBound){ closeBtn.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); closeMenu(); }); closeBtn._eventsBound=true; }
    if(!overlay._eventsBound){ overlay.addEventListener('click',function(e){ e.preventDefault(); closeMenu(); }); overlay._eventsBound=true; }

    if(!document._mobileMenuHandlersAdded){
      document.addEventListener('keydown',function(e){ if(isMenuOpen && e.key==='Escape'){ e.preventDefault(); closeMenu(); } });
      document.addEventListener('click',function(e){ if(isMenuOpen && !logoMenus.contains(e.target)) closeMenu(); });
      window.addEventListener('resize',function(){ if(window.innerWidth>767 && isMenuOpen) closeMenu(); });
      document._mobileMenuHandlersAdded=true;
    }
  }

  /* ================= Tech panels ================= */
  // Moved to js/modules/tech-panels.js to avoid duplication
  // This function is now handled by the modular tech-panels.js implementation
  /*
  function initTechPanels() {
    var panels = $$('.tech-panel');
    if (!panels.length) return;

    function syncHeadA11y(panel) {
      var head = $('.inactive-head', panel);
      if (!head) return;
      var isActive = panel.classList.contains('is-active');
      var inactive = !isActive;

      if (inactive) {
        head.removeAttribute('hidden');
        head.removeAttribute('aria-hidden');
        head.tabIndex = 0;
        head.setAttribute('role', 'button');
      } else {
        head.setAttribute('hidden', '');
        head.setAttribute('aria-hidden', 'true');
        head.tabIndex = -1;
        head.removeAttribute('role');
      }
    }

    function activate(panel) {
      panels.forEach(function (p) {
        var active = p === panel;
        p.classList.toggle('is-active', active);
        p.setAttribute('aria-hidden', active ? 'false' : 'true');
        syncHeadA11y(p);
      });
    }

    panels.forEach(function (p) {
      var head = $('.inactive-head', p);
      if (!head || head._eventsBound) return;
      head.addEventListener('click', function (ev) { ev.stopPropagation(); activate(p); });
      head.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(p); }
      });
      head._eventsBound = true;
      syncHeadA11y(p);
    });
  }
  */

  /* ================= Service slider ================= */
  function initServiceSlider(){
    var track=$('#svc-track'); var items=$$('#svc-track .svc-item');
    if(!track || !items.length || track._sliderInitialized) return;

    var bF=$('#svc-first'), bP=$('#svc-prev'), bN=$('#svc-next'), bL=$('#svc-last');
    var idx=0, dx=0, dragging=false, startX=0, startY=0;

    track.style.touchAction='pan-y';

    function applyTransform(){ track.style.transform='translateX(calc('+ (-(idx*100)) +'% + '+ dx +'px))'; }
    function update(){ dx=0; track.style.transition='transform 320ms ease'; applyTransform(); items.forEach(function(it,i){ it.setAttribute('aria-current', i===idx?'true':'false'); }); if(bF) bF.disabled=(idx===0); if(bP) bP.disabled=(idx===0); if(bL) bL.disabled=(idx===items.length-1); if(bN) bN.disabled=(idx===items.length-1); }
    function go(n){ idx=clamp(n,0,items.length-1); update(); }

    if(bF && !bF._eventsBound){ bF.addEventListener('click',function(e){ e.stopPropagation(); go(0); }); bF._eventsBound=true; }
    if(bP && !bP._eventsBound){ bP.addEventListener('click',function(e){ e.stopPropagation(); go(idx-1); }); bP._eventsBound=true; }
    if(bN && !bN._eventsBound){ bN.addEventListener('click',function(e){ e.stopPropagation(); go(idx+1); }); bN._eventsBound=true; }
    if(bL && !bL._eventsBound){ bL.addEventListener('click',function(e){ e.stopPropagation(); go(items.length-1); }); bL._eventsBound=true; }

    function viewportWidth(){ var vp=track.parentElement; return (vp && vp.clientWidth) || window.innerWidth || 1; }
    function dragStart(x,y){ dragging=true; startX=x; startY=y; dx=0; track.style.transition='none'; track.style.willChange='transform'; }
    function dragMove(x,y,e){ if(!dragging) return; var moveX=x-startX, moveY=Math.abs(y-startY); if(Math.abs(moveX)>moveY && e && e.cancelable) e.preventDefault(); var atStart=(idx===0 && moveX>0), atEnd=(idx===items.length-1 && moveX<0); dx=(atStart||atEnd)?moveX*0.35:moveX; applyTransform(); }
    function dragEnd(){ if(!dragging) return; dragging=false; var w=viewportWidth(); var threshold=Math.min(140, Math.max(50, w*0.18)); track.style.transition='transform 320ms ease'; if(Math.abs(dx)>threshold){ if(dx<0) idx=clamp(idx+1,0,items.length-1); else idx=clamp(idx-1,0,items.length-1); } dx=0; applyTransform(); update(); track.style.willChange=''; }

    if('PointerEvent' in window){
      track.addEventListener('pointerdown',function(e){
        if(typeof e.button==='number' && e.button!==0) return;
        dragStart(e.clientX,e.clientY);
        if(track.setPointerCapture) track.setPointerCapture(e.pointerId);
      });
      window.addEventListener('pointermove',function(e){ if(dragging) dragMove(e.clientX,e.clientY,e); },{passive:false});
      window.addEventListener('pointerup',dragEnd);
      window.addEventListener('pointercancel',dragEnd);
    }else{
      track.addEventListener('touchstart',function(e){ var t=e.touches[0]; dragStart(t.clientX,t.clientY); },{passive:true});
      track.addEventListener('touchmove',function(e){ var t=e.touches[0]; dragMove(t.clientX,t.clientY,e); },{passive:false});
      track.addEventListener('touchend',dragEnd);
      track.addEventListener('mousedown',function(e){ if(e.button && e.button!==0) return; dragStart(e.clientX,e.clientY); });
      window.addEventListener('mousemove',function(e){ if(dragging) dragMove(e.clientX,e.clientY,e); });
      window.addEventListener('mouseup',dragEnd);
    }

    window.addEventListener('resize',update,{passive:true});
    update(); track._sliderInitialized=true;
  }


/* ================= Use case slider ================= */
function initUseCaseSlider(){
  var section=$('.use-cases-section');
  if(!section) return;

  var slider=$('.use-case-slider',section);
  var viewport=$('.use-case-window',slider);
  var track=$('.use-case-track',slider);
  var items=$$('.use-case-item',track);
  if(!slider || !viewport || !track || !items.length || track._sliderInitialized) return;
  if(items.length<=1){ track.style.transform='translateX(0px)'; return; }

    var prevBtn=$('#usecase-prev',section);
    var nextBtn=$('#usecase-next',section);

  var page=0, dx=0, dragging=false, startX=0, startY=0;
  var step=0, perView=1, pageCount=Math.max(1, items.length);
  var maxOffset=0;

  items.forEach(function(item,i){
    item.setAttribute('role','group');
    item.setAttribute('aria-roledescription','slide');
    item.setAttribute('aria-label',(i+1)+' / '+items.length);
  });

  function viewportWidth(){
    return (viewport && viewport.clientWidth) || window.innerWidth || 1;
  }

  function parseGap(style){
    if(!style) return 0;
    var g=style.columnGap || style.gap || style.rowGap || '0';
    var n=parseFloat(g);
    return Number.isFinite(n)? n : 0;
  }

  function computeMetrics(){
    var first=items[0];
    var style=track? window.getComputedStyle(track):null;
    var gap=parseGap(style);
    var width=first? first.getBoundingClientRect().width:0;
    var newStep=width>0? width+gap : 0;
    var vw=viewportWidth();
    var newPerView=newStep>0? Math.max(1, Math.floor((vw+gap)/newStep)) : 1;
    var newPageCount=Math.max(1, Math.ceil(items.length / newPerView));
    var newMaxOffset=Math.max(0, (track.scrollWidth||0) - vw);
    var layoutChanged=(newPerView!==perView) || (Math.abs(newStep-step)>0.5) || (newPageCount!==pageCount) || (Math.abs(newMaxOffset-maxOffset)>0.5);
    perView=newPerView;
    step=newStep>0? newStep : width || vw;
    pageCount=newPageCount;
    maxOffset=newMaxOffset;
    if(page>pageCount-1) page=pageCount-1;
    return layoutChanged;
  }

  function firstVisibleIndex(){
    var theoretical=page*perView;
    var maxFirst=Math.max(0, items.length-perView);
    return Math.min(theoretical, maxFirst);
  }

  function baseOffset(){
    var offset=firstVisibleIndex()*step;
    return Math.min(offset, maxOffset);
  }

  function applyTransform(){
    var offset=-baseOffset() + dx;
    track.style.transform='translateX('+ offset +'px)';
  }

  function setActiveStates(){
    var start=firstVisibleIndex();
    var end=Math.min(items.length-1, start+perView-1);
    items.forEach(function(item,i){
      var active=i>=start && i<=end;
      item.setAttribute('aria-hidden',active?'false':'true');
      var card=$('.use-case',item);
      if(card) card.classList.toggle('is-active',active);
    });
      if(prevBtn) prevBtn.disabled=(page===0);
      if(nextBtn) nextBtn.disabled=(page>=pageCount-1);
  }

  function update(){
    computeMetrics();
    track.style.transition='transform 320ms ease';
    dx=0;
    applyTransform();
    setActiveStates();
  }

  function go(n){
    var target=clamp(n,0,pageCount-1);
    if(target===page){ update(); return; }
    page=target;
    update();
  }

  function dragStart(x,y){
    dragging=true; startX=x; startY=y; dx=0;
    track.style.transition='none';
    track.style.willChange='transform';
  }

  function dragMove(x,y,e){
    if(!dragging) return;
    var moveX=x-startX;
    var moveY=Math.abs(y-startY);
    if(Math.abs(moveX)>moveY && e && e.cancelable) e.preventDefault();
    var atStart=(page===0 && moveX>0);
    var atEnd=(page===pageCount-1 && moveX<0);
    dx=(atStart||atEnd)? moveX*0.35 : moveX;
    applyTransform();
  }

  function dragEnd(){
    if(!dragging) return;
    dragging=false;
    var stepForPage=step*Math.max(1,perView);
    var threshold=Math.min(Math.max(80, stepForPage*0.25), 320);
    if(Math.abs(dx)>threshold){
      page=clamp(page+(dx<0?1:-1),0,pageCount-1);
    }
    dx=0;
    track.style.willChange='';
    update();
  }

    if(prevBtn && !prevBtn._eventsBound){
      prevBtn.addEventListener('click',function(e){ e.preventDefault(); go(page-1); });
      prevBtn._eventsBound=true;
    }
    if(nextBtn && !nextBtn._eventsBound){
      nextBtn.addEventListener('click',function(e){ e.preventDefault(); go(page+1); });
      nextBtn._eventsBound=true;
    }

  track.style.touchAction='pan-y';

  if('PointerEvent' in window){
    track.addEventListener('pointerdown',function(e){
      if(typeof e.button==='number' && e.button!==0) return;
      dragStart(e.clientX,e.clientY);
      if(track.setPointerCapture) track.setPointerCapture(e.pointerId);
    });
    window.addEventListener('pointermove',function(e){ if(dragging) dragMove(e.clientX,e.clientY,e); },{passive:false});
    window.addEventListener('pointerup',dragEnd);
    window.addEventListener('pointercancel',dragEnd);
  }else{
    track.addEventListener('touchstart',function(e){ var t=e.touches[0]; dragStart(t.clientX,t.clientY); },{passive:true});
    track.addEventListener('touchmove',function(e){ var t=e.touches[0]; dragMove(t.clientX,t.clientY,e); },{passive:false});
    track.addEventListener('touchend',dragEnd);
    track.addEventListener('mousedown',function(e){ if(e.button && e.button!==0) return; dragStart(e.clientX,e.clientY); });
    window.addEventListener('mousemove',function(e){ if(dragging) dragMove(e.clientX,e.clientY,e); });
    window.addEventListener('mouseup',dragEnd);
  }

  window.addEventListener('resize',function(){
    var prevTransition=track.style.transition;
    track.style.transition='none';
    dx=0;
    computeMetrics();
    applyTransform();
    setActiveStates();
    requestAnimationFrame(function(){ track.style.transition=prevTransition||'transform 320ms ease'; });
  },{passive:true});

  track._sliderInitialized=true;
  update();
}
  /* ================= Goal accordion ================= */
  function initGoalAccordion(){
    $$('.goal-dropdown-card').forEach(function(card){
      var btn=$('.goal-dropdown-header',card), content=$('.goal-dropdown-content',card);
      if(!btn||!content) return;

      function setInitial(){ var isOpen=btn.getAttribute('aria-expanded')==='true'; card.classList.toggle('is-open',isOpen); content.style.overflow='hidden'; content.style.maxHeight=isOpen?'none':'0px'; }
      setInitial();

      content.addEventListener('transitionend',function(e){ if(e.propertyName!=='max-height') return; if(btn.getAttribute('aria-expanded')==='true') content.style.maxHeight='none'; });

      btn.addEventListener('click',function(e){
        e.stopPropagation(); var isOpen=btn.getAttribute('aria-expanded')==='true';
        if(!isOpen){ btn.setAttribute('aria-expanded','true'); card.classList.add('is-open'); content.style.maxHeight='0px'; void content.offsetHeight; content.style.maxHeight=content.scrollHeight+'px'; }
        else{ if(content.style.maxHeight==='' || getComputedStyle(content).maxHeight==='none'){ content.style.maxHeight=content.scrollHeight+'px'; void content.offsetHeight; }
          btn.setAttribute('aria-expanded','false'); card.classList.remove('is-open'); content.style.maxHeight='0px'; }
      });
    });
  }

  /* ================= Benchmark Chart ================= */
  function initBenchmarkChart(){
    var chartContainer = $('#benchmarkChart');
    if(!chartContainer) return;

    var chartDiv = document.getElementById('benchmarkChartCanvas');
    if(!chartDiv) return;

    var categoryTabs = document.querySelectorAll('.category-tab');
    if(!categoryTabs || categoryTabs.length === 0) return;

    // 카테고리별 색상 (사이트 디자인에 맞게)
    var categoryColors = {
      'ABS': '#FFFF00',        // 노랑
      'ADD_TH': '#00FFFF',     // 시안
      'ADD_VER2': '#FF00FF',   // 마젠타
      'ADD': '#12C2A5',        // 청록
      'ADD3': '#94E044',       // 라임
      'EQ': '#FF7300',         // 오렌지 (다크)
      'GATE_VEC': '#FF952D',   // 오렌지 (사이트 액센트)
      'LT': '#8F8F8F',         // 회색
      'MAX': '#94E044',        // 라임
      'NEG': '#FF00FF',        // 마젠타
      'SELECT': '#807F7F'      // 뮤트
    };

    var currentCategory = 'ABS';
    var chartData = null;
    var modalChartInstance = null;
    var clickedPoint = null; // 클릭한 포인트 정보 저장
    
    var detailBtn = document.getElementById('chartDetailBtn');
    var detailBtnText = document.getElementById('detailBtnText');
    var modal = document.getElementById('chartDetailModal');
    var modalOverlay = document.getElementById('modalOverlay');
    var modalClose = document.getElementById('modalClose');
    var modalChartDiv = document.getElementById('modalChartCanvas');

    // 데이터 로드 함수
    function loadCategoryData(category, callback){
      fetch('./data/' + category + '.json')
        .then(function(response){
          if(!response.ok) throw new Error('Failed to load data');
          return response.json();
        })
        .then(function(data){
          chartData = data;
          if(callback) callback(data);
        })
        .catch(function(error){
          console.error('Error loading category data:', error);
        });
    }

    // Plotly 차트 생성 함수
    function createChart(data){
      if(!data) return;

      // 데이터를 배열로 변환 (키 순서대로)
      var keys = Object.keys(data).map(function(k){ return parseInt(k); }).sort(function(a, b){ return a - b; });
      var xValues = keys;
      var yValues = keys.map(function(k){ return data[String(k)]; });

      var trace = {
        x: xValues,
        y: yValues,
        type: 'scatter',
        mode: 'lines+markers',  // 마커 추가하여 클릭 가능하게
        name: currentCategory,
        line: {
          color: categoryColors[currentCategory] || '#FFFFFF',
          width: 2
        },
        marker: {
          size: 8,  // 클릭 가능하도록 마커 크기 설정
          color: categoryColors[currentCategory] || '#FFFFFF',
          opacity: 0,  // 투명하게 하여 보이지 않게
          line: {
            width: 0
          }
        },
        hovertemplate: '<b>%{fullData.name}</b><br>X: %{x}<br>Y: %{y:.2f} ms<extra></extra>'
      };

      var layout = {
        autosize: true,
        margin: {
          l: 60,
          r: 20,
          t: 20,
          b: 60,
          pad: 4
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: {
          family: 'Pretendard, sans-serif',
          size: 12,
          color: '#FFFFFF'
        },
        xaxis: {
          title: {
            text: 'Bit Depth / Parameter',
            font: {
              size: 14,
              color: '#FFFFFF'
            }
          },
          gridcolor: 'rgba(255, 255, 255, 0.1)',
          gridwidth: 1,
          tickfont: {
            color: '#FFFFFF',
            size: 12
          },
          showline: false
        },
        yaxis: {
          title: {
            text: 'Performance (ms)',
            font: {
              size: 14,
              color: '#FFFFFF'
            }
          },
          gridcolor: 'rgba(255, 255, 255, 0.1)',
          gridwidth: 1,
          tickfont: {
            color: '#FFFFFF',
            size: 12
          },
          showline: false
        },
        showlegend: false,
        hovermode: 'x unified'
      };

      var config = {
        displayModeBar: false,
        responsive: true
      };

      Plotly.newPlot(chartDiv, [trace], layout, config);
      
      // 차트 클릭 이벤트 추가
      chartDiv.on('plotly_click', function(data){
        if(data && data.points && data.points.length > 0){
          var point = data.points[0];
          clickedPoint = {
            x: point.x,
            y: point.y,
            pointNumber: point.pointNumber
          };
          // 모달 열기
          openModal();
        }
      });
      
      // 디테일 버튼 표시 및 텍스트 업데이트
      if(detailBtn){
        detailBtn.style.display = 'inline-flex';
        if(detailBtnText){
          detailBtnText.textContent = currentCategory + ' Details';
        }
      }
    }
    
    // 뷰포트 리사이즈 시 차트 크기 재조정
    var resizeTimeout;
    function handleResize(){
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function(){
        if(chartDiv && chartData){
          try{
            Plotly.Plots.resize(chartDiv);
          } catch(e){
            console.warn('Chart resize error:', e);
          }
        }
        if(modalChartDiv && modal && modal.classList.contains('is-open')){
          try{
            Plotly.Plots.resize(modalChartDiv);
          } catch(e){
            console.warn('Modal chart resize error:', e);
          }
        }
      }, 150);
    }
    
    window.addEventListener('resize', handleResize);
    
    // 모달 내부 상세 차트 생성 함수
    function createModalChart(data){
      if(!data || !modalChartDiv) return;

      // 데이터를 배열로 변환 (키 순서대로)
      var keys = Object.keys(data).map(function(k){ return parseInt(k); }).sort(function(a, b){ return a - b; });
      var xValues = keys;
      var yValues = keys.map(function(k){ return data[String(k)]; });

      var trace = {
        x: xValues,
        y: yValues,
        type: 'scatter',
        mode: 'lines+markers',
        name: currentCategory,
        line: {
          color: categoryColors[currentCategory] || '#FFFFFF',
          width: 3
        },
        marker: {
          size: 6,
          color: categoryColors[currentCategory] || '#FFFFFF',
          line: {
            color: '#FFFFFF',
            width: 1
          }
        },
        hovertemplate: '<b>%{fullData.name}</b><br>X: %{x}<br>Y: %{y:.2f} ms<extra></extra>'
      };
      
      // 클릭한 포인트 강조 표시를 위한 annotation
      var annotations = [];
      if(clickedPoint){
        annotations.push({
          x: clickedPoint.x,
          y: clickedPoint.y,
          text: '<b>Selected Point</b><br>X: ' + clickedPoint.x + '<br>Y: ' + clickedPoint.y.toFixed(2) + ' ms',
          showarrow: true,
          arrowhead: 2,
          arrowsize: 1.5,
          arrowwidth: 2,
          arrowcolor: '#FF7300',
          ax: 0,
          ay: -40,
          bgcolor: 'rgba(255, 115, 0, 0.8)',
          bordercolor: '#FFFFFF',
          borderwidth: 1,
          font: {
            color: '#FFFFFF',
            size: 12,
            family: 'Pretendard, sans-serif'
          }
        });
      }

      var layout = {
        autosize: true,
        margin: {
          l: 80,
          r: 40,
          t: 40,
          b: 80,
          pad: 4
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: {
          family: 'Pretendard, sans-serif',
          size: 14,
          color: '#FFFFFF'
        },
        xaxis: {
          title: {
            text: 'Bit Depth / Parameter',
            font: {
              size: 16,
              color: '#FFFFFF'
            }
          },
          gridcolor: 'rgba(255, 255, 255, 0.15)',
          gridwidth: 1,
          tickfont: {
            color: '#FFFFFF',
            size: 13
          },
          showline: true,
          linecolor: 'rgba(255, 255, 255, 0.3)'
        },
        yaxis: {
          title: {
            text: 'Performance (ms)',
            font: {
              size: 16,
              color: '#FFFFFF'
            }
          },
          gridcolor: 'rgba(255, 255, 255, 0.15)',
          gridwidth: 1,
          tickfont: {
            color: '#FFFFFF',
            size: 13
          },
          showline: true,
          linecolor: 'rgba(255, 255, 255, 0.3)'
        },
        showlegend: false,
        hovermode: 'x unified',
        annotations: annotations
      };
      
      // 클릭한 포인트로 줌 (선택적)
      if(clickedPoint){
        layout.xaxis.range = [Math.max(0, clickedPoint.x - 10), clickedPoint.x + 10];
        layout.yaxis.range = [Math.max(0, clickedPoint.y - 20), clickedPoint.y + 20];
      }

      var config = {
        displayModeBar: true,
        responsive: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d']
      };

      if(modalChartInstance){
        Plotly.purge(modalChartDiv);
      }
      
      Plotly.newPlot(modalChartDiv, [trace], layout, config);
      modalChartInstance = modalChartDiv;
      
      // 클릭한 포인트로 스크롤 (선택적)
      if(clickedPoint){
        setTimeout(function(){
          try{
            Plotly.relayout(modalChartDiv, {
              'xaxis.range': [Math.max(0, clickedPoint.x - 10), clickedPoint.x + 10],
              'yaxis.range': [Math.max(0, clickedPoint.y - 20), clickedPoint.y + 20]
            });
          } catch(e){
            console.warn('Modal chart zoom error:', e);
          }
        }, 100);
      }
      
      // 모달이 열린 후 차트 크기 재조정
      setTimeout(function(){
        try{
          Plotly.Plots.resize(modalChartDiv);
        } catch(e){
          console.warn('Modal chart resize error:', e);
        }
      }, 100);
    }
    
    // 모달 열기 함수
    function openModal(){
      if(!modal || !chartData) return;
      
      // 모달 제목 업데이트
      var modalTitle = document.getElementById('modalTitle');
      if(modalTitle){
        modalTitle.textContent = currentCategory + ' - Detailed Benchmark';
      }
      
      // 모달 내부 차트 생성
      createModalChart(chartData);
      
      // hero 컨트롤 숨기기
      var heroControls = document.querySelector('.hero-slider-controls');
      if(heroControls){
        heroControls.style.display = 'none';
      }
      
      // 모달 표시
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    
    // 모달 닫기 함수
    function closeModal(){
      if(!modal) return;
      
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      
      // hero 컨트롤 다시 보이기
      var heroControls = document.querySelector('.hero-slider-controls');
      if(heroControls){
        heroControls.style.display = '';
      }
      
      // 모달 차트 정리
      if(modalChartDiv){
        Plotly.purge(modalChartDiv);
        modalChartInstance = null;
      }
      
      // 클릭한 포인트 정보 초기화
      clickedPoint = null;
    }

    // 카테고리 탭 클릭 이벤트
    categoryTabs.forEach(function(tab){
      tab.addEventListener('click', function(){
        var category = this.getAttribute('data-category');
        if(category === currentCategory) return;

        // 탭 상태 업데이트
        categoryTabs.forEach(function(t){
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        this.classList.add('is-active');
        this.setAttribute('aria-selected', 'true');

        currentCategory = category;

        // 데이터 로드 및 차트 업데이트
        loadCategoryData(category, function(data){
          createChart(data);
        });
      });
    });

    // 디테일 버튼 클릭 이벤트
    if(detailBtn){
      detailBtn.addEventListener('click', function(){
        openModal();
      });
    }
    
    // 모달 닫기 이벤트
    if(modalClose){
      modalClose.addEventListener('click', function(){
        closeModal();
      });
    }
    
    if(modalOverlay){
      modalOverlay.addEventListener('click', function(){
        closeModal();
      });
    }
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && modal && modal.classList.contains('is-open')){
        closeModal();
      }
    });
    
    // 초기 차트 생성 (ABS)
    loadCategoryData('ABS', function(data){
      createChart(data);
      // 첫 번째 탭 활성화
      if(categoryTabs[0]){
        categoryTabs[0].classList.add('is-active');
        categoryTabs[0].setAttribute('aria-selected', 'true');
      }
    });
  }

  /* ================= 초기화 ================= */
  function init(){
    // i18n 제외 마크
    $$('.material-icons, .material-icons *, .svc-cont, .svc-cont *').forEach(function(el){
      el.setAttribute('data-no-i18n',''); if(el.hasAttribute('data-i18n')) el.removeAttribute('data-i18n');
    });

    var langBtn=$('#langBtn');
    if(langBtn && !langBtn.getAttribute('aria-controls')) langBtn.setAttribute('aria-controls','langMenu');

    // === Tech-A 강조 (strong/tail 분리) ===
    (function bindTechA(){
      function FT(n){
        return $('#panel-a .tech-body li:nth-of-type('+n+') .front-text')
            || $('#panel-a .tech-body li:nth-of-type('+n+') .fron-text');
      }
      bindThreeParts(FT(1), '', 'highlight.float',       'pA.kf1.tail');
      bindThreeParts(FT(2), '', 'highlight.float.short', 'pA.kf2.tail');
      bindThreeParts(FT(3), '', 'highlight.boot',        'pA.kf3.tail');
    })();

    // === Tech-B 강조 (pre/strong/tail 부분 번역) ===
    (function bindTechB(){
      function PB(n){ return '#panel-b .tech-body li:nth-of-type('+n+') .front-text'; }
      bindThreeParts($(PB(1)), 'pB.hl1.pre', 'pB.hl1.strong', 'pB.hl1.tail');
      bindThreeParts($(PB(2)), 'pB.hl2.pre', 'pB.hl2.strong', 'pB.hl2.tail');
      bindThreeParts($(PB(3)), 'pB.hl3.pre', 'pB.hl3.strong', 'pB.hl3.tail');
      bindThreeParts($(PB(4)), 'pB.hl4.pre', 'pB.hl4.strong', 'pB.hl4.tail');
    })();

    // i18n 자동 바인딩/적용
    autowireBySelectors();
    autowireByTextMatch();

    var initial = 'en';
    var urlLang = new URLSearchParams(location.search).get('lang');
    if (urlLang === 'ko' || urlLang === 'en') initial = urlLang;
    setLanguage(initial);

    // 메뉴/언어
    var langMenu=$('#langMenu');
    if(langBtn && langMenu){
      langBtn.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); langBtn.getAttribute('aria-expanded')==='true' ? closeLangMenu() : openLangMenu(); });
      langBtn.addEventListener('keydown',function(e){ if(e.key==='ArrowDown'||e.key==='Enter'||e.key===' '){ e.preventDefault(); e.stopPropagation(); openLangMenu(); } });
      langMenu.addEventListener('click',function(e){ e.stopPropagation(); var li=e.target.closest('[role="option"]'); if(li) chooseLang(li); });
    }

    $$('.lang-toggle-btn').forEach(function(btn){
      if(btn._langBound) return;
      btn.addEventListener('click',function(e){
        e.preventDefault();
        var lang=btn.getAttribute('data-lang');
        if(lang) setLanguage(lang);
      });
      btn.addEventListener('keydown',function(e){
        if(e.key==='Enter' || e.key===' '){
          e.preventDefault();
          var lang=btn.getAttribute('data-lang');
          if(lang) setLanguage(lang);
        }
      });
      btn._langBound=true;
    });

    // 벤치마킹 버튼 이벤트는 index.html에서 직접 처리하므로 여기서는 제거
    // var ecosystemBtn=$('.ecosystem-btn');
    // if(ecosystemBtn && !ecosystemBtn._heroTriggerBound){
    //   var triggerSlide=function(e){
    //     if(e) e.preventDefault();
    //     document.dispatchEvent(new CustomEvent('hero:request-slide',{detail:{index:1}}));
    //   };
    //   ecosystemBtn.addEventListener('click',triggerSlide);
    //   ecosystemBtn.addEventListener('keydown',function(e){
    //     if(e.key==='Enter' || e.key===' '){
    //       triggerSlide(e);
    //     }
    //   });
    //   ecosystemBtn._heroTriggerBound=true;
    // }

    // Benchmark Chart 초기화
    initBenchmarkChart();

    var versionBtn=$('#versionBtn');
    var versionMenu=$('#versionMenu');
    if(versionBtn && !versionBtn.getAttribute('aria-controls')) versionBtn.setAttribute('aria-controls','versionMenu');
    if(versionMenu){
      versionMenu.hidden=true;
      versionMenu.style.display='none';
    }
    if(versionBtn && versionMenu && !versionBtn._versionBound){
      var versionLabel=versionBtn.querySelector('.version-label');
      var ensureVersionLabel=function(){
        var selected=versionMenu.querySelector('[aria-selected="true"]');
        if(!selected){
          var options=$$('#versionMenu [role="option"]');
          selected=options[0];
        }
        if(selected && versionLabel){
          var nameEl=selected.querySelector('.version-name');
          var text=nameEl ? nameEl.textContent.trim() : (selected.getAttribute('data-version')||'');
          if(text) versionLabel.textContent=text;
        }
        if(selected){
          var selectedVersionAttr=selected.getAttribute('data-version');
          if(selectedVersionAttr) currentGalleryVersion=selectedVersionAttr;
        }
      };
      var closeVersionMenu=function(){
        versionBtn.setAttribute('aria-expanded','false');
        versionMenu.hidden=true;
        versionMenu.style.display='none';
        versionMenu.style.left='';
        versionMenu.style.top='';
        versionMenu.style.maxHeight='';
        $$('#versionMenu .focused').forEach(function(li){ li.classList.remove('focused'); });
      };
      var moveVersionFocus=function(dir){
        if(versionMenu.hidden) return;
        var list=$$('#versionMenu [role="option"]');
        if(!list.length) return;
        var idx=list.findIndex(function(li){ return li.classList.contains('focused'); });
        if(idx<0) idx=list.findIndex(function(li){ return li.getAttribute('aria-selected')==='true'; });
        var next=(idx<0?0:(idx+dir+list.length)%list.length);
        list.forEach(function(li){ li.classList.remove('focused'); });
        list[next].classList.add('focused');
        list[next].scrollIntoView({block:'nearest'});
      };
      var chooseVersion=function(option){
        if(!option) return;
        $$('#versionMenu [role="option"]').forEach(function(li){
          li.setAttribute('aria-selected', li===option ? 'true' : 'false');
          li.classList.remove('focused');
        });
        var selectedValue=option.getAttribute('data-version');
        if(versionLabel){
          var name=option.querySelector('.version-name');
          var labelText=name ? name.textContent.trim() : (option.getAttribute('data-version')||'');
          if(labelText) versionLabel.textContent=labelText;
        }
        if(selectedValue) currentGalleryVersion=selectedValue;
        closeVersionMenu();
        versionBtn.focus();
        // if(galleryConfig.ready) updateGalleryImage();
      };
      var openVersionMenu=function(){
        versionBtn.setAttribute('aria-expanded','true');
        versionMenu.hidden=false;
        versionMenu.style.display='block';
        versionMenu.style.right='auto';
        var rect=versionBtn.getBoundingClientRect();
        var gap=8;
        var width=Math.max(rect.width,220);
        var left=rect.left;
        if(left+width>window.innerWidth-16){
          left=Math.max(16,window.innerWidth-width-16);
        }
        if(left<16) left=16;
        var top=rect.bottom+gap;
        versionMenu.style.minWidth=width+'px';
        versionMenu.style.left=Math.round(left)+'px';
        versionMenu.style.top=Math.round(top)+'px';
        versionMenu.style.maxHeight=Math.max(120,window.innerHeight-top-16)+'px';
        var menuRect=versionMenu.getBoundingClientRect();
        if(menuRect.bottom>window.innerHeight-8){
          var adjustedTop=Math.max(16,rect.top-menuRect.height-gap);
          versionMenu.style.top=Math.round(adjustedTop)+'px';
        }
        var items=$$('#versionMenu [role="option"]');
        items.forEach(function(li){ li.classList.remove('focused'); });
        var current=versionMenu.querySelector('[aria-selected="true"]')||items[0];
        if(current) current.classList.add('focused');
        if(!document._versionDocClick){
          document._versionDocClick=function(e){
            if(versionMenu.hidden) return;
            if(!versionMenu.contains(e.target) && !versionBtn.contains(e.target)){
              closeVersionMenu();
            }
          };
          document.addEventListener('click',document._versionDocClick,true);
        }
        if(!document._versionKeydown){
          document._versionKeydown=function(e){
            if(versionMenu.hidden) return;
            if(e.key==='ArrowDown'){ e.preventDefault(); moveVersionFocus(1); }
            else if(e.key==='ArrowUp'){ e.preventDefault(); moveVersionFocus(-1); }
            else if(e.key==='Enter' || e.key===' '){ e.preventDefault(); var focused=versionMenu.querySelector('.focused'); chooseVersion(focused||versionMenu.querySelector('[aria-selected="true"]')); }
            else if(e.key==='Escape'){ e.preventDefault(); closeVersionMenu(); versionBtn.focus(); }
          };
          document.addEventListener('keydown',document._versionKeydown);
        }
      };
      ensureVersionLabel();
      var showVersionComingSoon=function(){
        if(typeof window.alert==='function') window.alert('Coming soon!');
        else console.log('Coming soon!');
      };
      versionBtn.addEventListener('click',function(e){
        e.preventDefault();
        e.stopPropagation();
        showVersionComingSoon();
      });
      versionBtn.addEventListener('keydown',function(e){
        if(e.key==='Enter' || e.key===' ' || e.key==='ArrowDown' || e.key==='ArrowUp'){
          e.preventDefault();
          showVersionComingSoon();
        }else if(e.key==='Escape' && !versionMenu.hidden){
          e.preventDefault();
          closeVersionMenu();
        }
      });
      versionMenu.addEventListener('click',function(e){
        e.stopPropagation();
        var option=e.target.closest('[role="option"]');
        if(option) chooseVersion(option);
      });
      versionBtn._versionBound=true;
    }

    /*
    if(!galleryConfig.ready){
      galleryConfig.container=document.querySelector('.result-image-area');
      galleryConfig.image=document.getElementById('versionImage');
      galleryConfig.loading=document.querySelector('.result-image-area .loading-text');
      galleryConfig.placeholder=document.querySelector('.result-image-area .result-placeholder');
      if(versionMenu){
        var defaultOption=versionMenu.querySelector('[aria-selected="true"]')||versionMenu.querySelector('[role="option"]');
        if(defaultOption){
          var defaultVersionAttr=defaultOption.getAttribute('data-version');
          if(defaultVersionAttr) currentGalleryVersion=defaultVersionAttr;
        }
      }
      galleryConfig.ready=!!galleryConfig.container;
    }
    // if(galleryConfig.ready) updateGalleryImage();
    */

// 공통 인터랙션
initHeaderScrollState();
initNavigation();
initNavHighlightOnly();   // 👈 여기에 정확히 위치
// initGoalAccordion(); // Using js/modules/goal-dropdowns.js instead
// initTechPanels(); // Using js/modules/tech-panels.js instead
initServiceSlider();
initUseCaseSlider();


// 이 아래에 두기 👇
initHeaderAutoHide();

// 애니메이션
initHighlightAnim();


    if(!window._walllnutResizeHandlerAdded){
      window.addEventListener('resize',function(){
        var overlay=$('.mobile-menu-overlay'); if(overlay) overlay.classList.remove('is-active');
        var logoMenus=$('.logo-menus'); if(logoMenus) logoMenus.classList.remove('is-open');
        var nav=$('.nav'); if(nav) nav.classList.remove('is-open');
        var menuBtn=$('.mobile-menu-btn'); if(menuBtn){ menuBtn.classList.remove('is-active'); menuBtn.setAttribute('aria-expanded','false'); }
        document.documentElement.classList.remove('menu-locked');
        document.body.classList.remove('menu-locked');
      },{passive:true});
      window._walllnutResizeHandlerAdded=true;
    }

    if (location.search.includes('debug')) {
      var r = (function(){
        var cands=[document.scrollingElement||null,document.documentElement,document.body,document.querySelector('#main'),document.querySelector('main')].filter(Boolean);
        return cands[0];
      })();
      console.log('[debug:scroll-root]', {
        y: (window.pageYOffset || window.scrollY || r.scrollTop || 0),
        h: r.scrollHeight,
        ch: r.clientHeight,
        overflowY: getComputedStyle(r).overflowY
      });
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();

})();

(function(){
  'use strict';
  var $ = function(s, r){ return (r||document).querySelector(s); };
  var $$ = function(s, r){ return Array.from((r||document).querySelectorAll(s)); };

  var hero   = $('#sec01-hero');
  if (!hero) return;
  var btn    = $('#heroToggleBtn', hero);
  var lockEl = $('#heroLockIcon', hero);
  var title  = $('.hero-title img', hero);
  var chars  = $$('.hero-characters .char', hero);

  /* ---- initial state ---- */
  hero.classList.add('is-locked');   // locked → 노이즈 on
  if (btn) btn.dataset.state = 'locked';

  /* ---- lock/open toggle ---- */
  function setLocked(v){
    hero.classList.toggle('is-locked', v);
    hero.classList.toggle('is-open', !v);
    if (btn){
      btn.dataset.state = v ? 'locked' : 'open';
      btn.setAttribute('aria-pressed', String(!v));
      $('.btn-text', btn).textContent = v ? 'Lock' : 'Open';
    }
    if (lockEl){
      var next = v ? lockEl.getAttribute('data-src-locked') : lockEl.getAttribute('data-src-open');
      if (next) lockEl.src = next;
    }
  }
  if (btn && !btn._bound){
    btn.addEventListener('click', function(e){
      e.preventDefault();
      setLocked(btn.dataset.state !== 'locked' ? true : false); // toggle
    });
    btn._bound = true;
  }

  /* ---- characters MUST touch top/bottom=0; left/right random offsets ---- */
  function placeCornerCharacters(){
    var vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    // 가로 여백 범위 (뷰포트 비율에 따라 가변)
    var min = Math.round(vw * 0.04);
    var max = Math.round(vw * 0.14);
    function rnd(a,b){ return Math.round(a + Math.random()*(b-a)); }

    // CSS 변수로 offset 주입 (요소는 top/bottom=0 보장)
    hero.style.setProperty('--char-left-a',  rnd(min, max) + 'px');
    hero.style.setProperty('--char-right-b', rnd(min, max) + 'px');
    hero.style.setProperty('--char-left-c',  rnd(min, max) + 'px');
    hero.style.setProperty('--char-right-d', rnd(min, max) + 'px');
  }
  placeCornerCharacters();
  window.addEventListener('resize', throttle(placeCornerCharacters, 200), {passive:true});

  /* ---- 3-프레임 스프라이트 애니메이션 (cha01/02/03) ---- */
  function startSprite(el){
    var frames = [el.getAttribute('data-f1'), el.getAttribute('data-f2'), el.getAttribute('data-f3')].filter(Boolean);
    if (frames.length < 2) return;
    var i = 0;
    var delay = 220 + Math.round(Math.random()*120); // 약간 랜덤
    function tick(){
      i = (i+1) % frames.length;
      // 이미 로딩된 동일 src면 교체 생략
      if (el.src.indexOf(frames[i]) === -1) el.src = frames[i];
      el._spriteTimer = setTimeout(tick, delay);
    }
    tick();
  }
  chars.forEach(startSprite);

  /* ---- helpers ---- */
  function throttle(fn, wait){
    var t=0, lastArgs=null;
    return function(){
      lastArgs = arguments;
      if (t) return;
      t = setTimeout(function(){ t=0; fn.apply(null, lastArgs); }, wait);
    };
  }

})();
