/* =========================================================
   WaLLLnut Landing - App Script (mobile nav + lang + scroll)
   ========================================================= */
(function () {
  'use strict';

  /* -------- Helpers -------- */
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (n, a, b) { return Math.max(a, Math.min(b, n)); };

  /* =========================================================
     1) Box in-view -> .expand  (IO + scroll fallback)
     ========================================================= */
  function initBoxExpand() {
    var boxes = $$('.box');
    if (!boxes.length) return;

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          entry.target.classList.toggle('expand', entry.isIntersecting);
        });
      }, { threshold: 0.05 });
      boxes.forEach(function(b){ io.observe(b); });
    } else {
      // Fallback
      function onScroll(){
        var h = window.innerHeight;
        boxes.forEach(function(box){
          var t = box.getBoundingClientRect().top;
          box.classList.toggle('expand', t <= h && t >= 0);
        });
      }
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }

  /* =========================================================
     2) Mobile Header Navigation
     ========================================================= */
  function initMobileMenu() {
    var logoMenus = $('.logo-menus');
    var nav       = $('.nav');
    if (!logoMenus || !nav) return;

    // 중복 생성 방지
    if ($('.mobile-menu-btn')) return;

    // 메뉴 버튼
    var menuBtn = document.createElement('button');
    menuBtn.className = 'mobile-menu-btn';
    menuBtn.type = 'button';
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-controls', 'mobile-nav');
    menuBtn.setAttribute('aria-label', 'Toggle navigation menu');
    menuBtn.innerHTML = '<span class="menu-text">Menu</span>';

    // 오버레이(하나만)
    var overlay = $('.mobile-menu-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'mobile-menu-overlay';
      document.body.appendChild(overlay);
    }

    // Nav 접근성 id
    nav.setAttribute('id', 'mobile-nav');

    // 닫기 버튼(첫 child)
    var closeBtn = $('.nav-close-btn', nav);
    if (!closeBtn) {
      closeBtn = document.createElement('button');
      closeBtn.className = 'nav-close-btn';
      closeBtn.type = 'button';
      closeBtn.setAttribute('aria-label', 'Close menu');
      closeBtn.textContent = 'Close';
      nav.insertBefore(closeBtn, nav.firstChild);
    }

    // 로고 뒤에 메뉴 버튼 삽입(없으면 컨테이너 끝에)
    var logo = $('.logo-menus img');
    if (logo && logo.parentNode) {
      logo.parentNode.insertBefore(menuBtn, logo.nextSibling);
    } else {
      logoMenus.appendChild(menuBtn);
    }

    var isMenuOpen = false;

    function getFocusableInNav() {
      return $$('#mobile-nav a, #mobile-nav button, #mobile-nav [tabindex]:not([tabindex="-1"])');
    }

    function openMenu() {
      isMenuOpen = true;
      logoMenus.classList.add('menu-open');
      menuBtn.setAttribute('aria-expanded', 'true');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      setTimeout(function(){ closeBtn.focus(); }, 50);
    }

    function closeMenu() {
      isMenuOpen = false;
      logoMenus.classList.remove('menu-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      menuBtn.focus();
    }

    function toggleMenu(){ isMenuOpen ? closeMenu() : openMenu(); }

    // 이벤트 바인딩
    menuBtn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); toggleMenu(); });
    closeBtn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); closeMenu(); });
    overlay.addEventListener('click', function(e){ e.preventDefault(); closeMenu(); });
    $$('.nav a').forEach(function(link){ link.addEventListener('click', closeMenu); });

    // 포커스 트랩 + ESC
    document.addEventListener('keydown', function(e){
      if (!isMenuOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
      if (e.key === 'Tab') {
        var f = getFocusableInNav();
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    });

    // 바깥 클릭 시 닫기
    document.addEventListener('click', function(e){
      if (!isMenuOpen) return;
      if (!logoMenus.contains(e.target) && !e.target.closest('.mobile-menu-btn')) {
        closeMenu();
      }
    });

    // 데스크톱 폭으로 리사이즈 시 닫기 및 정리
    window.addEventListener('resize', function(){
      if (window.innerWidth > 767 && isMenuOpen) closeMenu();
    });
  }

  /* =========================================================
     3) Enhanced Language Dropdown for Mobile
     ========================================================= */
  function enhanceMobileLanguageDropdown() {
    var langBtn  = $('#langBtn');
    var langMenu = $('#langMenu');
    var logoMenus = $('.logo-menus');
    if (!langBtn || !langMenu) return;

    // 모바일 메뉴 열릴 때 언어 메뉴 닫기
    if (logoMenus) {
      var observer = new MutationObserver(function(m){
        m.forEach(function(mu){
          if (mu.attributeName === 'class' && logoMenus.classList.contains('menu-open')) {
            langBtn.setAttribute('aria-expanded', 'false');
            langMenu.hidden = true;
            langMenu.style.display = 'none';
          }
        });
      });
      observer.observe(logoMenus, { attributes: true, attributeFilter: ['class'] });
    }

    // 모바일 터치 토글
    langBtn.addEventListener('touchstart', function(e){
      e.preventDefault();
      var exp = langBtn.getAttribute('aria-expanded') === 'true';
      langBtn.setAttribute('aria-expanded', exp ? 'false' : 'true');
      langMenu.hidden = exp;
      langMenu.style.display = exp ? 'none' : 'block';
    });

    // 바깥 클릭 시 닫기
    document.addEventListener('click', function(e){
      if (!e.target.closest('.lang-dd')) {
        langBtn.setAttribute('aria-expanded', 'false');
        langMenu.hidden = true;
        langMenu.style.display = 'none';
      }
    });
  }

  /* =========================================================
     Init
     ========================================================= */
  document.addEventListener('DOMContentLoaded', function () {
    initBoxExpand();

    if (window.innerWidth <= 767) {
      initMobileMenu();
    }
    enhanceMobileLanguageDropdown();

    // 리사이즈 시 모바일 메뉴 생성/정리
    window.addEventListener('resize', function () {
      if (window.innerWidth <= 767) {
        if (!$('.mobile-menu-btn')) initMobileMenu();
      } else {
        var overlay = $('.mobile-menu-overlay');
        if (overlay) overlay.classList.remove('active');
        var logoMenus = $('.logo-menus');
        if (logoMenus) logoMenus.classList.remove('menu-open');
        document.body.style.overflow = '';
      }
    });
  });
})();
