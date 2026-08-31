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
      'nav.solution.fhe16': 'FHE16',
      'nav.tech': 'Technology',
      'nav.service': 'Service',
      'nav.goal': 'Goal',
      'nav.team': 'Team',
      'nav.advisors': 'Advisors',
      'hero.headline': 'waLLLnut turns private data into business decisions across B2C demand, B2B risk, and blockchain infrastructure<br>without exposing the raw data.',
      'hero.track.a.title': 'B2C Demand Forecasting',
      'hero.track.a.desc': 'Paid demand report, price range, launch quantity, 2026 Coming Soon',
      'hero.track.b.title': 'B2B PET Risk Intelligence',
      'hero.track.b.desc': 'Private checks for identity, insurance, FDS, and anomalous transactions',
      'hero.track.c.title': 'Blockchain Confidential Infrastructure',
      'hero.track.c.desc': 'Confidential computation modules for blockchain applications',
      'sec02.slogan': 'Compute on sensitive signals without exposing raw data.<br>FHE16, MPC, and threshold disclosure support consumer demand, enterprise risk, and blockchain confidentiality.',
      'slogan': 'waLLLnut builds PET infrastructure for consumer demand forecasting, enterprise risk intelligence, and blockchain confidentiality.',
      'sec.tech': '04. Technology Moat',
      'sec.service': '03. Business Tracks',
      'sec.team': '06. Team',
      
      
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
      'svc.1.desc': 'Convert private willingness-to-pay and launch demand into <strong>pricing, allocation, and restock decisions</strong>. Product name undisclosed. Launching in 2026.',
      'svc.1.meta.title2': 'B2C',
      'svc.1.meta.ref': '2026 Coming Soon',
      'svc.2.desc': 'Support insurance claim cross-check, FDS, identity mismatch, and anomalous transaction workflows <strong>without exposing raw business data.</strong>',
      'svc.2.meta.title2': 'B2B',
      'svc.2.meta.ref': 'PET-based risk intelligence',
      'svc.3.desc': 'Package confidential state, encrypted execution, and threshold disclosure into <strong>developer-facing blockchain infrastructure</strong>.',
      'svc.3.meta.title2': 'Blockchain',
      'svc.3.meta.ref': 'Confidential modules with public verification',
      'svc.4.desc': 'Reveal only the minimum result needed for audit, compliance, or network verification.',
      'svc.4.meta.title2': 'Threshold',
      'svc.4.meta.ref': 'Disclosure by policy, not by default',
      'goal.caption': 'waLLLnut applies FHE16, MPC, and threshold disclosure across consumer demand, enterprise risk, and blockchain confidential infrastructure.',
      'goal.q1': 'What business is waLLLnut building?',
      'goal.a1': 'waLLLnut builds products for markets where useful data is too sensitive to expose. A is a paid B2C demand and allocation product, B is private enterprise risk checking, and C is confidential blockchain infrastructure.',
      'goal.q2': 'Why this strategy now?',
    'goal.a2': 'Each market has the same business blocker: decisions need sensitive data, but the raw data cannot move. FHE16 and MPC let waLLLnut sell the decision layer while the data stays private.',
      'goal.hash.disclose': 'f321ce2f5032c6d408f553606755b51378366c99adfa37337c95c1a330577139',
      'goal.q3': 'What is the public A/B/C plan?',
      'goal.a3.1': 'A. B2C Demand Forecasting & Allocation - private demand survey, pricing/allocation report, 2026 Coming Soon.',
      'goal.a3.2': 'B. B2B PET Risk Intelligence - insurance claim cross-check, FDS, identity and anomalous transaction detection without raw data exposure.',
      'goal.a3.3': 'C. Blockchain Confidential Infrastructure - encrypted state, confidential execution, threshold disclosure, and public verifiability.',
    'summary.headline': 'Investment thesis: one privacy engine, three product markets.',
    'summary.body': 'We enter with a near-term B2C demand product, extend the same PET engine into enterprise risk checks, and compound the technical core into blockchain confidentiality infrastructure.',
    'summary.status.entry.label': 'Entry wedge',
    'summary.status.entry.value': 'A. B2C demand',
    'summary.status.launch.label': 'Launch status',
    'summary.status.launch.value': '2026 Coming Soon',
    'summary.status.engine.label': 'Technical moat',
    'summary.status.engine.value': 'FHE16 런타임 + MPC 키 레이어',
    'summary.status.rule.label': 'Trust promise',
    'summary.status.rule.value': 'Raw data does not leave owner',
    'summary.status.validation.label': 'Public validation',
    'summary.status.validation.value': 'Solana 3rd · Mantle final-five voting stage · Public GitHub source',
    'summary.table.track': 'Track',
    'summary.table.customer': 'Customer',
    'summary.table.output': 'Product output',
    'summary.table.revenue': 'Revenue path',
    'summary.table.status': 'Public status',
    'summary.a.title': 'B2C Demand Forecasting & Allocation',
    'summary.a.customer': 'Limited-drop sellers, creators, IP and brand teams',
    'summary.a.output': 'Paid demand report: expected demand, price range, launch quantity, inventory risk',
    'summary.a.revenue': 'Report fee first; seller tools, transaction fee, premium analytics later',
    'summary.a.status': '2026 Coming Soon',
    'summary.b.title': 'B2B PET Risk Intelligence',
    'summary.b.customer': 'Insurers, financial institutions, platforms with fraud exposure',
    'summary.b.output': 'Private cross-check for claims, identity mismatch, FDS, and anomalous transactions',
    'summary.b.revenue': 'Use-case design first; subscription or per-check pricing after validation',
    'summary.b.status': 'Use-case validation track',
    'summary.c.title': 'Blockchain Confidential Infrastructure',
    'summary.c.customer': 'Chains, dApps, and infrastructure teams needing confidentiality',
    'summary.c.output': 'Encrypted state, confidential execution, threshold disclosure modules',
    'summary.c.revenue': 'SDK, integration support, and infrastructure modules',
    'summary.c.status': 'Solana 3rd · Mantle final-five voting stage',
      'usecases.title': 'Business Model & GTM',
      'use1.title': 'A. Consumer Demand Intelligence',
      'use1.desc': 'Closed demand survey, private willingness-to-pay analysis, and launch quantity reports. Revenue path: report fee, transaction fee, premium seller tools, and later authenticity/fulfillment modules. 2026 Coming Soon.',
      'use2.title': 'B. Enterprise Risk Intelligence',
      'use2.desc': 'Insurance claim cross-validation, FDS, identity mismatch, and anomalous transaction screening without moving raw customer data. GTM path: PoC design, validation, then subscription or per-check pricing.',
      'use3.title': 'C. Confidential Chain Infrastructure',
      'use3.desc': 'Developer-facing modules for confidential state, encrypted execution, and threshold disclosure. Revenue path: infrastructure integration, SDK support, and partner deployments.',
      'use4.title': 'Threshold Disclosure',
      'use4.desc': 'Reveal only the minimum result required for audit or verification.',
      'prop.f1': 'A creates the first market wedge: privacy-preserving demand reports for consumer launches and allocation planning',
      'prop.f2': 'B converts the same PET engine into enterprise validation workflows for insurance claim review, identity risk, FDS, and anomalous transactions',
      'prop.f3': 'C packages the engine as confidential blockchain infrastructure for encrypted state, threshold disclosure, and verifiable execution',
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
      'nav.benchmark': 'Benchmark',
    'nav.benchmarkLab': 'Benchmark Lab',
    'nav.petEngine': 'PET Engine',
    'nav.abcTracks': 'A / B / C Tracks',
    'nav.current': 'Current Team',
    'nav.alumni': 'Alumni',
    'nav.research': 'Research',
    'nav.publications': 'Publications',
    'nav.papers': 'Papers',
    'nav.press': 'Press',
    'nav.traction': 'Traction',
    'nav.track.a': 'A. B2C',
    'nav.track.b': 'B. B2B',
    'nav.track.c': 'C. Blockchain',
    'sidebar.archive': 'Our Archive',
    'sidebar.alumniCommunity': 'Alumni Community',
    'sidebar.ir': 'IR',
    'sidebar.sns': 'Our SNS',
    'problem.label': '01. Market Problem',
    'problem.title': 'Private data blocks decisions; waLLLnut turns it into business signals without exposing raw data',
    'problem.desc': 'PET lets companies compute together without revealing the underlying data.<br>waLLLnut packages that engine into demand intelligence, risk validation, and confidential blockchain infrastructure.',
    'pet.kicker': 'PET Primer',
    'pet.title': 'PET keeps sensitive data useful without making it visible.',
    'pet.desc': 'TEE is the easiest entry point because teams can move familiar code into secure hardware. Cryptographic PET asks harder engineering questions, but it reduces the need to trust a machine operator or hardware boundary.',
    'pet.tee.kicker': 'fast entry, hardware trust',
    'pet.tee.step1': 'Raw data enters enclave',
    'pet.tee.step2': 'Normal code computes',
    'pet.tee.step3': 'Result exits',
    'pet.tee.body': 'Low barrier and fast to prototype. Because many teams can adopt it, long-term differentiation comes from policy, deployment, and trust management rather than the primitive itself.',
    'pet.crypto.kicker': 'cryptographic privacy',
    'pet.crypto.step1': 'Data stays private',
    'pet.crypto.step2': 'Protocol computes or proves',
    'pet.crypto.step3': 'Only allowed output is revealed',
    'pet.crypto.body': 'MPC, PSI, PIR, ZK, FHE, and iO sit in this family. They are harder to build, but the security story is closer to math and protocol design than to a trusted box.',
    'pet.mpc.title': 'Joint computation',
    'pet.mpc.body': "Several parties compute one result without exposing each party's input.",
    'pet.psi.title': 'Private matching',
    'pet.psi.body': 'Find overlap between datasets without revealing non-matching records.',
    'pet.pir.title': 'Private retrieval',
    'pet.pir.body': 'A user reads one item without revealing which item was requested.',
    'pet.zk.title': 'Proof without disclosure',
    'pet.zk.body': 'Prove a statement is true without revealing the underlying secret data.',
    'pet.fhe.title': 'Compute while encrypted',
    'pet.fhe.body': 'Hard to implement, but optimized systems can move parts of FHE into practical latency and throughput ranges.',
    'pet.io.title': 'Hide the program',
    'pet.io.body': 'The most powerful idea conceptually, but still not practical for product workloads.',
    'pet.runway.left': 'Low implementation barrier',
    'pet.runway.right': 'Harder cryptographic engineering',
    'pet.runway.tee': 'easy to start',
    'pet.runway.psi': 'narrow, usable protocols',
    'pet.runway.mpc': 'powerful, workflow-specific',
    'pet.runway.fhe': 'practical when engineered down',
    'pet.runway.io': 'research-stage',
    'problem.a.title': 'A. Sellers still guess price and launch quantity before demand is visible',
    'problem.a.desc': 'Limited-drop, fandom, and collectible markets hide willingness-to-pay until it is too late, creating overstock, underproduction, and pricing mistakes.',
    'problem.b.title': 'B. Financial and insurance risk signals cannot easily leave each institution',
    'problem.b.desc': 'Claims, identity, account, and transaction signals are most useful when cross-checked, but privacy and regulation make raw-data sharing hard to justify.',
    'problem.c.title': 'C. Blockchains verify well, but expose too much for sensitive workflows',
    'problem.c.desc': 'Many real applications need verification plus confidentiality. Bids, credit, terms, and state values cannot always be public by default.',
    'cta.seeSolution': 'See Our Solution',
    'cta.talkToUs': 'Talk to Us',
    'section.businessTracks': '03. FHE16 Solutions',
    'solution.tab.fhe16': 'FHE16',
    'solution.tab.browser': 'A. Browser Runtime',
    'solution.tab.sdk': 'B. Device SDK',
    'solution.tab.mpc': 'C. KeyMesh MPC',
    'section.techMoat': '04. Technology Moat',
    'section.competitive': '05. Competitive Position',
    'section.team': '06. Team',
    'section.developers': '07. Developer Infrastructure',
    'section.research': '08. Research',
    'section.press': '09. Press & Media',
    'compare.title': 'Why FHE16 is the common engine behind A/B/C',
    'compare.feature': 'Feature',
    'compare.standard': 'Standard Analytics',
    'compare.zk': 'ZK Proofs',
    'compare.rawMin': 'Raw-data minimization',
    'compare.encryptedDesign': 'Encrypted by design',
    'compare.dataExposed': 'Data exposed',
    'compare.workflowSpecific': 'Strong, workflow-specific',
    'compare.provesStatements': 'Proves statements',
    'compare.hardwareTrust': 'Hardware trust',
    'compare.scoring': 'Encrypted comparison and scoring',
    'compare.coreFocus': 'Core focus',
    'compare.plaintextOnly': 'Plaintext only',
    'compare.coordination': 'Possible with coordination',
    'compare.heavyLive': 'Heavy for live scoring',
    'compare.fastTrust': 'Fast, trust-dependent',
    'compare.browserPath': 'Browser / client execution path',
    'compare.wasmPath': 'FHE16-WASM path',
    'compare.easy': 'Easy',
    'compare.dependsProtocol': 'Depends on protocol',
    'compare.proverCost': 'Prover cost',
    'compare.hardwareBound': 'Hardware-bound',
    'compare.enterprisePath': 'Enterprise validation path',
    'compare.teePsiFhe': 'TEE -> PSI -> FHE path',
    'compare.privacyLimited': 'Easy but privacy-limited',
    'compare.goodMatching': 'Good for matching',
    'compare.auditSpecific': 'Audit-specific',
    'compare.shortBridge': 'Short-term bridge',
    'compare.blockchainFit': 'Blockchain confidentiality fit',
    'compare.confState': 'Confidential state and execution',
    'compare.publicDefault': 'Public by default',
    'compare.coordinationCost': 'Coordination cost',
    'compare.verificationLayer': 'Verification layer',
    'compare.offchainTrust': 'Off-chain trust layer',
    'compare.crossMarket': 'Cross-market reuse',
    'compare.sharedEngine': 'A/B/C shared engine',
    'compare.siloed': 'Siloed systems',
    'compare.usecaseSpecific': 'Use-case specific',
    'compare.proofCircuits': 'Proof circuits per use case',
    'compare.vendorSpecific': 'Vendor-specific',
    'property.title': 'Portfolio Strategy',
    'team.intro': 'Research-grade PET execution team<br>turning FHE16 into consumer, enterprise,<br>and blockchain business tracks.',
    'ecosystem.subtitle': 'Research and technical collaboration for PET commercialization',
    'developers.title': 'Start building confidential workflows with FHE16',
    'developers.github.desc': 'Explore public source, implementation references, and research code',
    'developers.source.site.label': 'Website source',
    'developers.source.demo.label': 'FHE16 demo',
    'developers.source.web3.label': 'Web3 prototype',
    'developers.docs.desc': 'Technical guides for PET and confidential computation validation',
    'developers.sdk.desc': 'Libraries and integration modules under staged release',
    'developers.playground.desc': 'Browser execution path for encrypted comparison and demos',
    'research.title': 'Publications & Academic Collaboration',
    'research.desc': "waLLLnut's FHE16 technology has been developed through close academic collaboration with Hanyang University Coding & Communication Research Lab (CCRL).",
    'research.papers': 'Publications',
    'press.title': 'In the News',
    'contact.title': 'Contact',
    'contact.desc': 'For waLLLnut inquiries, contact us directly.',
    'contact.cta.title': 'Email',
    'contact.cta.desc': 'shlee@walllnut.com',
    'contact.button': 'shlee@walllnut.com',
    'contact.email': 'shlee@walllnut.com',
    'detail.view': 'View Details',
    'footer.bizNo.label': 'Business Registration No.',
    'footer.bizNo.value': '698-87-03144',
    'footer.location.label': 'Location',
    'footer.location.value': '222, Wangsimni-ro, Seongdong-gu, Seoul, Republic of Korea',
    'developers.docs.title': 'Documentation',
    'developers.playground.title': 'Playground',
    'research.visitLab': 'Visit Lab',
    'press.more': 'View All News',
    'advisors.title': '<strong>waLLLnut</strong>',
      'footer.copy': '© 2025 waLLLnut · All rights reserved.'
    },
    ko: {
      'lang.label': '언어',
      'nav.vision': '비전',
      'nav.solutions': '솔루션',
      'nav.solution.fhe16': 'FHE16',
      'nav.tech': '기술',
      'nav.team': '팀',
      'hero.headline': 'PET 기반 기밀 연산으로<br>B2C 수요, B2B 리스크, 블록체인 인프라를 연결합니다',
      'hero.track.a.title': 'B2C 수요 예측',
      'hero.track.a.desc': '비공개 수요 조사 · 물량/가격 리포트 · 2026 Coming Soon',
      'hero.track.b.title': 'B2B PET 리스크 인텔리전스',
      'hero.track.b.desc': '신원 이상 · 보험/거래 리스크 · PET 기반 FDS',
      'hero.track.c.title': '블록체인 기밀 연산 인프라',
      'hero.track.c.desc': '암호화 상태 · 검증 가능한 실행 · 개발자 인프라',
      'sec02.slogan': '민감 신호는 노출하지 않고 연산합니다.<br>FHE16, MPC, 임계값 공개 기술로 B2C 수요, B2B 리스크, 블록체인 기밀성을 지원합니다.',
      'slogan': 'waLLLnut은 B2C 수요 예측, B2B 리스크 인텔리전스, 블록체인 기밀 인프라를 위한 PET 기술을 만듭니다.',
      'sec.tech': '04. Technology Moat',
      'sec.service': '03. Business Tracks',
      'sec.exp': 'Business Model & GTM',
      'sec.team': '06. Team',
      

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
      'svc.1.desc': '비공개 지불 의향과 출시 수요를 <strong>가격, 물량 배분, 재입고 의사결정</strong>으로 전환합니다.',
      'svc.1.meta.title2': 'B2C',
      'svc.1.meta.ref': '2026 Coming Soon',
      'svc.2.desc': '원본 데이터를 노출하지 않고 보험 청구 교차검증, FDS, 신원 불일치, 이상 거래 선별을 지원합니다.',
      'svc.2.meta.title2': 'B2B',
      'svc.2.meta.ref': 'PET 기반 리스크 인텔리전스',
      'svc.3.desc': '기밀 상태, 암호화 실행, 임계값 공개를 <strong>개발자용 블록체인 인프라</strong>로 패키징합니다.',
      'svc.3.meta.title2': 'Blockchain',
      'svc.3.meta.ref': '공개 검증 가능한 기밀 모듈',
      'svc.4.desc': '감사, 컴플라이언스, 검증에 필요한 최소 결과만 제한적으로 공개합니다.',
      'svc.4.meta.title2': 'Threshold',
      'svc.4.meta.ref': '기본 공개가 아니라 정책 기반 공개',
      'goal.caption': 'waLLLnut은 FHE16, MPC, 임계값 공개 기술을 B2C 수요, B2B 리스크, 블록체인 기밀 인프라에 적용합니다.',
      'goal.q1': 'waLLLnut은 어떤 사업을 만드나요?',
      'goal.a1': 'waLLLnut은 유용하지만 공개할 수 없는 데이터를 대상으로 제품을 만듭니다. A는 유료 B2C 수요·물량 의사결정 제품, B는 기업 리스크 비공개 검증, C는 블록체인 기밀 인프라입니다.',
      'goal.q2': '왜 지금 이 전략인가요?',
    'goal.a2': '세 시장의 공통 병목은 같습니다. 의사결정에는 민감 데이터가 필요하지만 원본은 이동할 수 없습니다. FHE16과 MPC는 데이터는 숨긴 채 의사결정 결과만 판매할 수 있게 합니다.',
      'goal.hash.disclose': '(2025년 10월 공개 예정)',
      'goal.q3': '공개 가능한 A/B/C 계획은 무엇인가요?',
      'goal.a3.1': 'A. B2C 수요 예측 및 물량 배분 - 비공개 수요 조사, 가격/물량 리포트, 2026 Coming Soon.',
      'goal.a3.2': 'B. B2B PET 리스크 인텔리전스 - 보험 청구 교차검증, FDS, 신원 및 이상 거래 탐지',
      'goal.a3.3': 'C. 블록체인 기밀 인프라 - 암호화 상태, 기밀 실행, 임계값 공개, 공개 검증성을 함께 제공합니다.',
    'summary.headline': '투자 관점: 하나의 프라이버시 엔진을 세 개의 제품 시장으로 패키징합니다.',
    'summary.body': '가까운 B2C 수요 제품으로 진입하고, 같은 PET 엔진을 기업 리스크 검증으로 확장한 뒤, 기술 코어를 블록체인 기밀 인프라로 축적합니다.',
    'summary.status.entry.label': '초기 진입점',
    'summary.status.entry.value': 'A. B2C 수요',
    'summary.status.launch.label': '출시 상태',
    'summary.status.launch.value': '2026 Coming Soon',
    'summary.status.engine.label': '기술 방어력',
    'summary.status.engine.value': 'FHE16 런타임 + MPC 키 레이어',
    'summary.status.rule.label': '고객 약속',
    'summary.status.rule.value': '원본 데이터는 소유자 밖으로 나가지 않음',
    'summary.status.validation.label': '공개 검증',
    'summary.status.validation.value': 'Solana 3위 · Mantle 최종 5인 투표 단계 · GitHub 공개 소스',
    'summary.table.track': '트랙',
    'summary.table.customer': '고객',
    'summary.table.output': '제품 산출물',
    'summary.table.revenue': '수익 경로',
    'summary.table.status': '공개 상태',
    'summary.a.title': 'B2C 수요 예측 및 물량 배분',
    'summary.a.customer': '한정판 셀러, 크리에이터, IP·브랜드 팀',
    'summary.a.output': '유료 수요 리포트: 예상 수요, 가격대, 출시 물량, 재고 위험',
    'summary.a.revenue': '리포트 과금 우선, 이후 셀러 도구·거래 수수료·프리미엄 분석',
    'summary.a.status': '2026 Coming Soon',
    'summary.b.title': 'B2B PET 리스크 인텔리전스',
    'summary.b.customer': '보험사, 금융기관, 사기 리스크가 있는 플랫폼',
    'summary.b.output': '보험 청구, 신원 불일치, FDS, 이상 거래에 대한 비공개 교차 검증',
    'summary.b.revenue': '유스케이스 설계 우선, 검증 후 구독 또는 건별 과금',
    'summary.b.status': '유스케이스 검증 트랙',
    'summary.c.title': '블록체인 기밀 인프라',
    'summary.c.customer': '기밀성이 필요한 체인, dApp, 인프라 팀',
    'summary.c.output': '암호화 상태, 기밀 실행, 임계값 공개 모듈',
    'summary.c.revenue': 'SDK, 통합 지원, 인프라 모듈',
    'summary.c.status': 'Solana 3위 · Mantle 최종 5인 투표 단계',
      'usecases.title': '비즈니스 모델 & GTM',
      'use1.title': 'A. 소비자 수요 인텔리전스',
      'use1.desc': '폐쇄형 수요 조사, 비공개 지불 의향 분석, 출시 물량 리포트로 시작합니다. 수익 경로는 리포트 비용, 거래 수수료, 프리미엄 판매자 도구, 이후 정품/물류 모듈입니다. 2026 Coming Soon.',
      'use2.title': 'B. 기업 리스크 인텔리전스',
      'use2.desc': '원본 고객 데이터를 이동하지 않고 보험 청구 교차검증, FDS, 신원 불일치, 이상 거래 선별을 수행합니다. GTM은 PoC 설계와 검증 이후 구독 또는 건당 과금으로 이어집니다.',
      'use3.title': 'C. 블록체인 기밀 인프라',
      'use3.desc': '기밀 상태, 암호화 실행, 임계값 공개를 위한 개발자 모듈입니다. 수익 경로는 인프라 통합, SDK 지원, 파트너 배포입니다.',
      'use4.title': 'Threshold Disclosure',
      'use4.desc': '감사 또는 검증에 필요한 최소 결과만 제한적으로 공개합니다.',
      'prop.f1': 'A는 B2C 출시와 물량 계획에 필요한 프라이버시 보존 수요 리포트로 첫 시장 진입점을 만듭니다',
      'prop.f2': 'B는 같은 PET 엔진을 보험 청구 검토, 신원 리스크, FDS, 이상 거래 업무를 위한 기업 검증 워크플로로 전환합니다',
      'prop.f3': 'C는 암호화 상태, 임계값 공개, 검증 가능한 실행을 위한 블록체인 기밀 인프라로 엔진을 패키징합니다',
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
      'nav.benchmark': '벤치마크',
    'nav.benchmarkLab': '벤치마크 랩',
    'nav.petEngine': 'PET 엔진',
    'nav.abcTracks': 'A / B / C 사업 트랙',
    'nav.current': '현재 팀',
    'nav.alumni': '알럼나이',
    'nav.research': '연구',
    'nav.publications': '논문 및 연구 성과',
    'nav.papers': '논문',
    'nav.press': '언론',
    'nav.traction': '트랙션',
    'nav.track.a': 'A. B2C',
    'nav.track.b': 'B. B2B',
    'nav.track.c': 'C. 블록체인',
    'sidebar.archive': '아카이브',
    'sidebar.alumniCommunity': '알럼나이 커뮤니티',
    'sidebar.ir': 'IR',
    'sidebar.sns': 'SNS',
    'problem.label': '01. 시장 문제',
    'problem.title': '민감 데이터 때문에 멈춘 의사결정을, 원본 공개 없이 계산 가능한 사업 신호로 바꿉니다',
    'problem.desc': 'PET는 회사들이 원본 데이터를 서로 보여주지 않고도 필요한 계산만 함께 수행하게 합니다.<br>waLLLnut은 이 엔진을 수요 예측, 리스크 검증, 블록체인 기밀 인프라로 제품화합니다.',
    'pet.kicker': 'PET 한눈에 보기',
    'pet.title': 'PET는 민감 데이터를 보이지 않게 둔 채 쓸 수 있게 만드는 기술입니다.',
    'pet.desc': 'TEE는 기존 코드를 보안 하드웨어 안에 넣으면 되기 때문에 진입장벽이 낮습니다. 암호학적 PET는 구현이 어렵지만, 특정 장비나 운영자를 신뢰해야 하는 범위를 줄입니다.',
    'pet.tee.kicker': '빠른 진입, 하드웨어 신뢰',
    'pet.tee.step1': '원본 데이터가 enclave로 들어감',
    'pet.tee.step2': '일반 코드와 비슷하게 계산',
    'pet.tee.step3': '결과만 반환',
    'pet.tee.body': '진입장벽이 낮고 PoC가 빠릅니다. 많은 팀이 쉽게 시작할 수 있어서 장기 차별화는 원천 기술보다 정책, 배포, 신뢰 관리에 더 많이 걸립니다.',
    'pet.crypto.kicker': '암호학적 프라이버시',
    'pet.crypto.step1': '데이터는 비공개 유지',
    'pet.crypto.step2': '프로토콜이 계산 또는 증명',
    'pet.crypto.step3': '허용된 결과만 공개',
    'pet.crypto.body': 'MPC, PSI, PIR, ZK, FHE, iO가 이 범주입니다. 만들기는 어렵지만 신뢰 구조가 장비보다 수학과 프로토콜 설계에 가까워집니다.',
    'pet.mpc.title': '공동 계산',
    'pet.mpc.body': '여러 참여자가 각자 입력을 숨긴 채 하나의 결과를 계산합니다.',
    'pet.psi.title': '비공개 매칭',
    'pet.psi.body': '겹치는 데이터만 확인하고 매칭되지 않은 원본은 공개하지 않습니다.',
    'pet.pir.title': '비공개 조회',
    'pet.pir.body': '사용자가 어떤 항목을 조회했는지 서버가 알지 못하게 합니다.',
    'pet.zk.title': '비공개 증명',
    'pet.zk.body': '비밀 데이터는 숨기고 어떤 명제가 참이라는 사실만 증명합니다.',
    'pet.fhe.title': '암호문 위 계산',
    'pet.fhe.body': '구현은 어렵지만 최적화된 시스템은 FHE 일부를 실용 지연시간과 처리량 범위로 내릴 수 있습니다.',
    'pet.io.title': '프로그램 숨김',
    'pet.io.body': '개념적으로 가장 강력하지만 제품 워크로드에는 아직 실용적이지 않습니다.',
    'pet.runway.left': '낮은 구현 장벽',
    'pet.runway.right': '높은 암호학적 구현 난이도',
    'pet.runway.tee': '쉽게 시작 가능',
    'pet.runway.psi': '좁은 문제에 실용적',
    'pet.runway.mpc': '강력하지만 업무별 설계 필요',
    'pet.runway.fhe': '구현 최적화로 실용화 가능',
    'pet.runway.io': '연구 단계',
    'problem.a.title': 'A. 셀러는 수요가 보이기 전에 가격과 출시 물량을 정해야 합니다',
    'problem.a.desc': '한정판·팬덤·수집재 시장은 지불 의향이 늦게 드러나 과잉 재고, 과소 생산, 가격 실패가 반복됩니다.',
    'problem.b.title': 'B. 금융·보험 리스크 신호는 기관 밖으로 나가기 어렵습니다',
    'problem.b.desc': '보험 청구, 신원, 계좌, 거래 패턴은 함께 보면 더 정확하지만 개인정보와 규제로 원본 공유가 어렵습니다.',
    'problem.c.title': 'C. 블록체인은 검증성은 강하지만 민감 업무에는 너무 많이 보입니다',
    'problem.c.desc': '많은 실제 애플리케이션은 검증성과 기밀성이 함께 필요합니다. 입찰, 신용, 조건, 상태 값이 모두 공개될 수는 없습니다.',
    'cta.seeSolution': '솔루션 보기',
    'cta.talkToUs': '문의하기',
    'section.businessTracks': '03. FHE16 솔루션',
    'solution.tab.fhe16': 'FHE16',
    'solution.tab.browser': 'A. 브라우저 런타임',
    'solution.tab.sdk': 'B. 디바이스 SDK',
    'solution.tab.mpc': 'C. KeyMesh MPC',
    'section.techMoat': '04. 기술 차별성',
    'section.competitive': '05. 경쟁 포지션',
    'section.team': '06. 팀',
    'section.developers': '07. 개발자 인프라',
    'section.research': '08. 연구',
    'section.press': '09. 언론 및 미디어',
    'compare.title': 'FHE16이 A/B/C를 관통하는 공통 엔진인 이유',
    'compare.feature': '항목',
    'compare.standard': '일반 분석',
    'compare.zk': 'ZK 증명',
    'compare.rawMin': '원본 데이터 최소화',
    'compare.encryptedDesign': '설계 단계부터 암호화',
    'compare.dataExposed': '데이터 노출',
    'compare.workflowSpecific': '강력하지만 업무별 구현 필요',
    'compare.provesStatements': '명제 증명 중심',
    'compare.hardwareTrust': '하드웨어 신뢰 필요',
    'compare.scoring': '암호화 비교 및 스코어링',
    'compare.coreFocus': '핵심 적용 영역',
    'compare.plaintextOnly': '평문 처리 중심',
    'compare.coordination': '참여자 조율 필요',
    'compare.heavyLive': '실시간 스코어링에는 무거움',
    'compare.fastTrust': '빠르지만 신뢰 의존',
    'compare.browserPath': '브라우저 / 클라이언트 실행 경로',
    'compare.wasmPath': 'FHE16-WASM 경로',
    'compare.easy': '쉬움',
    'compare.dependsProtocol': '프로토콜 의존',
    'compare.proverCost': '증명 생성 비용',
    'compare.hardwareBound': '하드웨어 종속',
    'compare.enterprisePath': '기업 검증 경로',
    'compare.teePsiFhe': 'TEE -> PSI -> FHE 경로',
    'compare.privacyLimited': '쉽지만 프라이버시 제한',
    'compare.goodMatching': '매칭에 적합',
    'compare.auditSpecific': '감사 목적 중심',
    'compare.shortBridge': '단기 브리지',
    'compare.blockchainFit': '블록체인 기밀성 적합도',
    'compare.confState': '기밀 상태와 실행',
    'compare.publicDefault': '기본 공개 구조',
    'compare.coordinationCost': '조율 비용',
    'compare.verificationLayer': '검증 레이어',
    'compare.offchainTrust': '오프체인 신뢰 레이어',
    'compare.crossMarket': '시장 간 재사용성',
    'compare.sharedEngine': 'A/B/C 공통 엔진',
    'compare.siloed': '분리된 시스템',
    'compare.usecaseSpecific': '유스케이스별 구현',
    'compare.proofCircuits': '유스케이스별 증명 회로',
    'compare.vendorSpecific': '벤더 종속',
    'property.title': '포트폴리오 전략',
    'team.intro': '연구 기반 PET 실행팀<br>FHE16을 소비자, 기업,<br>블록체인 사업 트랙으로 전환합니다.',
    'ecosystem.subtitle': 'PET 상용화를 위한 연구 및 기술 협력',
    'developers.title': 'FHE16으로 기밀 워크플로를 구축하세요',
    'developers.github.desc': '공개 소스, 구현 레퍼런스, 연구 코드를 확인하세요',
    'developers.source.site.label': '홈페이지 소스',
    'developers.source.demo.label': 'FHE16 데모',
    'developers.source.web3.label': 'Web3 프로토타입',
    'developers.docs.desc': 'PET 및 기밀 연산 검증을 위한 기술 가이드',
    'developers.sdk.desc': '단계적으로 공개되는 라이브러리와 통합 모듈',
    'developers.playground.desc': '암호화 비교와 데모를 위한 브라우저 실행 경로',
    'research.title': '논문 및 산학협력',
    'research.desc': 'waLLLnut의 FHE16 기술은 한양대학교 Coding & Communication Research Lab(CCRL)와의 긴밀한 산학협력을 통해 개발되었습니다.',
    'research.papers': '논문 및 연구 성과',
    'press.title': '언론 보도',
    'contact.title': '문의',
    'contact.desc': 'waLLLnut 관련 문의는 아래 이메일로 연락해 주세요.',
    'contact.cta.title': '이메일',
    'contact.cta.desc': 'shlee@walllnut.com',
    'contact.button': 'shlee@walllnut.com',
    'contact.email': 'shlee@walllnut.com',
    'detail.view': '자세히 보기',
    'footer.bizNo.label': '사업자등록번호',
    'footer.bizNo.value': '698-87-03144',
    'footer.location.label': '위치',
    'footer.location.value': '서울특별시 성동구 왕십리로 222 (사근동, 한양대학교)',
    'developers.docs.title': '문서',
    'developers.playground.title': '플레이그라운드',
    'research.visitLab': '연구실 방문',
    'press.more': '뉴스 더보기',
    'advisors.title': '<strong>waLLLnut</strong>',
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
      var phKey = el.getAttribute('data-i18n-placeholder');
      var phVal = phKey ? ((I18N[lang] && I18N[lang][phKey]) || (I18N[fb] && I18N[fb][phKey]) || '') : '';
      if (phVal) el.setAttribute('placeholder', phVal);
    });
    $$('[data-i18n-placeholder]').forEach(function(el){
      var phKey = el.getAttribute('data-i18n-placeholder');
      var phVal = phKey ? ((I18N[lang] && I18N[lang][phKey]) || (I18N[fb] && I18N[fb][phKey]) || '') : '';
      if (phVal) el.setAttribute('placeholder', phVal);
    });
  }
  function getSavedLang(){ try{ var v=localStorage.getItem('lang'); return (v==='ko'||v==='en') ? v : null; }catch(e){ return null; } }
  function saveLang(v){ try{ localStorage.setItem('lang', v); }catch(e){} }
  function getUrlLang(){ var v=new URLSearchParams(location.search).get('lang'); return (v==='ko'||v==='en') ? v : null; }
  function inferRegionalLang(){
    var list=[];
    if(navigator.language) list.push(navigator.language);
    if(navigator.languages && navigator.languages.length) list=list.concat(Array.prototype.slice.call(navigator.languages));
    if(list.some(function(v){ return /^ko\b/i.test(v || ''); })) return 'ko';
    try{
      var tz=Intl.DateTimeFormat().resolvedOptions().timeZone;
      if(tz==='Asia/Seoul') return 'ko';
    }catch(e){}
    return 'ko';
  }
  function getInitialLang(){ return getUrlLang() || getSavedLang() || inferRegionalLang(); }

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
    setKeyBySel('.goal-dropdown-card:nth-of-type(2) .goal-dropdown-content .goal-dropdown-text', 'goal.a2');
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

    // Footer
    var label=$('#langLabel'); if(label && !label.hasAttribute('data-i18n')) label.setAttribute('data-i18n','lang.label');
  }

  // 텍스트 매칭 자동 바인딩 (인터랙티브 영역 보호)
  function autowireByTextMatch() {
    var map = new Map(), en = I18N.en || {};
    Object.keys(en).forEach(function(k){ var text=norm(stripTags(en[k])); if(text) map.set(text, k); });

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
      var text=norm(el.innerHTML || el.textContent || ''); if(!text) return; var key = map.get(text); if (key) el.setAttribute('data-i18n', key);
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
    // Hero 섹션이 뷰포트를 거의 완전히 차지하는 경우 헤더 숨김
    // Hero 섹션은 86vh로 설정되어 있으므로, 뷰포트의 대부분을 차지함
    // 1. 스크롤이 최상단에 있을 때
    // 2. Hero의 top이 0에 가깝고 (페이지 최상단에 위치)
    // 3. Hero의 높이가 viewportHeight의 75% 이상일 때 (86vh이므로 충분)
    const isAtTop = scrollY <= 30; // 스크롤이 최상단에 있을 때
    const isHeroTopNearZero = heroTop >= -30 && heroTop <= 30; // Hero가 최상단에 있는지
    const isHeroFullHeight = heroHeight >= viewportHeight * 0.75; // Hero 높이가 뷰포트의 75% 이상 (86vh이므로 충분)
    
    // 모든 조건을 만족하면 Hero가 전체 뷰포트를 차지하는 것으로 간주
    const isHeroFullViewport = isAtTop && isHeroTopNearZero && isHeroFullHeight;
    
    // 헤더 항상 표시
    setVisible(true);
    // 스크롤 위치에 따라 배경 스타일만 제어
    const isAtTopForBg = scrollY <= 5;
    header.classList.toggle('has-scrolled', !isAtTopForBg);
    
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

  // 초기 상태: 헤더 항상 표시
  header.classList.add('is-visible');
  header.style.removeProperty('transform');
  header.style.removeProperty('opacity');
  header.style.removeProperty('pointer-events');
  header.style.removeProperty('visibility');
  isVisible = true;
  
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

  /* ================= Benchmark Chart (Chart.js) ================= */
  function initBenchmarkChart(){
    var chartContainer = $('#benchmarkChart');
    if(!chartContainer) return;

    var chartCanvas = document.getElementById('benchmarkChartCanvas');
    if(!chartCanvas) return;

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
    var mainChartInstance = null;
    var modalChartInstance = null;
    var clickedPoint = null;

    var detailBtn = document.getElementById('chartDetailBtn');
    var detailBtnText = document.getElementById('detailBtnText');
    var modal = document.getElementById('chartDetailModal');
    var modalOverlay = document.getElementById('modalOverlay');
    var modalClose = document.getElementById('modalClose');
    var modalChartCanvas = document.getElementById('modalChartCanvas');

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

    // Chart.js 차트 생성 함수
    function createChart(data){
      if(!data) return;

      // 데이터를 배열로 변환 (키 순서대로)
      var keys = Object.keys(data).map(function(k){ return parseInt(k); }).sort(function(a, b){ return a - b; });
      var xValues = keys;
      var yValues = keys.map(function(k){ return data[String(k)]; });

      var lineColor = categoryColors[currentCategory] || '#FFFFFF';

      // 기존 차트 삭제
      if(mainChartInstance){
        mainChartInstance.destroy();
        mainChartInstance = null;
      }

      var ctx = chartCanvas.getContext('2d');

      mainChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: xValues,
          datasets: [{
            label: currentCategory,
            data: yValues,
            borderColor: lineColor,
            backgroundColor: lineColor.replace(')', ', 0.1)').replace('rgb', 'rgba'),
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 8,
            pointBackgroundColor: lineColor,
            pointBorderColor: lineColor,
            pointHoverBackgroundColor: '#FFFFFF',
            pointHoverBorderColor: lineColor,
            pointHoverBorderWidth: 2,
            tension: 0.1,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          onClick: function(event, elements){
            if(elements && elements.length > 0){
              var element = elements[0];
              var index = element.index;
              clickedPoint = {
                x: xValues[index],
                y: yValues[index],
                pointNumber: index
              };
              openModal();
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(25, 25, 25, 0.9)',
              titleColor: '#FFFFFF',
              bodyColor: '#FFFFFF',
              borderColor: lineColor,
              borderWidth: 1,
              cornerRadius: 8,
              padding: 12,
              displayColors: false,
              callbacks: {
                title: function(tooltipItems){
                  return currentCategory;
                },
                label: function(context){
                  return 'X: ' + context.label + '  Y: ' + context.parsed.y.toFixed(2) + ' ms';
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Bit Depth / Parameter',
                color: '#FFFFFF',
                font: { size: 14, family: 'Pretendard, sans-serif' }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)',
                drawBorder: false
              },
              ticks: {
                color: '#FFFFFF',
                font: { size: 12 }
              }
            },
            y: {
              title: {
                display: true,
                text: 'Performance (ms)',
                color: '#FFFFFF',
                font: { size: 14, family: 'Pretendard, sans-serif' }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)',
                drawBorder: false
              },
              ticks: {
                color: '#FFFFFF',
                font: { size: 12 }
              },
              beginAtZero: true
            }
          },
          animation: {
            duration: 800,
            easing: 'easeOutQuart'
          }
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
        if(mainChartInstance){
          mainChartInstance.resize();
        }
        if(modalChartInstance && modal && modal.classList.contains('is-open')){
          modalChartInstance.resize();
        }
      }, 150);
    }

    window.addEventListener('resize', handleResize);

    // 슬라이드 활성화 시 차트 리사이즈
    function handleSlideActivation(){
      var graphSlide = chartContainer.closest('.hero-slide');
      if(graphSlide && graphSlide.classList.contains('is-active')){
        setTimeout(function(){
          if(mainChartInstance){
            mainChartInstance.resize();
          }
        }, 100);
      }
    }

    // 슬라이드 전환 감지를 위한 MutationObserver
    var slideObserver = new MutationObserver(function(mutations){
      mutations.forEach(function(mutation){
        if(mutation.type === 'attributes' && mutation.attributeName === 'class'){
          var target = mutation.target;
          if(target.classList.contains('hero-slide')){
            handleSlideActivation();
          }
        }
      });
    });

    // 그래프 슬라이드 관찰 시작
    var graphSlide = chartContainer.closest('.hero-slide');
    if(graphSlide){
      slideObserver.observe(graphSlide, {
        attributes: true,
        attributeFilter: ['class']
      });
    }

    // hero:request-slide 및 hero:slide-changed 이벤트 리스너 추가
    document.addEventListener('hero:request-slide', function(event){
      var requestedIndex = event.detail ? event.detail.index : 1;
      if(requestedIndex === 1){
        setTimeout(handleSlideActivation, 200);
      }
    });

    document.addEventListener('hero:slide-changed', function(event){
      var slideIndex = event.detail ? event.detail.index : 0;
      if(slideIndex === 1){
        setTimeout(handleSlideActivation, 200);
      }
    });

    // 모달 내부 상세 차트 생성 함수
    function createModalChart(data){
      if(!data || !modalChartCanvas) return;

      var keys = Object.keys(data).map(function(k){ return parseInt(k); }).sort(function(a, b){ return a - b; });
      var xValues = keys;
      var yValues = keys.map(function(k){ return data[String(k)]; });
      var lineColor = categoryColors[currentCategory] || '#FFFFFF';

      // 기존 모달 차트 삭제
      if(modalChartInstance){
        modalChartInstance.destroy();
        modalChartInstance = null;
      }

      var ctx = modalChartCanvas.getContext('2d');

      // 클릭한 포인트 강조를 위한 포인트 색상 배열
      var pointColors = yValues.map(function(_, i){
        if(clickedPoint && xValues[i] === clickedPoint.x){
          return '#FF7300';
        }
        return lineColor;
      });

      var pointSizes = yValues.map(function(_, i){
        if(clickedPoint && xValues[i] === clickedPoint.x){
          return 12;
        }
        return 6;
      });

      modalChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: xValues,
          datasets: [{
            label: currentCategory,
            data: yValues,
            borderColor: lineColor,
            backgroundColor: lineColor.replace(')', ', 0.15)').replace('rgb', 'rgba'),
            borderWidth: 3,
            pointRadius: pointSizes,
            pointHoverRadius: 10,
            pointBackgroundColor: pointColors,
            pointBorderColor: pointColors,
            pointBorderWidth: 2,
            tension: 0.1,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(25, 25, 25, 0.95)',
              titleColor: '#FFFFFF',
              bodyColor: '#FFFFFF',
              borderColor: lineColor,
              borderWidth: 1,
              cornerRadius: 8,
              padding: 14,
              displayColors: false,
              titleFont: { size: 14, weight: 'bold' },
              bodyFont: { size: 13 },
              callbacks: {
                title: function(tooltipItems){
                  return currentCategory;
                },
                label: function(context){
                  var isSelected = clickedPoint && xValues[context.dataIndex] === clickedPoint.x;
                  var prefix = isSelected ? '* Selected * ' : '';
                  return prefix + 'X: ' + context.label + '  Y: ' + context.parsed.y.toFixed(2) + ' ms';
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Bit Depth / Parameter',
                color: '#FFFFFF',
                font: { size: 16, family: 'Pretendard, sans-serif' }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.15)',
                drawBorder: true,
                borderColor: 'rgba(255, 255, 255, 0.3)'
              },
              ticks: {
                color: '#FFFFFF',
                font: { size: 13 }
              }
            },
            y: {
              title: {
                display: true,
                text: 'Performance (ms)',
                color: '#FFFFFF',
                font: { size: 16, family: 'Pretendard, sans-serif' }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.15)',
                drawBorder: true,
                borderColor: 'rgba(255, 255, 255, 0.3)'
              },
              ticks: {
                color: '#FFFFFF',
                font: { size: 13 }
              },
              beginAtZero: true
            }
          },
          animation: {
            duration: 600,
            easing: 'easeOutQuart'
          }
        }
      });

      // 모달이 열린 후 차트 크기 재조정
      setTimeout(function(){
        if(modalChartInstance){
          modalChartInstance.resize();
        }
      }, 100);
    }

    // 모달 열기 함수
    function openModal(){
      if(!modal || !chartData) return;

      var modalTitle = document.getElementById('modalTitle');
      if(modalTitle){
        modalTitle.textContent = currentCategory + ' - Detailed Benchmark';
      }

      createModalChart(chartData);

      var heroControls = document.querySelector('.hero-slider-controls');
      if(heroControls){
        heroControls.style.display = 'none';
      }

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

      var heroControls = document.querySelector('.hero-slider-controls');
      if(heroControls){
        heroControls.style.display = '';
      }

      // 모달 차트 정리
      if(modalChartInstance){
        modalChartInstance.destroy();
        modalChartInstance = null;
      }

      clickedPoint = null;
    }

    // 카테고리 탭 클릭 이벤트
    categoryTabs.forEach(function(tab){
      tab.addEventListener('click', function(){
        var category = this.getAttribute('data-category');
        if(category === currentCategory) return;

        categoryTabs.forEach(function(t){
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        this.classList.add('is-active');
        this.setAttribute('aria-selected', 'true');

        currentCategory = category;

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

    var initial = getInitialLang();
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
