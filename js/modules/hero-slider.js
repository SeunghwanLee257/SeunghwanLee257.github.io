/**
 * Hero Slider Module
 * Handles hero section slide navigation and benchmark button toggle
 */

import { setupButtonHandlers } from '../utils/event-handlers.js';
import { $, $$, toggleClass, setAttr } from '../utils/dom.js';
import { validateElement } from '../utils/error-handler.js';

export function initHeroSlider() {
  const heroSlider = $('[data-hero-slider]');
  if (!validateElement(heroSlider, 'HeroSlider')) return;

  const slides = $$('.hero-slide', heroSlider);
  const prevBtn = $('.hero-nav-prev', heroSlider);
  const nextBtn = $('.hero-nav-next', heroSlider);
  
  // 초기 상태 강제 설정: 첫 번째 슬라이드만 활성화
  slides.forEach((slide, idx) => {
    if (idx === 0) {
      slide.classList.add('is-active');
      slide.setAttribute('aria-hidden', 'false');
    } else {
      slide.classList.remove('is-active');
      slide.setAttribute('aria-hidden', 'true');
    }
  });
  
  let activeIndex = 0;

  // 버튼을 나중에 찾도록 함수로 분리
  const getBenchBtn = () => $('.ecosystem-btn');

  const updateSlideState = (newIndex) => {
    if (!slides.length) return;
    const total = slides.length;
    const normalizedIndex = (newIndex + total) % total;
    activeIndex = normalizedIndex;
    slides.forEach((slide, idx) => {
      const isActive = idx === normalizedIndex;
      toggleClass(slide, 'is-active', isActive);
      setAttr(slide, 'aria-hidden', !isActive);
    });
    // 버튼을 매번 다시 찾기 (동적 생성되므로)
    const benchBtn = getBenchBtn();
    if (benchBtn) {
      toggleClass(benchBtn, 'is-active', normalizedIndex === 1);
    }
    // 슬라이드 전환 이벤트 발생 (차트 리사이즈를 위해)
    document.dispatchEvent(new CustomEvent('hero:slide-changed', {
      detail: { index: normalizedIndex }
    }));
  };

  const goToOffset = (delta) => {
    updateSlideState(activeIndex + delta);
  };

  if (prevBtn) {
    prevBtn.addEventListener('click', () => goToOffset(-1));
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => goToOffset(1));
  }

  // 키보드 이벤트 핸들러 (좌우 화살표 키)
  const handleKeyDown = (event) => {
    // 입력 필드나 텍스트 영역에 포커스가 있으면 무시
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable ||
      activeElement.getAttribute('contenteditable') === 'true'
    );
    
    if (isInputFocused) return;
    
    // 모달이 열려있으면 무시
    const modal = document.getElementById('chartDetailModal');
    if (modal && modal.classList.contains('is-open')) return;
    
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToOffset(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToOffset(1);
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  const handleHeroRequest = (event) => {
    const requested = event?.detail?.index ?? 1;
    updateSlideState(requested);
  };

  document.addEventListener('hero:request-slide', handleHeroRequest);

  // 버튼이 생성될 때까지 기다렸다가 이벤트 핸들러 설정
  const setupBenchBtn = () => {
    const benchBtn = getBenchBtn();
    if (benchBtn && !benchBtn._benchHandler) {
      const goBench = (event) => {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        const targetIndex = activeIndex === 1 ? 0 : 1;
        updateSlideState(targetIndex);
      };
      benchBtn._benchHandler = goBench;
      setupButtonHandlers(benchBtn, goBench, true);
      return true;
    }
    return false;
  };

  // 즉시 시도하고, 실패하면 약간의 지연 후 재시도
  if (!setupBenchBtn()) {
    setTimeout(() => {
      if (!setupBenchBtn()) {
        // 최대 3번까지 재시도
        let retries = 0;
        const retryInterval = setInterval(() => {
          if (setupBenchBtn() || retries >= 3) {
            clearInterval(retryInterval);
          }
          retries++;
        }, 100);
      }
    }, 50);
  }

  updateSlideState(activeIndex);
}

