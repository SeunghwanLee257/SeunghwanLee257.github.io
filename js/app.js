// app.js
(() => {
    /* =========================
       Section 01: Countdown
       - 각 박스 hover 시 해당 유닛만 일시 정지
       - 터치도 지원 (touchstart/touchend)
       ========================= */
    const daysEl   = document.getElementById('days');
    const hoursEl  = document.getElementById('hours');
    const secondsEl= document.getElementById('seconds');
  
    if (daysEl && hoursEl && secondsEl) {
      // 필요 시 실제 목표 날짜/시간으로 바꿔줘
      // 예: const TARGET = new Date('2025-12-01T00:00:00+09:00');
      const TARGET = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 임시 365일 후
  
      const paused = { days:false, hours:false, seconds:false };
  
      function setPauseHandlers(box) {
        const unit = box.getAttribute('data-unit');
        if (!unit) return;
        const on = () => (paused[unit] = true);
        const off = () => (paused[unit] = false);
        box.addEventListener('mouseenter', on);
        box.addEventListener('mouseleave', off);
        box.addEventListener('touchstart', on, {passive:true});
        box.addEventListener('touchend', off, {passive:true});
        box.addEventListener('touchcancel', off, {passive:true});
      }
      document.querySelectorAll('.time-box').forEach(setPauseHandlers);
  
      function render() {
        const now = new Date();
        let diff = Math.max(0, Math.floor((TARGET - now) / 1000)); // 남은 초
        const days = Math.floor(diff / 86400); diff %= 86400;
        const hours = Math.floor(diff / 3600); diff %= 3600;
        // 분은 UI에 없으므로 스킵
        const seconds = diff % 60;
  
        if (!paused.days)    daysEl.textContent    = String(days);
        if (!paused.hours)   hoursEl.textContent   = String(hours).padStart(2,'0');
        if (!paused.seconds) secondsEl.textContent = String(seconds).padStart(2,'0');
      }
  
      render();
      setInterval(render, 1000);
    }
  
    /* =========================
       Section 03: Tech Split (a/b 토글)
       - 비활성 패널 클릭 시 활성 전환
       - 키보드 접근성(Enter/Space)
       ========================= */
    const panelA = document.getElementById('panel-a');
    const panelB = document.getElementById('panel-b');
  
    function activate(panel, other) {
      if (!panel || !other) return;
      panel.classList.add('active');   panel.classList.remove('inactive');
      other.classList.remove('active'); other.classList.add('inactive');
      panel.setAttribute('aria-hidden', 'false');
      other.setAttribute('aria-hidden', 'true');
    }
  
    function wirePanel(panel, other) {
      if (!panel) return;
      panel.setAttribute('tabindex', '0');
  
      panel.addEventListener('click', (e) => {
        // 내부 버튼 클릭 시 패널 토글 방지
        if (e.target.closest('.more-btn')) return;
        if (panel.classList.contains('inactive')) activate(panel, other);
      });
  
      panel.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && panel.classList.contains('inactive')) {
          e.preventDefault();
          activate(panel, other);
        }
      });
    }
  
    if (panelA && panelB) {
      // 초기 상태: a 활성, b 비활성
      activate(panelA, panelB);
      wirePanel(panelA, panelB);
      wirePanel(panelB, panelA);
      // 더보기 버튼 기본 방지(동작은 추후 연결)
      document.querySelectorAll('.more-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          // TODO: 링크 이동/모달 등 연결
        });
      });
    }
  

    // Service Slider Control
document.addEventListener('DOMContentLoaded', function() {
    const contentTrack = document.getElementById('svc-track');
    const imageSlider = document.getElementById('svc-image-slider');
    const slides = contentTrack.querySelectorAll('.svc-item');
    const totalSlides = slides.length;
    
    let currentIndex = 0;
    
    // 버튼 요소들
    const prevBtn = document.getElementById('svc-prev');
    const nextBtn = document.getElementById('svc-next');
    const firstBtn = document.getElementById('svc-first');
    const lastBtn = document.getElementById('svc-last');
    
    // 슬라이드 이동 함수
    function moveToSlide(index) {
      if (index < 0) index = 0;
      if (index >= totalSlides) index = totalSlides - 1;
      
      currentIndex = index;
      
      // 메인 컨텐츠 슬라이더 이동
      const translateX = -currentIndex * 100;
      contentTrack.style.transform = `translateX(${translateX}%)`;
      
      // 왼쪽 이미지 슬라이더도 동시 이동 (첫 번째 슬라이드에만 있음)
      if (imageSlider) {
        imageSlider.style.transform = `translateX(${translateX}%)`;
      }
      
      // aria-current 업데이트
      slides.forEach((slide, i) => {
        slide.setAttribute('aria-current', i === currentIndex ? 'true' : 'false');
      });
      
      // 버튼 상태 업데이트
      updateButtonStates();
    }
    
    // 버튼 상태 업데이트
    function updateButtonStates() {
      // 첫 번째/이전 버튼
      if (currentIndex === 0) {
        firstBtn.classList.add('is-gray');
        prevBtn.classList.add('is-gray');
      } else {
        firstBtn.classList.remove('is-gray');
        prevBtn.classList.remove('is-gray');
      }
      
      // 마지막/다음 버튼
      if (currentIndex === totalSlides - 1) {
        lastBtn.classList.add('is-gray');
        nextBtn.classList.add('is-gray');
      } else {
        lastBtn.classList.remove('is-gray');
        nextBtn.classList.remove('is-gray');
      }
    }
    
    // 이벤트 리스너
    nextBtn.addEventListener('click', () => {
      if (currentIndex < totalSlides - 1) {
        moveToSlide(currentIndex + 1);
      }
    });
    
    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        moveToSlide(currentIndex - 1);
      }
    });
    
    firstBtn.addEventListener('click', () => {
      moveToSlide(0);
    });
    
    lastBtn.addEventListener('click', () => {
      moveToSlide(totalSlides - 1);
    });
    
    // 키보드 네비게이션
    document.addEventListener('keydown', (e) => {
      if (document.activeElement.closest('#svc-slider')) {
        switch(e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            prevBtn.click();
            break;
          case 'ArrowRight':
            e.preventDefault();
            nextBtn.click();
            break;
          case 'Home':
            e.preventDefault();
            firstBtn.click();
            break;
          case 'End':
            e.preventDefault();
            lastBtn.click();
            break;
        }
      }
    });
    
    // 터치/스와이프 지원
    let startX = 0;
    let endX = 0;
    
    const slider = document.getElementById('svc-slider');
    
    slider.addEventListener('touchstart', (e) => {
      startX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    slider.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
      const threshold = 50; // 최소 스와이프 거리
      const diff = startX - endX;
      
      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          // 왼쪽으로 스와이프 (다음 슬라이드)
          nextBtn.click();
        } else {
          // 오른쪽으로 스와이프 (이전 슬라이드)
          prevBtn.click();
        }
      }
    }
    
    // 초기 버튼 상태 설정
    updateButtonStates();
  });


  // 드롭다운 기능
    document.querySelectorAll('.goal-dropdown-header').forEach(button => {
    button.addEventListener('click', () => {
      const card = button.closest('.goal-dropdown-card');
      const isOpen = card.classList.contains('open');
      
      // 다른 모든 카드 닫기
      document.querySelectorAll('.goal-dropdown-card').forEach(c => {
        c.classList.remove('open');
        c.querySelector('.goal-dropdown-header').setAttribute('aria-expanded', 'false');
      });
      
      // 현재 카드 토글
      if (!isOpen) {
        card.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });
  
  
  })();
  