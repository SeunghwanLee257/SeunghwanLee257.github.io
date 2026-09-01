import { loadFHE16Worker } from './dist/fhe16-web.mjs?v=58';

function t(en, ko) {
  return document.documentElement.classList.contains('lang-ko') ? ko : en;
}
// ─── Card constants ────────────────────────────────────────────────────────────
const RANKS = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const SUITS = ['♣','♦','♥','♠'];
const SUIT_COLOR = ['black','red','red','black'];
const CAT_EN = ['High Card','One Pair','Two Pair','Trips','Straight','Flush','Full House','Quads','Straight Flush'];
const CAT_KO = ['하이 카드','원 페어','투 페어','트리플','스트레이트','플러시','풀 하우스','포 카드','스트레이트 플러시'];

// ─── Deck ──────────────────────────────────────────────────────────────────────
function makeDeck() {
  const d = [];
  for (let s = 0; s < 4; s++) for (let r = 0; r < 13; r++) d.push({ r, s });
  return d;
}
function shuffleDeck(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// ─── Card HTML ────────────────────────────────────────────────────────────────
function cardHTML(card, faceUp = true) {
  if (!faceUp) return `<div class="pcard back"></div>`;
  const col = SUIT_COLOR[card.s];
  return `<div class="pcard ${col}">
    <span class="pr">${RANKS[card.r]}</span>
    <span class="ps">${SUITS[card.s]}</span>
  </div>`;
}

// ═════════════════════════════════════════════════════════════════════════════
//  FHE PRIMITIVE WRAPPERS
//  plain JS로 정확성을 검증하고, 각 API의 실제 BR 횟수로 비용을 추정한다.
//  특히 MUX는 XOR + AND_XOR로 명시적으로 내리므로 호출 1회 = 2 PBS이다.
// ═════════════════════════════════════════════════════════════════════════════
let _PBS = 0;
const AND   = (a, b)   => { _PBS++; return a & b; };       // _FHE16_AND
const OR    = (a, b)   => { _PBS++; return a | b; };       // _FHE16_OR
const NOT   = a        => 1 - a;                           // free (negacyclic)
const MUX1  = (s,a,b)  => { _PBS += 2; return s ? a : b; }; // 1-bit MUX: 2 PBS
const MUXN  = (s,a,b)  => { _PBS += 2; return s ? a : b; }; // _FHE16_MUX: 2 PBS
const GE_C  = (a, c)   => { _PBS++; return (a >= c) ? 1 : 0; }; // _FHE16_GE_CONSTANT_I32
const EQ_C  = (a, c)   => { _PBS++; return (a === c) ? 1 : 0; };
const GT_C  = (a, c)   => { _PBS++; return (a >  c) ? 1 : 0; };

// OR-reduce: n개 비트 → 1 (n-1 PBS)
function OR_reduce(bits) {
  let r = bits[0];
  for (let i = 1; i < bits.length; i++) r = OR(r, bits[i]);
  return r;
}

// ADD-reduce 1-bit array (half-adder tree): (n-1) PBS
function bit_sum(bits) {
  let s = bits[0];
  for (let i = 1; i < bits.length; i++) { _PBS++; s += bits[i]; }
  return s;
}

// ─── Oblivious argmax ─────────────────────────────────────────────────────────
// flag[0..12] 중 가장 높은 rank를 암호문 상태에서 찾기
// r=12부터 내려오며: 처음 flag[r]=1인 r을 result에 기록
// 비용: 13 × (AND[1] + MUXN[2] + OR[1]) = 52 PBS
function oblHighest(flag) {
  let found = 0, result = -1;
  for (let r = 12; r >= 0; r--) {
    const is_new = AND(flag[r], NOT(found));   // 1 PBS
    result = MUXN(is_new, r, result);          // 2 PBS  (r은 public constant)
    found  = OR(found, flag[r]);               // 1 PBS
  }
  return { v: result, found };  // 52 PBS total
}

// 두 번째로 높은 rank 찾기 (first_rank를 제외)
// 비용: 13 × (EQ_C[1] + AND[1] + AND[1] + MUXN[2] + OR[1]) = 78 PBS
function oblSecond(flag, first_rank) {
  let found = 0, result = -1;
  for (let r = 12; r >= 0; r--) {
    const not_first = NOT(EQ_C(first_rank, r)); // 1 PBS (EQ_C)  + NOT free
    const eligible  = AND(flag[r], not_first);  // 1 PBS
    const is_new    = AND(eligible, NOT(found)); // 1 PBS
    result = MUXN(is_new, r, result);            // 2 PBS
    found  = OR(found, eligible);               // 1 PBS
  }
  return { v: result, found };  // 78 PBS total
}

// top-k kicker 찾기 (exclude mask 적용)
// 사용 rank 제외하고 남은 highest single-count rank k개 추출
function oblKickers(singles_flag, exclude1, exclude2, k) {
  const results = [];
  let found = 0;
  let ex1_used = exclude1 >= 0 ? 1 : 0;
  let ex2_used = exclude2 >= 0 ? 1 : 0;
  for (let i = 0; i < k; i++) {
    let f2 = 0, res = -1;
    for (let r = 12; r >= 0; r--) {
      // exclude already-found kickers and the two excluded ranks
      const skip1 = (exclude1 >= 0) ? EQ_C(exclude1, r) : 0;  // 1 PBS
      const skip2 = (exclude2 >= 0) ? EQ_C(exclude2, r) : 0;  // 1 PBS
      const skip_prev = (i > 0) ? EQ_C(results[i-1], r) : 0;  // 1 PBS (if i>0)
      const skip = OR_reduce([skip1, skip2, skip_prev, f2].filter((_, idx) => {
        if (idx === 0) return exclude1 >= 0;
        if (idx === 1) return exclude2 >= 0;
        if (idx === 2) return i > 0;
        return false; // f2 handled separately below
      }).concat([0]).slice(0,-1).concat([0]));
      // Simplified: just track via found flag
      const eligible = AND(singles_flag[r], NOT(f2)); // 1 PBS
      const is_new   = AND(eligible, NOT(f2));         // (already included)
      res  = MUXN(eligible, r, res);
      f2   = OR(f2, eligible);
    }
    results.push(res);
  }
  return results;
}

// ─── Simplified kicker extractor ──────────────────────────────────────────────
// flag[r]=1인 rank 중 highest k개를 oblivious하게 추출
// 각 pass: 52 PBS + 이전 결과 제외 (13 EQ_C = 13 PBS) → pass당 ~65 PBS
function oblTopK(flag, k, exclude = []) {
  const results = [];
  for (let pass = 0; pass < k; pass++) {
    let found = 0, result = -1;
    for (let r = 12; r >= 0; r--) {
      // 이미 선택된 rank 또는 exclude rank는 skip
      let skip = 0;
      for (const ex of [...exclude, ...results]) {
        if (ex >= 0) skip = OR(skip, EQ_C(ex, r)); // 1 PBS per exclude
      }
      const eligible = AND(flag[r], NOT(skip));   // 1 PBS
      const is_new   = AND(eligible, NOT(found));  // 1 PBS
      result = MUXN(is_new, r, result);            // 2 PBS
      found  = OR(found, eligible);               // 1 PBS
    }
    results.push(result);
  }
  return results;
}

// ═════════════════════════════════════════════════════════════════════════════
//  7-CARD HAND EVALUATOR  —  FHE-OBLIVIOUS VERSION
//  전체 분기를 제거하고 모든 경로를 계산한 뒤 MUX로 선택
// ═════════════════════════════════════════════════════════════════════════════
function evaluateHand7(hole1, hole2, community) {
  _PBS = 0;
  const ops = [];
  const snap = label => { ops.push({ label, pbs: _PBS }); };

  // ── 1. rank_count / suit_count ────────────────────────────────────────────
  // FHE: one-hot ADD = 0 PBS
  const rc = new Array(13).fill(0);
  const sc = new Array(4).fill(0);
  const by_suit = [[], [], [], []];
  for (const c of community) { rc[c.r]++; sc[c.s]++; by_suit[c.s].push(c); }
  rc[hole1.r]++; sc[hole1.s]++; by_suit[hole1.s].push(hole1);
  rc[hole2.r]++; sc[hole2.s]++; by_suit[hole2.s].push(hole2);
  snap('① rank/suit count (one-hot ADD)');  // 0 PBS

  // ── 2. per-rank indicators (모두 계산, 분기 없음) ─────────────────────────
  const is_quad   = rc.map(c => GE_C(c, 4));   // 13 PBS
  const is_trip   = rc.map(c => EQ_C(c, 3));   // 13 PBS
  const is_pair   = rc.map(c => EQ_C(c, 2));   // 13 PBS
  const is_single = rc.map(c => EQ_C(c, 1));   // 13 PBS
  const rp        = rc.map(c => GT_C(c, 0));   // 13 PBS  (rank_presence)
  snap('② per-rank indicators ×5×13');

  // ── 3. group counts ───────────────────────────────────────────────────────
  const n_quads = bit_sum(is_quad);   // 12 PBS
  const n_trips = bit_sum(is_trip);   // 12 PBS
  const n_pairs = bit_sum(is_pair);   // 12 PBS
  snap('③ group counts (bit_sum ×3)');

  // ── 4. flush detection ────────────────────────────────────────────────────
  const fl = sc.map(c => GE_C(c, 5));          // 4 PBS
  const has_flush = OR_reduce(fl);              // 3 PBS
  // flush suit (oblivious: scan 4 suits)
  let flush_suit_enc = -1, fs_found = 0;
  for (let s = 0; s < 4; s++) {
    const is_new = AND(fl[s], NOT(fs_found));   // 1 PBS
    flush_suit_enc = MUXN(is_new, s, flush_suit_enc); // 2 PBS
    fs_found = OR(fs_found, fl[s]);             // 1 PBS
  }
  snap('④ flush detection');

  // ── 5. rank_presence straight check ──────────────────────────────────────
  // 9 windows of 5 consecutive ranks + wheel
  const win = [];
  for (let h = 4; h <= 12; h++) {
    // AND of 5 consecutive presence bits: 4 PBS per window
    let w = rp[h];
    for (let k = 1; k <= 4; k++) w = AND(w, rp[h-k]);
    win.push({ h, w });  // 4 PBS per window = 36 PBS
  }
  // Wheel: A-2-3-4-5
  let wheel = rp[12];
  for (const r of [0,1,2,3]) wheel = AND(wheel, rp[r]);  // 4 PBS
  win.push({ h: 3, w: wheel });  // h=3 means '5'-high

  // oblivious highest straight (scan from high to low)
  let st_found = 0, straight_high = -1;
  for (const { h, w } of [...win].sort((a,b) => b.h - a.h)) {
    const is_new = AND(w, NOT(st_found));      // 1 PBS
    straight_high = MUXN(is_new, h, straight_high); // 2 PBS
    st_found = OR(st_found, w);               // 1 PBS
  }
  const has_straight = st_found;
  snap('⑤ straight detection');

  // ── 6. straight flush detection ───────────────────────────────────────────
  // suit_rp[s][r] = rp[r] AND card_is_suit[s]
  // For each rank, check if card is in flush_suit:
  //   suit_rp[r] = AND(rp[r], suit_match[r])  where suit_match = 0 PBS (public community + enc hole)
  // Simplified: build from by_suit + hole suit bits
  const sf_rp = new Array(13).fill(0);
  if (flush_suit_enc >= 0) {
    for (const c of by_suit[flush_suit_enc]) sf_rp[c.r] = 1;
    // FHE: these are public for community; for hole cards need AND(rp[r], suit_match[r])
    // 2 hole cards × 1 AND per rank = 2 PBS per rank × 13 = 26 PBS (absorbed here)
    _PBS += 26;
  }
  const sf_win = [];
  for (let h = 4; h <= 12; h++) {
    let w = sf_rp[h];
    for (let k = 1; k <= 4; k++) w = AND(w, sf_rp[h-k] ? 1 : 0); // 4 PBS
    sf_win.push({ h, w });
  }
  let wh2 = sf_rp[12]; for (const r of [0,1,2,3]) wh2 = AND(wh2, sf_rp[r] ? 1 : 0);
  sf_win.push({ h: 3, w: wh2 });
  let sf_found2 = 0, sf_high = -1;
  for (const { h, w } of [...sf_win].sort((a,b) => b.h - a.h)) {
    const is_new = AND(w, NOT(sf_found2));     // 1 PBS
    sf_high = MUXN(is_new, h, sf_high);        // 2 PBS
    sf_found2 = OR(sf_found2, w);              // 1 PBS
  }
  const has_sf = sf_found2;
  snap('⑥ straight flush detection');

  // ── 7. ALL category flags (동시 계산) ─────────────────────────────────────
  const has_quads  = GE_C(n_quads, 1);                               // 1 PBS
  const has_fh     = AND(GE_C(n_trips, 1),                           // 2 PBS
                         OR(GE_C(n_pairs, 1), GE_C(n_trips, 2)));    // 2 PBS
  // has_flush, has_straight, has_sf: already computed above
  const has_trips  = AND(GE_C(n_trips, 1), EQ_C(n_pairs, 0));        // 2 PBS
  const has_2pair  = GE_C(n_pairs, 2);                               // 1 PBS
  const has_1pair  = AND(EQ_C(n_pairs, 1), EQ_C(n_trips, 0));        // 2 PBS
  snap('⑦ category flags (all computed)');

  // ── 8. rank/kicker extraction (oblivious) ─────────────────────────────────
  // 각 카테고리에 필요한 rank를 조건 분기 없이 추출

  // Quad rank + kicker
  const q_rank = oblHighest(is_quad);                           // 52 PBS
  const q_kick = oblTopK(rc.map((c,r) => GE_C(c+0,1) & NOT(EQ_C(r, q_rank.v))), 1);
  // Simplified: use single kicker from non-quad ranks
  let qk = -1, qk_f = 0;
  for (let r = 12; r >= 0; r--) {
    const not_quad = NOT(is_quad[r]);
    const elig = AND(rp[r], not_quad);                          // 1 PBS
    const is_new = AND(elig, NOT(qk_f));                        // 1 PBS
    qk = MUXN(is_new, r, qk);                                   // 2 PBS
    qk_f = OR(qk_f, elig);                                     // 1 PBS
  }

  // Trip rank (highest)
  const t_rank = oblHighest(is_trip);                           // 52 PBS

  // Pair rank1 (highest pair)
  const p1_rank = oblHighest(is_pair);                          // 52 PBS
  // Pair rank2 (second pair, for FH second trip used as pair)
  const p2_rank = oblSecond(is_pair, p1_rank.v);                // 78 PBS

  // FH pair: could be second trip acting as pair
  let fh_pair = p1_rank.v;
  // if trips.length >= 2 (n_trips >= 2), second trip is better pair candidate
  const two_trips = GE_C(n_trips, 2);                           // 1 PBS
  const t2_rank = oblSecond(is_trip, t_rank.v);                 // 78 PBS
  fh_pair = MUXN(two_trips, t2_rank.v, fh_pair);               // 2 PBS

  // Flush top-5: top 5 ranks in flush suit
  const flush_rp = sf_rp.map(v => v);  // reuse sf_rp for now (same suit)
  const flush_ranks = oblTopK(flush_rp.map((v,r) => v ? GT_C(0, 0) : 0), 5);
  // Actual flush ranks (plaintext: for demo, track by_suit)
  const actual_flush_ranks = flush_suit_enc >= 0
    ? by_suit[flush_suit_enc].map(c => c.r).sort((a,b) => b-a).slice(0,5).concat([-1,-1,-1,-1,-1]).slice(0,5)
    : [-1,-1,-1,-1,-1];

  // Straight high: already in straight_high
  // SF high: already in sf_high

  // Trips kickers (top 2 non-trip ranks)
  const non_trip_rp = rp.map((v, r) => AND(v, NOT(is_trip[r]))); // 13 PBS
  const tk = [];
  let tk_f = 0;
  for (let ki = 0; ki < 2; ki++) {
    let kres = -1, kf = 0;
    for (let r = 12; r >= 0; r--) {
      const skip = ki > 0 ? EQ_C(tk[ki-1], r) : 0;            // 1 PBS if ki>0
      const elig = AND(non_trip_rp[r], NOT(skip));             // 1 PBS
      const is_n = AND(elig, NOT(kf));                          // 1 PBS
      kres = MUXN(is_n, r, kres);                              // 2 PBS
      kf   = OR(kf, elig);                                     // 1 PBS
    }
    tk.push(kres);
  }

  // Two-pair: pair1, pair2, kicker
  // pair ranks already computed as p1_rank, p2_rank
  let tp_kicker = -1, tp_kf = 0;
  for (let r = 12; r >= 0; r--) {
    const skip = OR(EQ_C(p1_rank.v, r), EQ_C(p2_rank.v, r));  // 2 PBS
    const elig = AND(rp[r], NOT(skip));                         // 1 PBS
    const is_n = AND(elig, NOT(tp_kf));                         // 1 PBS
    tp_kicker = MUXN(is_n, r, tp_kicker);                       // 2 PBS
    tp_kf = OR(tp_kf, elig);                                   // 1 PBS
  }

  // One-pair: pair rank + top 3 kickers
  const op_kickers = [];
  let op_kf = 0;
  for (let ki = 0; ki < 3; ki++) {
    let kres = -1, kf2 = 0;
    for (let r = 12; r >= 0; r--) {
      const skip_pair = EQ_C(p1_rank.v, r);                    // 1 PBS
      const skip_prev = ki > 0 ? EQ_C(op_kickers[ki-1], r) : 0; // 1 PBS if ki>0
      const skip = OR(skip_pair, skip_prev);                    // 1 PBS
      const elig = AND(rp[r], NOT(skip));                       // 1 PBS
      const is_n = AND(elig, NOT(kf2));                         // 1 PBS
      kres = MUXN(is_n, r, kres);                              // 2 PBS
      kf2  = OR(kf2, elig);                                    // 1 PBS
    }
    op_kickers.push(kres);
  }

  // High card: top 5
  const hc = [];
  for (let ki = 0; ki < 5; ki++) {
    let kres = -1, kf2 = 0;
    for (let r = 12; r >= 0; r--) {
      const skip_prev = ki > 0 ? EQ_C(hc[ki-1], r) : 0;       // 1 PBS
      const elig = AND(rp[r], NOT(skip_prev));                  // 1 PBS
      const is_n = AND(elig, NOT(kf2));                         // 1 PBS
      kres = MUXN(is_n, r, kres);                              // 2 PBS
      kf2  = OR(kf2, elig);                                    // 1 PBS
    }
    hc.push(kres);
  }
  snap('⑧ oblivious rank extraction (all categories)');

  // ── 9. score for each category ────────────────────────────────────────────
  function enc(cat, ...rks) {
    let s = cat;
    for (let i = 0; i < 5; i++) s = (s << 4) | ((rks[i] ?? 0) & 0xF);
    return s;
  }
  const score_sf  = enc(8, sf_high);
  const score_q   = enc(7, q_rank.v, qk);
  const score_fh  = enc(6, t_rank.v, fh_pair);
  const score_fl  = enc(5, ...actual_flush_ranks);
  const score_st  = enc(4, straight_high);
  const score_tr  = enc(3, t_rank.v, tk[0], tk[1]);
  const score_2p  = enc(2, p1_rank.v, p2_rank.v, tp_kicker);
  const score_1p  = enc(1, p1_rank.v, ...op_kickers);
  const score_hc  = enc(0, ...hc);

  // ── 10. MUX cascade (높은 카테고리 우선) ─────────────────────────────────
  // 8단계 MUX: 16 PBS
  let score = score_hc;
  score = MUXN(has_1pair,    score_1p, score);
  score = MUXN(has_2pair,    score_2p, score);
  score = MUXN(has_trips,    score_tr, score);
  score = MUXN(has_straight, score_st, score);
  score = MUXN(has_flush,    score_fl, score);
  score = MUXN(has_fh,       score_fh, score);
  score = MUXN(has_quads,    score_q,  score);
  score = MUXN(has_sf,       score_sf, score);
  snap('⑨ MUX cascade (9-way)');

  // ── Category 역산 (로그용) ────────────────────────────────────────────────
  let cat = 0;
  cat = MUXN(has_1pair, 1, cat);
  cat = MUXN(has_2pair, 2, cat);
  cat = MUXN(has_trips, 3, cat);
  cat = MUXN(has_straight, 4, cat);
  cat = MUXN(has_flush, 5, cat);
  cat = MUXN(has_fh, 6, cat);
  cat = MUXN(has_quads, 7, cat);
  cat = MUXN(has_sf, 8, cat);

  const totalPbs = _PBS;
  // Convert ops to delta format
  const opLog = [];
  let prev = 0;
  for (const op of ops) {
    opLog.push({ label: op.label, pbs: op.pbs - prev });
    prev = op.pbs;
  }

  return {
    category: cat,
    score,
    name: t(CAT_EN[cat], CAT_KO[cat]),
    ops: opLog,
    pbs: totalPbs,
  };
}

// ─── FHE state ────────────────────────────────────────────────────────────────
let fhe = null;

async function initFHE() {
  setStatus(t('Loading FHE module…', 'FHE 모듈 로딩 중…'));
  try {
    fhe = await loadFHE16Worker({
      build: 'auto',
      policy: 'stable',
      baseUrl: './',
      includeCiphertextBytes: true,
    });
    setStatus(t('Generating eval key…', '평가 키 생성 중…'));
    await fhe.generateKeys();
    setStatus(t('FHE ready — deal shuffles with server, Player B cards stay encrypted', 'FHE 준비 완료 — 딜 시 서버와 함께 셔플, Player B 카드는 암호화 유지'));
    setBtnState();
  } catch (e) {
    setStatus(`FHE load error: ${e.message}`);
  }
}

// ─── Game state ───────────────────────────────────────────────────────────────
let gameState = 'idle';
let holeA = [], community = [];
let holeBCiphertexts = null; // encrypted Player B cards — plaintext stays in worker

const $ = id => document.getElementById(id);

function renderCards(containerId, cards, faceUp) {
  $(containerId).innerHTML = cards.map(c => cardHTML(c, faceUp)).join('');
}
function renderBacks(containerId, n) {
  $(containerId).innerHTML = Array(n).fill('<div class="pcard back"></div>').join('');
}
function renderCommunity(revealCount) {
  const slots = $('community-cards');
  slots.innerHTML = '';
  for (let i = 0; i < 5; i++) slots.innerHTML += cardHTML(community[i], i < revealCount);
}
function setStatus(txt) { $('pokerStatus').textContent = txt; }
function setBtnState() {
  const fheReady = fhe?.keysReady ?? false;
  $('dealBtn').disabled     = gameState === 'showdown' || gameState === 'dealing' || !fheReady;
  $('flopBtn').disabled     = gameState !== 'dealt';
  $('turnBtn').disabled     = gameState !== 'flop';
  $('riverBtn').disabled    = gameState !== 'turn';
  $('showdownBtn').disabled = gameState !== 'river' || !fheReady;
}
function clearResult() {
  $('resultBox').style.display = 'none';
  $('pbsBox').textContent = '';
  $('opsLog').innerHTML = '';
  $('handLabelA').textContent = '?';
  $('handLabelB').textContent = '?';
}

function renderHoleBEncrypted(ciphertexts) {
  const container = $('holeB');
  if (!ciphertexts) { renderBacks('holeB', 2); return; }
  container.innerHTML = ciphertexts.map(ct => {
    const hex = ct.bytes
      ? Array.from(ct.bytes.slice(0, 6)).map(b => b.toString(16).padStart(2,'0')).join('')
      : '??????';
    return `<div class="pcard back" title="FHE-encrypted card">
      <span style="font-size:8px;color:#7ec8e3;font-family:monospace;padding:2px;word-break:break-all">${hex}…</span>
    </div>`;
  }).join('');
}

async function deal() {
  gameState = 'dealing';
  setBtnState();
  clearResult();
  renderBacks('holeA', 2);
  renderBacks('holeB', 2);
  $('community-cards').innerHTML = Array(5).fill('<div class="pcard empty"></div>').join('');

  // Phase 1: Player A contributes random seed
  const seedA = Array.from(crypto.getRandomValues(new Uint32Array(52)));
  setStatus(t('Player B shuffling (server-side)…', 'Player B가 섞는 중 (서버)…'));

  // Phase 2: Worker combines seedA with its own seed, deals, FHE-encrypts Player B's cards
  const dealResult = await fhe.runDeal(seedA);
  holeA      = dealResult.holeA;
  community  = dealResult.community;
  holeBCiphertexts = dealResult.holeBCiphertexts;

  renderCards('holeA', holeA, true);
  renderHoleBEncrypted(holeBCiphertexts);
  renderCommunity(0);
  gameState = 'dealt';
  setStatus(t('Reveal the Flop  (Player B\'s cards are FHE-encrypted)', 'Flop 공개  (Player B 카드는 FHE 암호화됨)'));
  setBtnState();
}
function flop()  { renderCommunity(3); gameState = 'flop';  setStatus(t('Reveal the Turn', 'Turn을 공개하세요'));    setBtnState(); }
function turn()  { renderCommunity(4); gameState = 'turn';  setStatus(t('Reveal the River', 'River를 공개하세요'));   setBtnState(); }
function river() { renderCommunity(5); gameState = 'river'; setStatus(t('Showdown: evaluate hands', '쇼다운: 핸드를 평가하세요')); setBtnState(); }

function ctBytesToHex(bytes, maxBytes = 64) {
  const rows = [];
  const len = Math.min(bytes.length, maxBytes);
  for (let i = 0; i < len; i += 8) {
    rows.push(Array.from(bytes.slice(i, Math.min(i + 8, len)), b => b.toString(16).padStart(2, '0')).join(' '));
  }
  return rows.join('\n') + `\n… (${bytes.length} bytes total)`;
}

const CAT_EN_SHORT = ['High Card','One Pair','Two Pair','Trips','Straight','Flush','Full House','Quads','Str.Flush'];
const CAT_KO_SHORT = ['하이카드','원 페어','투 페어','트리플','스트레이트','플러시','풀 하우스','포 카드','스트레이트플러시'];
function score8ToName(s8) {
  const cat = (s8 >> 4) & 0xF;
  return t(CAT_EN_SHORT[cat] ?? '?', CAT_KO_SHORT[cat] ?? '?');
}

async function showdown() {
  // Player A evaluates their own hand (browser has plaintext)
  const resA = evaluateHand7(holeA[0], holeA[1], community);
  const score8A = (resA.score >> 16) & 0xFF;

  renderCards('holeA', holeA, true);
  // Player B's cards stay encrypted until decrypt reveal
  renderHoleBEncrypted(holeBCiphertexts);

  $('handLabelA').textContent = resA.name;
  $('handLabelA').className = 'hand-label';
  $('handLabelB').textContent = t('(encrypted)', '(암호화됨)');
  $('handLabelB').className = 'hand-label';

  $('pbsBox').textContent = `${t('Player A hand-eval PBS', 'Player A 핸드 평가 PBS')}: ${resA.pbs}  +  ${t('FHE GT compare', 'FHE GT 비교')} (8-bit)`;

  const logLines = [
    { label: '─── Player A (browser) ───', pbs: null },
    ...resA.ops,
    { label: t('─── Player B (server eval + FHE GT) ───', '─── Player B (서버 평가 + FHE GT) ───'), pbs: null },
    { label: t('FHE GT compare (8-bit encrypted)', 'FHE GT 비교 (8-bit 암호화)'), pbs: '실행 중…' },
  ];
  $('opsLog').innerHTML = logLines.map(op => {
    if (op.pbs === null) return `<div class="op-section">${op.label}</div>`;
    const cls = op.pbs === 0 ? 'op-free' : 'op-cost';
    return `<div class="op-row ${cls}">
      <span class="op-label">${op.label}</span>
      <span class="op-pbs">${op.pbs === 0 ? 'free' : op.pbs}</span>
    </div>`;
  }).join('');

  gameState = 'showdown';
  setBtnState();

  const box = $('resultBox');
  box.style.display = 'block';
  box.className = 'result-box cipher-pending';
  box.innerHTML = `<div class="cipher-hex-label">${t('Server evaluating Player B hand + FHE GT…', '서버: Player B 핸드 평가 + FHE GT 실행 중…')}</div>`;
  setStatus(t('FHE computing encrypted comparison…', 'FHE 암호화 비교 연산 중…'));

  try {
    // Server evaluates Player B's hand (using stored encrypted cards) + does FHE GT
    const r = await fhe.runPokerShowdown(score8A, community);

    const lastRow = $('opsLog').querySelector('.op-row:last-child .op-pbs');
    if (lastRow) lastRow.textContent = `${r.computeMs.toFixed(0)} ms`;

    const hexStr = r.ctBytes ? ctBytesToHex(r.ctBytes, 64) : '(no ciphertext)';
    const totalBytes = r.ctBytes ? r.ctBytes.length : 0;
    box.innerHTML = `
      <div class="cipher-hex-label">${t('Encrypted GT result ciphertext', '암호화된 GT 결과 암호문')} (${totalBytes} bytes)</div>
      <pre class="cipher-hex-dump">${hexStr}</pre>
      <button class="decrypt-reveal-btn">${t('Decrypt + reveal Player B cards', '복호화 + Player B 카드 공개')}</button>
    `;

    const winner = r.tie ? 0 : (r.aWins ? 1 : -1);
    box.querySelector('.decrypt-reveal-btn').addEventListener('click', () => {
      // Reveal Player B's actual cards (sent from server only at reveal time)
      if (r.holeBCards) renderCards('holeB', r.holeBCards, true);

      const nameb = score8ToName(r.scoreB8 ?? 0);
      $('handLabelA').textContent = resA.name;
      $('handLabelB').textContent = nameb;
      $('handLabelA').className = `hand-label ${winner===1?'win':winner===0?'tie':'lose'}`;
      $('handLabelB').className = `hand-label ${winner===-1?'win':winner===0?'tie':'lose'}`;
      if (winner === 1)      { box.className='result-box win'; box.innerHTML=`<span class="result-icon">WIN</span><span class="result-text">${t('Player A wins!', 'Player A 승리!')}</span>`; }
      else if (winner === -1){ box.className='result-box win'; box.innerHTML=`<span class="result-icon">WIN</span><span class="result-text">${t('Player B wins!', 'Player B 승리!')}</span>`; }
      else                   { box.className='result-box tie'; box.innerHTML=`<span class="result-icon">TIE</span><span class="result-text">${t('Tie — Split Pot', '무승부 — Split Pot')}</span>`; }
      setStatus(t('Game over', '게임 종료'));
    }, { once: true });

    setStatus(t('Encrypted result — click button to decrypt and reveal', '암호화된 결과 — 버튼을 눌러 복호화 및 카드 공개'));
  } catch (e) {
    box.innerHTML = `<div class="cipher-hex-label">FHE error: ${e.message}</div>`;
    setStatus(t('FHE error', 'FHE 오류'));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  $('dealBtn').addEventListener('click', () => deal());
  $('flopBtn').addEventListener('click', flop);
  $('turnBtn').addEventListener('click', turn);
  $('riverBtn').addEventListener('click', river);
  $('showdownBtn').addEventListener('click', () => showdown());
  setBtnState();
  renderBacks('holeA', 2);
  renderBacks('holeB', 2);
  $('community-cards').innerHTML = Array(5).fill('<div class="pcard empty"></div>').join('');
  initFHE();
});
