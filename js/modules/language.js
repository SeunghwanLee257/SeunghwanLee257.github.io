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
    'hero.headline': 'Privacy-preserving intelligence connecting B2C demand, B2B risk, and blockchain infrastructure<br>through confidential computation.',
    'hero.track.a.title': 'B2C Demand Forecasting',
    'hero.track.a.desc': 'Private demand survey, pricing/allocation report, 2026 Coming Soon',
    'hero.track.b.title': 'B2B PET Risk Intelligence',
    'hero.track.b.desc': 'Identity, insurance, transaction risk, and PET-based FDS',
    'hero.track.c.title': 'Blockchain Confidential Infrastructure',
    'hero.track.c.desc': 'Encrypted state, verifiable execution, developer infrastructure',
    'vision.title': 'One PET Engine, Three Business Tracks',
    'vision.subtitle': 'waLLLnut applies FHE16, MPC, and threshold disclosure to build a staged business:<br>consumer demand intelligence first, enterprise PET risk validation next, and blockchain confidential infrastructure as the scalable layer.',
    'solution.coprocessor.title': 'B2C Demand Forecasting & Allocation',
    'solution.coprocessor.body': 'Convert private willingness-to-pay and launch demand into pricing, allocation, and restock decisions. Product name undisclosed. Launching in 2026.',
    'solution.coprocessor.sub': '2026 Coming Soon',
    'solution.solana.title': 'B2B PET Risk Intelligence',
    'solution.solana.body': 'Support insurance claim cross-check, FDS, identity mismatch, and anomalous transaction workflows without exposing raw business data.',
    'solution.solana.sub': 'PET-based identity, fraud, and transaction risk analysis',
    'solution.defi.title': 'Blockchain Confidential Infrastructure',
    'solution.defi.body': 'Package confidential state, encrypted execution, and threshold disclosure into developer-facing blockchain infrastructure while preserving public verifiability.',
    'solution.defi.sub': 'Confidential modules for verifiable blockchain networks',
    'solution.voting.title': 'Threshold Disclosure',
    'solution.voting.body': 'Reveal only the minimum result needed for audit, compliance, or network verification.',
    'solution.voting.sub': 'Disclosure by policy, not by default',
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
    'property.feature1': 'A creates the first market wedge: privacy-preserving demand reports for consumer launches and allocation planning.',
    'property.feature2': 'B converts the same PET engine into enterprise validation workflows for insurance claim review, identity risk, FDS, and anomalous transactions.',
    'property.feature3': 'C packages the engine as confidential blockchain infrastructure for encrypted state, threshold disclosure, and verifiable execution.',
    'usecases.title': 'Business Model & GTM',
    'usecase.1.title': 'A. Consumer Demand Intelligence',
    'usecase.1.desc': 'Closed demand survey, private willingness-to-pay analysis, and launch quantity reports. Revenue path: report fee, transaction fee, premium seller tools, and later authenticity/fulfillment modules. 2026 Coming Soon.',
    'usecase.2.title': 'B. Enterprise Risk Intelligence',
    'usecase.2.desc': 'Insurance claim cross-validation, FDS, identity mismatch, and anomalous transaction screening without moving raw customer data. GTM path: PoC design, validation, then subscription or per-check pricing.',
    'usecase.3.title': 'C. Confidential Chain Infrastructure',
    'usecase.3.desc': 'Developer-facing modules for confidential state, encrypted execution, and threshold disclosure. Revenue path: infrastructure integration, SDK support, and partner deployments.',
    'usecase.4.title': 'Threshold Disclosure',
    'usecase.4.desc': 'Reveal only the minimum result required for audit or verification.',
    'goal.q1': 'What business is waLLLnut building?',
    'goal.a1': 'waLLLnut builds a PET business around markets where useful data cannot be exposed. The first wedge is B2C demand forecasting and allocation; the second is B2B identity, fraud, and anomalous transaction risk; the third is confidential blockchain infrastructure.',
    'goal.q2': 'Why this strategy now?',
    'goal.a2': 'Consumer teams need private demand signals before they commit inventory; financial and insurance teams need cross-organization risk checks without moving raw data; blockchain applications need confidentiality without giving up verification. One PET engine can serve all three with staged go-to-market risk.',
    'goal.q3': 'What is the public A/B/C plan?',
    'goal.a3.1': 'A. B2C Demand Forecasting & Allocation - private demand survey, pricing/allocation report, 2026 Coming Soon.',
    'goal.a3.2': 'B. B2B PET Risk Intelligence - insurance claim cross-check, FDS, identity and anomalous transaction detection without raw data exposure.',
    'goal.a3.3': 'C. Blockchain Confidential Infrastructure - encrypted state, confidential execution, threshold disclosure, and public verifiability.',
    'summary.headline': 'One PET engine is being packaged into three commercial tracks.',
    'summary.body': 'The company starts with a consumer demand-intelligence wedge, expands into enterprise risk workflows where raw data cannot move, and turns the same encrypted computation core into blockchain confidentiality infrastructure.',
    'summary.status.entry.label': 'Entry wedge',
    'summary.status.entry.value': 'A. B2C demand',
    'summary.status.launch.label': 'Launch status',
    'summary.status.launch.value': '2026 Coming Soon',
    'summary.status.engine.label': 'Core engine',
    'summary.status.engine.value': 'FHE16 + MPC',
    'summary.status.rule.label': 'Data rule',
    'summary.status.rule.value': 'Raw data stays private',
    'summary.table.track': 'Track',
    'summary.table.customer': 'Customer',
    'summary.table.output': 'Product output',
    'summary.table.revenue': 'Revenue path',
    'summary.table.status': 'Public status',
    'summary.a.title': 'B2C Demand Forecasting & Allocation',
    'summary.a.customer': 'Brands, creators, limited-drop sellers',
    'summary.a.output': 'Private demand survey, willingness-to-pay analysis, pricing and allocation report',
    'summary.a.revenue': 'Report fee, transaction fee, premium seller tools',
    'summary.a.status': '2026 Coming Soon',
    'summary.b.title': 'B2B PET Risk Intelligence',
    'summary.b.customer': 'Insurers, financial institutions, platforms',
    'summary.b.output': 'Encrypted cross-check for claims, identity mismatch, FDS, and anomalous transactions',
    'summary.b.revenue': 'PoC design, then per-check or subscription pricing after validation',
    'summary.b.status': 'Use-case validation track',
    'summary.c.title': 'Blockchain Confidential Infrastructure',
    'summary.c.customer': 'Chains, applications, infrastructure teams',
    'summary.c.output': 'Encrypted state, confidential execution, threshold disclosure, public verifiability',
    'summary.c.revenue': 'Infrastructure integration, SDK support, partner deployment',
    'summary.c.status': 'Infrastructure track',
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
    'problem.title': 'Problems require shared data, but raw data cannot be shared',
    'problem.desc': 'Demand forecasting, insurance and transaction risk, and blockchain state verification all depend on sensitive signals.<br>waLLLnut uses PET to keep raw data hidden while turning necessary computation results into business decisions.',
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
    'problem.a.title': 'A. Launch demand and allocation still rely on guesswork',
    'problem.a.desc': 'In fandom, limited-edition, and collectible markets, willingness-to-pay and real demand are hidden, making pricing, production, and inventory decisions unstable.',
    'problem.b.title': 'B. Fraud and anomalous transaction data is split across institutions',
    'problem.b.desc': 'Insurance claims, identity, accounts, and transaction patterns need cross-checking, but privacy and regulation make raw-data movement difficult.',
    'problem.c.title': 'C. Public ledgers limit sensitive business workflows',
    'problem.c.desc': 'On-chain applications need verifiability, but real adoption is constrained when bids, credit, terms, and state values are exposed by default.',
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
    'developers.github.desc': 'Explore implementation references and research code',
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
    'hero.headline': 'PET 기반 기밀 연산으로<br>B2C 수요, B2B 리스크, 블록체인 인프라를 연결합니다',
    'hero.track.a.title': 'B2C 수요 예측',
    'hero.track.a.desc': '비공개 수요 조사 · 물량/가격 리포트 · 2026 Coming Soon',
    'hero.track.b.title': 'B2B PET 리스크 인텔리전스',
    'hero.track.b.desc': '신원 이상 · 보험/거래 리스크 · PET 기반 FDS',
    'hero.track.c.title': '블록체인 기밀 연산 인프라',
    'hero.track.c.desc': '암호화 상태 · 검증 가능한 실행 · 개발자 인프라',
    'vision.title': '하나의 PET 엔진, 세 가지 사업 트랙',
    'vision.subtitle': 'waLLLnut은 FHE16, MPC, 임계값 공개 기술로 단계형 사업을 구축합니다:<br>B2C 수요 인텔리전스로 시작하고, B2B PET 리스크 검증으로 확장하며, 블록체인 기밀 인프라를 장기 확장 레이어로 만듭니다.',
    'solution.coprocessor.title': 'B2C 수요 예측 및 물량 배분',
    'solution.coprocessor.body': '비공개 지불 의향과 출시 수요를 가격, 물량 배분, 재입고 의사결정으로 전환합니다. 제품명은 비공개입니다.',
    'solution.coprocessor.sub': '2026 Coming Soon',
    'solution.solana.title': 'B2B PET 리스크 인텔리전스',
    'solution.solana.body': '원본 데이터를 노출하지 않고 보험 청구 교차검증, FDS, 신원 불일치, 이상 거래 선별 워크플로를 지원합니다.',
    'solution.solana.sub': '신원, 사기, 거래 리스크를 위한 PET 기반 분석',
    'solution.defi.title': '블록체인 기밀 연산 인프라',
    'solution.defi.body': '기밀 상태, 암호화 실행, 임계값 공개를 개발자용 블록체인 인프라로 패키징하면서 공개 검증성을 유지합니다.',
    'solution.defi.sub': '검증 가능한 블록체인 네트워크를 위한 기밀 모듈',
    'solution.voting.title': 'Threshold Disclosure',
    'solution.voting.body': '감사, 컴플라이언스, 검증에 필요한 최소 결과만 제한적으로 공개합니다.',
    'solution.voting.sub': '기본 공개가 아니라 정책 기반 공개',
    'tech.keyFeatures': '핵심 특징',
    'tech.fhe16.title': 'FHE16',
    'tech.fhe16.subtitle': '16비트 정수 연산 중심의 결정론적 FHE 구조로 부동소수 연산을 제거하여, 실행 환경에 상관없이 동일한 결과를 보장합니다',
    'tech.fhe16.feature1': '<mark>부동소수점 연산 제거</mark>, 실행 환경과 무관하게 동일한 결과 보장',
    'tech.fhe16.feature2': '부동소수점 환경별 오차 문제 제거',
    'tech.fhe16.feature3': '<mark>2.89ms 초고속 부트스트래핑</mark> — GINX 게이트 최적화를 통해 (실시간·저지연 애플리케이션 적합)',
    'tech.mpc.title': 'FHE16 기반 MPC (SSFHE)',
    'tech.mpc.subtitle': 'FHE16과 CRT-SPDZ를 결합한 효율적인 MPC로, 16비트 소수의 합성수를 모듈러로 활용하고 효율적인 샘플링을 지원합니다.',
    'tech.mpc.feature1': '<mark>O(1) 복잡도</mark> — 통신·연산·라운드·입력 크기 각각',
    'tech.mpc.feature2': 'O(n κ d²) 복잡도 — <mark>평가 키(ev) 생성</mark>',
    'tech.mpc.feature3': '<mark>CRT-SPDZ 기반</mark> 안전한 난수 및 분포 샘플링(이산 가우시안 포함)',
    'tech.mpc.feature4': '서킷 프라이버시 — <mark>불신 다수 환경의 능동 보안</mark>',
    'property.feature1': 'A는 B2C 출시와 물량 계획에 필요한 프라이버시 보존 수요 리포트로 첫 시장 진입점을 만듭니다.',
    'property.feature2': 'B는 같은 PET 엔진을 보험 청구 검토, 신원 리스크, FDS, 이상 거래 업무를 위한 기업 검증 워크플로로 전환합니다.',
    'property.feature3': 'C는 암호화 상태, 임계값 공개, 검증 가능한 실행을 위한 블록체인 기밀 인프라로 엔진을 패키징합니다.',
    'usecases.title': '비즈니스 모델 & GTM',
    'usecase.1.title': 'A. 소비자 수요 인텔리전스',
    'usecase.1.desc': '폐쇄형 수요 조사, 비공개 지불 의향 분석, 출시 물량 리포트로 시작합니다. 수익 경로는 리포트 비용, 거래 수수료, 프리미엄 판매자 도구, 이후 정품/물류 모듈입니다. 2026 Coming Soon.',
    'usecase.2.title': 'B. 기업 리스크 인텔리전스',
    'usecase.2.desc': '원본 고객 데이터를 이동하지 않고 보험 청구 교차검증, FDS, 신원 불일치, 이상 거래 선별을 수행합니다. GTM은 PoC 설계와 검증 이후 구독 또는 건당 과금으로 이어집니다.',
    'usecase.3.title': 'C. 블록체인 기밀 인프라',
    'usecase.3.desc': '기밀 상태, 암호화 실행, 임계값 공개를 위한 개발자 모듈입니다. 수익 경로는 인프라 통합, SDK 지원, 파트너 배포입니다.',
    'usecase.4.title': 'Threshold Disclosure',
    'usecase.4.desc': '감사 또는 검증에 필요한 최소 결과만 제한적으로 공개합니다.',
    'goal.q1': 'waLLLnut은 어떤 사업을 만드나요?',
    'goal.a1': 'waLLLnut은 노출할 수 없는 데이터를 활용해야 하는 시장을 대상으로 PET 사업을 만듭니다. 첫 진입점은 B2C 수요 예측 및 물량 배분, 두 번째는 B2B 신원·사기·이상 거래 리스크, 세 번째는 블록체인 기밀 인프라입니다.',
    'goal.q2': '왜 지금 이 전략인가요?',
    'goal.a2': '소비자 팀은 재고를 확정하기 전에 비공개 수요 신호가 필요하고, 금융·보험 팀은 원본 데이터를 이동하지 않는 기관 간 리스크 확인이 필요하며, 블록체인 앱은 검증성을 잃지 않는 기밀성이 필요합니다. 하나의 PET 엔진으로 세 시장을 단계적으로 공략합니다.',
    'goal.q3': '공개 가능한 A/B/C 계획은 무엇인가요?',
    'goal.a3.1': 'A. B2C 수요 예측 및 물량 배분 - 비공개 수요 조사, 가격/물량 리포트, 2026 Coming Soon.',
    'goal.a3.2': 'B. B2B PET 리스크 인텔리전스 - 보험 청구 교차검증, FDS, 신원 및 이상 거래 탐지',
    'goal.a3.3': 'C. 블록체인 기밀 인프라 - 암호화 상태, 기밀 실행, 임계값 공개, 공개 검증성을 함께 제공합니다.',
    'summary.headline': '하나의 PET 엔진을 세 개의 상업 트랙으로 제품화합니다.',
    'summary.body': '초기 진입점은 B2C 수요 예측과 물량 배분입니다. 이후 원본 데이터를 이동할 수 없는 기업 리스크 업무와 블록체인 기밀 인프라로 확장합니다.',
    'summary.status.entry.label': '초기 진입점',
    'summary.status.entry.value': 'A. B2C 수요',
    'summary.status.launch.label': '출시 상태',
    'summary.status.launch.value': '2026 Coming Soon',
    'summary.status.engine.label': '핵심 엔진',
    'summary.status.engine.value': 'FHE16 + MPC',
    'summary.status.rule.label': '데이터 원칙',
    'summary.status.rule.value': '원본 데이터 비공개',
    'summary.table.track': '트랙',
    'summary.table.customer': '고객',
    'summary.table.output': '제품 산출물',
    'summary.table.revenue': '수익 경로',
    'summary.table.status': '공개 상태',
    'summary.a.title': 'B2C 수요 예측 및 물량 배분',
    'summary.a.customer': '브랜드, 크리에이터, 한정판 셀러',
    'summary.a.output': '비공개 수요 조사, 지불 의향 분석, 가격 및 물량 리포트',
    'summary.a.revenue': '리포트 과금, 거래 수수료, 프리미엄 셀러 도구',
    'summary.a.status': '2026 Coming Soon',
    'summary.b.title': 'B2B PET 리스크 인텔리전스',
    'summary.b.customer': '보험사, 금융기관, 플랫폼 사업자',
    'summary.b.output': '보험 청구, 신원 불일치, FDS, 이상 거래에 대한 암호화 교차 검증',
    'summary.b.revenue': 'PoC 설계 후 검증 결과에 따라 건별 또는 구독 과금',
    'summary.b.status': '유스케이스 검증 트랙',
    'summary.c.title': '블록체인 기밀 인프라',
    'summary.c.customer': '체인, 애플리케이션, 인프라 팀',
    'summary.c.output': '암호화 상태, 기밀 실행, 임계값 공개, 공개 검증성',
    'summary.c.revenue': '인프라 통합, SDK 지원, 파트너 배포',
    'summary.c.status': '인프라 트랙',
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
    'problem.title': '원본 데이터를 공유해야 풀리는 문제들이지만, 원본 공유는 불가능합니다',
    'problem.desc': '수요 예측, 보험·거래 리스크, 블록체인 상태 검증은 모두 민감한 신호에 의존합니다.<br>waLLLnut은 PET 기술로 원본은 숨기고 필요한 계산 결과만 사업 의사결정에 연결합니다.',
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
    'problem.a.title': 'A. 출시 수요와 물량은 아직 감에 의존합니다',
    'problem.a.desc': '팬덤·한정판·수집재 시장은 지불 의향과 실제 수요가 숨겨져 있어 가격, 생산량, 재고 의사결정이 흔들립니다.',
    'problem.b.title': 'B. 사기·이상 거래 데이터는 기관별로 끊겨 있습니다',
    'problem.b.desc': '보험 청구, 신원, 계좌, 거래 패턴은 교차 검증이 필요하지만 개인정보와 규제로 원본 이동이 어렵습니다.',
    'problem.c.title': 'C. 공개 원장은 민감 업무 확장을 막습니다',
    'problem.c.desc': '온체인 애플리케이션은 검증성은 필요하지만 입찰, 신용, 거래 조건, 상태 값까지 공개되면 실사용이 제한됩니다.',
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
    'developers.github.desc': '구현 레퍼런스와 연구 코드를 확인하세요',
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
      // Team profile cards are intentionally bilingual/static, but section labels can translate.
      if (el.closest('#sec06 .team-card') || el.closest('#sec06 .team-gallery')) return;
      const key = el.getAttribute('data-i18n');
      // 기타 제외 요소들
      if (el.querySelector('.material-icons') || el.closest('.hero-nav') || el.closest('.slider-btn')) return;

      if (!key) return;
      const val = translations[lang]?.[key] || translations['en']?.[key];
      if (val !== undefined && val !== null) {
        // Use innerHTML to support HTML tags like <br>
        el.innerHTML = val;
      }

      const placeholderKey = el.getAttribute('data-i18n-placeholder');
      const placeholderVal = placeholderKey ? (translations[lang]?.[placeholderKey] || translations['en']?.[placeholderKey]) : null;
      if (placeholderVal !== undefined && placeholderVal !== null) {
        el.setAttribute('placeholder', placeholderVal);
      }
    });

    $$('[data-i18n-placeholder]').forEach(el => {
      const placeholderKey = el.getAttribute('data-i18n-placeholder');
      const placeholderVal = placeholderKey ? (translations[lang]?.[placeholderKey] || translations['en']?.[placeholderKey]) : null;
      if (placeholderVal !== undefined && placeholderVal !== null) {
        el.setAttribute('placeholder', placeholderVal);
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

function getStoredLanguage() {
  try {
    const stored = localStorage.getItem('lang');
    return stored === 'ko' || stored === 'en' ? stored : null;
  } catch(e) {
    return null;
  }
}

function getUrlLanguage() {
  const lang = new URLSearchParams(location.search).get('lang');
  return lang === 'ko' || lang === 'en' ? lang : null;
}

function inferRegionalLanguage() {
  const languages = [navigator.language, ...(navigator.languages || [])].filter(Boolean);
  if (languages.some(lang => /^ko\b/i.test(lang))) return 'ko';

  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone === 'Asia/Seoul') return 'ko';
  } catch(e) {
    // Ignore timezone detection failures.
  }

  return 'en';
}

function getInitialLanguage() {
  return getUrlLanguage() || getStoredLanguage() || inferRegionalLanguage();
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

  const initialLang = getInitialLanguage();

  const allLangBtns = $$('.lang-toggle-btn');
  allLangBtns.forEach(btn => {
    const btnLang = btn.getAttribute('data-lang');
    const isActive = btnLang === initialLang;
    toggleClass(btn, 'is-active', isActive);
    setAttr(btn, 'aria-pressed', isActive);
  });

  applyLanguage(initialLang);
}
