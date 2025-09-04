/* =========================================================
   WaLLLnut Landing - App Script (mobile nav + lang + scroll)
   ========================================================= */
(function () {
  'use strict';

  /* -------- Helpers -------- */
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (n, a, b) { return Math.max(a, Math.min(b, n)); };


  // === Scroll Lock (iOS/Safari 안전) ===
  let __lockY = 0;
  function lockScroll() {
    __lockY = window.scrollY || window.pageYOffset;
    document.documentElement.classList.add('menu-locked');
    document.body.classList.add('menu-locked');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${__lockY}px`;
    document.body.style.width = '100%';
  }
  function unlockScroll() {
    document.documentElement.classList.remove('menu-locked');
    document.body.classList.remove('menu-locked');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, __lockY);
  }


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
    document.body.classList.add('menu-open'); // ← 추가: 전역 상태
    menuBtn.setAttribute('aria-expanded', 'true');
    overlay.classList.add('active');
  }

  function closeMenu() {
    isMenuOpen = false;
    logoMenus.classList.remove('menu-open');
    document.body.classList.remove('menu-open'); // ← 추가
    menuBtn.setAttribute('aria-expanded', 'false');
    overlay.classList.remove('active');
  }

  function toggleMenu(){ isMenuOpen ? closeMenu() : openMenu(); }

  // 이벤트 바인딩
    menuBtn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); toggleMenu(); });
    closeBtn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); closeMenu(); });
    overlay.addEventListener('click', function(e){ e.preventDefault(); closeMenu(); });

    // 모바일 메뉴 안의 앵커 클릭 시: 기본 점프 차단 → 메뉴 닫기 → 부드럽게 이동
  $$('.nav a[href^="#"]').forEach(function(link){
    link.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      var target = link.getAttribute('href');

    // 메뉴 닫으며 스크롤 락 해제
    closeMenu();

    // 레이아웃 안정화 뒤(다음 프레임) 스크롤 실행
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      smoothScrollTo(target);  // 아래 3-3 노출 함수 사용
    });
  });
  }, { passive: false });
});


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
     3) fix bug
    ========================================================= */ 

  // === Desktop 복귀 시 모바일 흔적 제거 ===
  function teardownMobileMenu() {
    const logoMenus = document.querySelector('.logo-menus');
    const nav = document.querySelector('.nav');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const overlay = document.querySelector('.mobile-menu-overlay');
    const closeBtn = nav ? nav.querySelector('.nav-close-btn') : null;

  // 상태/클래스/스크롤 락 해제
    logoMenus && logoMenus.classList.remove('menu-open');
    document.body.style.overflow = '';

  // 동적 생성 요소 제거
    if (menuBtn) menuBtn.remove();
    if (overlay) overlay.remove();
    if (closeBtn) closeBtn.remove();

  // 모바일 전용 id/aria 원복
    if (nav && nav.getAttribute('id') === 'mobile-nav') {
      nav.removeAttribute('id');
    }
    const langBtn = document.getElementById('langBtn');
    if (langBtn) langBtn.setAttribute('aria-expanded', 'false');
    const langMenu = document.getElementById('langMenu');
    if (langMenu) { langMenu.hidden = true; langMenu.style.display = 'none'; }
}


  /* =========================================================
     4) Enhanced Language Dropdown for Mobile
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
     5) Init
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


// scroll top
(function () {
  const btn = document.getElementById('scrollTopBtn');

  // 스크롤 시 버튼 토글
  window.addEventListener('scroll', function () {
    if (window.scrollY > 300) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  });

  // 클릭 시 맨 위로 부드럽게 이동
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
