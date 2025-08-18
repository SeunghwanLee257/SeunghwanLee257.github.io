/* =========================================================
   WaLLLnut Landing - App Script (i18n + UI, safe edition)
   ========================================================= */
(function () {
  'use strict';

  /* -------- Helpers -------- */
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (n, a, b) { return Math.max(a, Math.min(b, n)); };
  var stripTags = function (h) { return String(h).replace(/<[^>]*>/g, ''); };
  var norm = function (s) { return String(s).replace(/\s+/g, ' ').trim(); };

  /* -------- i18n -------- */
  var LANG_CODES = { en: 'eng', ko: 'kor' };
  // 기존 딕셔너리가 window.I18N로 이미 주입돼 있다고 가정
  var baseI18N = window.I18N || {};
  window.I18N = baseI18N;

  /* 번역 제외 */
  var I18N_EXCLUDE = [
    '.material-icons',
    '.svc-title',
    '.property-title',
    '.inactive-title',
    '.goal-dropdown-icon'
  ];
  var EXCLUDE_SELECTOR = I18N_EXCLUDE.join(',');

  function isExcluded(el) {
    if (!el) return false;
    if (EXCLUDE_SELECTOR && el.closest(EXCLUDE_SELECTOR)) return true;
    if (el.hasAttribute('data-no-i18n')) return true;
    return false;
  }

  if (typeof window.applyI18n !== 'function') {
    window.applyI18n = function applyI18n(lang) {
      var fb = 'en';
      document.documentElement.setAttribute('lang', lang);

      if (EXCLUDE_SELECTOR) {
        $$(EXCLUDE_SELECTOR).forEach(function (el) { el.removeAttribute('data-i18n'); });
      }

      $$('[data-i18n]').forEach(function (el) {
        if (isExcluded(el)) return;
        var key = el.getAttribute('data-i18n');
        var val =
          (window.I18N[lang] && window.I18N[lang][key]) ||
          (window.I18N[fb] && window.I18N[fb][key]) ||
          '';
        if (val) el.innerHTML = val;
      });
    };
  }

  function getSavedLang() { try { return localStorage.getItem('lang'); } catch (e) { return null; } }
  function saveLang(v) { try { localStorage.setItem('lang', v); } catch (e) {} }

  function setLanguage(lang) {
    saveLang(lang);
    window.applyI18n(lang);
    var btnText = $('#langBtnText');
    if (btnText) btnText.textContent = LANG_CODES[lang] || lang;
    var menu = $('#langMenu');
    if (menu) {
      $$('#langMenu [role="option"]').forEach(function (li) {
        li.setAttribute('aria-selected', li.getAttribute('data-lang') === lang ? 'true' : 'false');
      });
    }
  }

  /* -------- i18n 오토와이어 -------- */
  function setKey(el, key) {
    if (!el) return;
    if (isExcluded(el)) return;
    if (!el.hasAttribute('data-i18n')) el.setAttribute('data-i18n', key);
  }
  function setKeyBySel(sel, key) { setKey($(sel), key); }
  function setKeyList(sel, keys) {
    var list = $$(sel);
    keys.forEach(function (k, i) { if (list[i]) setKey(list[i], k); });
  }

  function autowireBySelectors() {
    setKeyList('.nav a', ['nav.tech','nav.service','nav.goal','nav.exp','nav.team','nav.advisors']);

    setKeyBySel('#tech-label','sec.tech');
    setKeyBySel('#service-label','sec.service');
    setKeyBySel('#goal-label','sec.goal');
    setKeyBySel('#exp-label','sec.exp');
    setKeyBySel('#team-label','sec.team');

    // countdown 라벨 (범용 선택자)
    setKeyList('.count-wrap .time-label', ['label.days','label.hours','label.seconds']);
    setKeyBySel('#sec02 .strip p', 'slogan');

    // Tech A
    setKeyBySel('#panel-a .tech-title-lg#tab-a', 'tech.a.title');
    setKeyBySel('#panel-a .tech-subtitle', 'tech.a.subtitle');
    setKeyBySel('#panel-a .tech-body', 'tech.a.body');
    setKeyBySel('#panel-a .tech-ref', 'tech.a.ref');
    $$('#panel-a .more-btn').forEach(function (b) { setKey(b, 'btn.more'); });

    // Tech B
    setKeyBySel('#panel-b .tech-title-lg#tab-b', 'tech.b.title');
    setKeyBySel('#panel-b .tech-subtitle', 'tech.b.subtitle');
    var contentB = $('#panel-b .content');
    if (contentB) {
      var ps = $$('.content p', $('#panel-b'));
      var keyP = null;
      ps.forEach(function (p) {
        if (!p.classList.contains('tech-subtitle') && !p.classList.contains('tech-body') && !keyP) keyP = p;
      });
      if (keyP) setKey(keyP, 'tech.b.key');
    }
    setKeyBySel('#panel-b .tech-body', 'tech.b.body');
    setKeyBySel('#panel-b .tech-ref', 'tech.b.ref');
    $$('#panel-b .more-btn').forEach(function (b) { setKey(b, 'btn.more'); });

    // Service slides (titles are excluded)
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
    $$('.goal-dropdown-card:nth-of-type(2) .item-drop p:first-child')
      .forEach(function (p) { setKey(p, 'goal.hash.disclose'); });

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

    // Advisors / Footer
    setKeyBySel('#sec08 .s08-comt-inner .s08-title','advisors.title');
    var footerCopy = $('footer .container');
    if (footerCopy && !footerCopy.hasAttribute('data-i18n')) footerCopy.setAttribute('data-i18n','footer.copy');
  }

  function autowireByTextMatch() {
    var map = new Map();
    var en = (window.I18N && window.I18N.en) || {};
    Object.keys(en).forEach(function (k) { map.set(norm(stripTags(en[k])), k); });
    var nodes = $$('main, header, footer')
      .map(function (root) { return Array.prototype.slice.call(root.querySelectorAll('a,h1,h2,h3,h4,h5,h6,p,button,div,span,li')); })
      .reduce(function (a, b) { return a.concat(b); }, [])
      .filter(function (el) { return !el.hasAttribute('data-i18n') && !isExcluded(el); });

    nodes.forEach(function (el) {
      var key = map.get(norm(el.textContent || ''));
      if (key) el.setAttribute('data-i18n', key);
    });
  }

  /* -------- Language dropdown -------- */
  function openLangMenu() {
    var btn = $('#langBtn'), menu = $('#langMenu');
    if (!btn || !menu) return;
    menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
    var current = menu.querySelector('[aria-selected="true"]') || menu.querySelector('[role="option"]');
    $$('#langMenu [role="option"]').forEach(function (li) { li.classList.remove('focused'); });
    if (current) current.classList.add('focused');
    document.addEventListener('click', onDocClick, { capture: true });
    document.addEventListener('keydown', onMenuKeys);
  }
  function closeLangMenu() {
    var btn = $('#langBtn'), menu = $('#langMenu');
    if (!btn || !menu) return;
    menu.hidden = true; btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onDocClick, { capture: true });
    document.removeEventListener('keydown', onMenuKeys);
  }
  function onDocClick(e) {
    var menu = $('#langMenu'), btn = $('#langBtn');
    if (!menu || !btn) return;
    if (!menu.contains(e.target) && !btn.contains(e.target)) closeLangMenu();
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
  function onMenuKeys(e) {
    var menu = $('#langMenu'); if (!menu || menu.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); moveLangFocus(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveLangFocus(-1); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      var focused = menu.querySelector('.focused') || menu.querySelector('[aria-selected="true"]');
      if (focused) chooseLang(focused);
    } else if (e.key === 'Escape') {
      e.preventDefault(); closeLangMenu(); var b = $('#langBtn'); if (b) b.focus();
    }
  }
  function chooseLang(li) {
    if (!li) return;
    setLanguage(li.getAttribute('data-lang'));
    closeLangMenu();
    var b = $('#langBtn'); if (b) b.focus();
  }

  /* -------- Smooth nav scroll -------- */
  function getHeaderOffset() {
    var header = $('.header');
    return header ? (header.getBoundingClientRect().height || 0) : 0;
  }
  function smoothScrollTo(targetSelector) {
    var el = $(targetSelector);
    if (!el) return;
    var top = window.scrollY + el.getBoundingClientRect().top - getHeaderOffset() - 16;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }
  function bindNavScroll() {
    $$('.nav a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        smoothScrollTo(a.getAttribute('href'));
      });
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
      head.addEventListener('click', function () { activate(p); });
      head.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(p); }
      });
      head.setAttribute('tabindex', '0');
      head.setAttribute('role', 'button');
      head.setAttribute('aria-controls', p.id || '');
    });
  }

  /* -------- Service slider -------- */
  function initServiceSlider() {
    var track = $('#svc-track');
    var items = $$('#svc-track .svc-item');
    if (!track || !items.length) return;
    var bF = $('#svc-first'), bP = $('#svc-prev'), bN = $('#svc-next'), bL = $('#svc-last');
    var idx = 0;
    function update() {
      track.style.transform = 'translateX(' + (-(idx * 100)) + '%)';
      items.forEach(function (it, i) { it.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
      if (bF) bF.disabled = (idx === 0);
      if (bP) bP.disabled = (idx === 0);
      if (bL) bL.disabled = (idx === items.length - 1);
      if (bN) bN.disabled = (idx === items.length - 1);
    }
    function go(n) { idx = clamp(n, 0, items.length - 1); update(); }
    if (bF) bF.addEventListener('click', function () { go(0); });
    if (bP) bP.addEventListener('click', function () { go(idx - 1); });
    if (bN) bN.addEventListener('click', function () { go(idx + 1); });
    if (bL) bL.addEventListener('click', function () { go(items.length - 1); });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  /* -------- Goal accordion (B안: 정밀 애니메이션) -------- */
  function initGoalAccordion() {
    $$('.goal-dropdown-card').forEach(function (card) {
      var btn = $('.goal-dropdown-header', card);
      var content = $('.goal-dropdown-content', card);
      if (!btn || !content) return;

      // 초기 상태 반영
      function setInitial() {
        var isOpen = btn.getAttribute('aria-expanded') === 'true';
        card.classList.toggle('open', isOpen);
        content.style.overflow = 'hidden';
        content.style.maxHeight = isOpen ? 'none' : '0px';
      }
      setInitial();

      // 전환 종료 후 열림 상태면 auto처럼 동작하도록 max-height 해제
      content.addEventListener('transitionend', function (e) {
        if (e.propertyName !== 'max-height') return;
        if (btn.getAttribute('aria-expanded') === 'true') {
          content.style.maxHeight = 'none';
        }
      });

      btn.addEventListener('click', function () {
        var isOpen = btn.getAttribute('aria-expanded') === 'true';

        if (!isOpen) {
          // 열기
          btn.setAttribute('aria-expanded', 'true');
          card.classList.add('open');
          content.style.maxHeight = '0px';
          void content.offsetHeight; // reflow
          content.style.maxHeight = content.scrollHeight + 'px';
        } else {
          // 닫기
          if (content.style.maxHeight === '' || getComputedStyle(content).maxHeight === 'none') {
            content.style.maxHeight = content.scrollHeight + 'px';
            void content.offsetHeight; // reflow
          }
          btn.setAttribute('aria-expanded', 'false');
          card.classList.remove('open');
          content.style.maxHeight = '0px';
        }
      });
    });
  }

  /* -------- Countdown (deadline 또는 초기값 감소형 + 유닛별 hover-pause) -------- */
  function initCountdown() {
    var wrap = $('.count-wrap');
    if (!wrap) return;

    var elDays  = $('#days', wrap);
    var elHours = $('#hours', wrap);
    var elSecs  = $('#seconds', wrap);
    if (!elDays || !elHours || !elSecs) return;

    // 유닛별 일시정지
    var paused = { days: false, hours: false, seconds: false };
    $$('.time-box', wrap).forEach(function (box) {
      var unit = box.getAttribute('data-unit');
      box.addEventListener('mouseenter', function () { if (unit) paused[unit] = true; });
      box.addEventListener('mouseleave', function () { if (unit) paused[unit] = false; });
    });

    var deadlineStr = wrap.getAttribute('data-deadline');
    var mode = deadlineStr ? 'deadline' : 'manual';

    // 수동 모드 시작값(HTML 숫자 사용)
    var d = parseInt((elDays.textContent || '').replace(/\D+/g,''), 10)  || 0;
    var h = parseInt((elHours.textContent || '').replace(/\D+/g,''), 10) || 0;
    var s = parseInt((elSecs.textContent || '').replace(/\D+/g,''), 10)  || 0;

    function render() {
      if (!paused.days)    elDays.textContent  = String(d);
      if (!paused.hours)   elHours.textContent = String(h).padStart(2,'0');
      if (!paused.seconds) elSecs.textContent  = String(s).padStart(2,'0');
    }

    // 수동 카운트다운(초 → 시 → 일)
    function tickManual() {
      if (d <= 0 && h <= 0 && s <= 0) {
        clearInterval(timerId);
        wrap.setAttribute('aria-label', 'countdown finished');
        return;
      }
      if (paused.seconds) return; // 초가 정지 중이면 전체 진행 정지

      s -= 1;
      if (s < 0) {
        if (paused.hours) { s = 0; return; } // 시가 멈춘 경우 0초에서 대기
        s = 59;
        h -= 1;

        if (h < 0) {
          if (paused.days) { h = 0; return; } // 일이 멈춘 경우 0시에서 대기
          h = 23;
          d = Math.max(0, d - 1);
        }
      }
      render();
    }

    // 데드라인 기반(남은 시간 재계산)
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
  document.addEventListener('DOMContentLoaded', function () {
    var label = $('#langLabel');
    if (label && !label.hasAttribute('data-i18n')) label.setAttribute('data-i18n', 'lang.label');

    autowireBySelectors();
    autowireByTextMatch();

    var initial = getSavedLang() || 'en';
    setLanguage(initial);

    // Language dropdown
    var langBtn = $('#langBtn');
    var langMenu = $('#langMenu');
    if (langBtn && langMenu) {
      langBtn.addEventListener('click', function () {
        var exp = langBtn.getAttribute('aria-expanded') === 'true';
        if (exp) closeLangMenu(); else openLangMenu();
      });
      langBtn.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault(); openLangMenu();
        }
      });
      langMenu.addEventListener('click', function (e) {
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
})();
