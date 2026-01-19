/**
 * Sliders Module
 * Handles use-case and team sliders
 */

import { $, $$, setAttr, toggleClass } from '../utils/dom.js';
import { debounce } from '../utils/performance.js';
import { safeExecute, validateElement } from '../utils/error-handler.js';

export function initUseCaseSlider() {
  const slider = $('.use-case-slider');
  if (!validateElement(slider, 'UseCaseSlider')) return;
  
  const track = $('.use-case-track', slider);
  const items = track ? $$('.use-case-item', track) : [];
  const viewport = $('.use-case-window', slider);
  const prevBtn = document.getElementById('usecase-prev');
  const nextBtn = document.getElementById('usecase-next');
  
  if (!track || !items.length) {
    return;
  }

  let index = 0;
  let step = 0;
  let visibleCount = 1;
  let maxIndex = 0;

  const computeMetrics = () => {
    if (!items.length) return;
    const first = items[0];
    const rect = first.getBoundingClientRect();
    const style = window.getComputedStyle(track);
    const gap = parseFloat(style.columnGap || style.gap || '0') || 0;
    const fallbackWidth = (viewport && viewport.clientWidth) || slider.clientWidth || 1;
    const baseWidth = rect.width || (fallbackWidth / Math.max(1, items.length));
    step = baseWidth + gap;
    const viewportWidth = (viewport && viewport.clientWidth) || rect.width || fallbackWidth;
    visibleCount = step ? Math.max(1, Math.round((viewportWidth + gap) / step)) : 1;
    maxIndex = Math.max(0, items.length - visibleCount);
  };

  const update = () => {
    computeMetrics();
    if (index > maxIndex) index = maxIndex;
    const offset = -index * step;
    track.style.transform = `translateX(${offset}px)`;
    const start = index;
    const end = Math.min(items.length - 1, index + visibleCount - 1);
    items.forEach((item, itemIndex) => {
      const active = itemIndex >= start && itemIndex <= end;
      setAttr(item, 'aria-hidden', !active);
      const card = item.querySelector('.use-case');
      if (card) toggleClass(card, 'is-active', active);
    });
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index >= maxIndex;
  };

  const go = (delta) => {
    const nextIndex = Math.min(maxIndex, Math.max(0, index + delta));
    if (nextIndex === index) return;
    index = nextIndex;
    update();
  };

  prevBtn?.addEventListener('click', () => go(-1));
  nextBtn?.addEventListener('click', () => go(1));

  const debouncedUpdate = debounce(update, 150);
  window.addEventListener('resize', debouncedUpdate, { passive: true });

  update();
}

export function initTeamSlider() {
  const slider = $('.team-slider');
  if (!validateElement(slider, 'TeamSlider')) return;
  
  const track = $('.team-track', slider);
  const items = track ? $$('.team-item', track) : [];
  const viewport = $('.team-window', slider);
  
  if (!track || !items.length) {
    return;
  }

  let index = 0;
  let step = 0;
  let visibleCount = 1;
  let maxIndex = 0;
  let isDragging = false;
  let startX = 0;
  let currentX = 0;
  let startScrollX = 0;

  const computeMetrics = () => {
    return safeExecute(() => {
      if (!items.length) return;
      const first = items[0];
      const rect = first.getBoundingClientRect();
      const style = window.getComputedStyle(track);
      const gap = parseFloat(style.columnGap || style.gap || '0') || 0;
      const fallbackWidth = (viewport?.clientWidth) || slider.clientWidth || 1;
      
      // CSS 변수로 team-window 너비 설정 (데스크톱/태블릿에서 2개 카드가 보이도록)
      if (viewport) {
        const windowWidth = viewport.clientWidth;
        viewport.style.setProperty('--team-window-width', `${windowWidth}px`);
      }
      
      const baseWidth = rect.width || (fallbackWidth / Math.max(1, items.length));
      step = baseWidth + gap;
      const viewportWidth = (viewport?.clientWidth) || rect.width || fallbackWidth;
      visibleCount = step ? Math.max(1, Math.round((viewportWidth + gap) / step)) : 1;
      maxIndex = Math.max(0, items.length - visibleCount);
    }, 'TeamSlider: computeMetrics');
  };

  const update = (fromScroll = false) => {
    computeMetrics();
    if (!fromScroll) {
      if (index > maxIndex) index = maxIndex;
      viewport.scrollLeft = index * step;
    }
    const start = index;
    const end = Math.min(items.length - 1, index + visibleCount - 1);
    items.forEach((item, itemIndex) => {
      const active = itemIndex >= start && itemIndex <= end;
      setAttr(item, 'aria-hidden', !active);
      const card = item.querySelector('.team-card');
      if (card) toggleClass(card, 'is-active', active);
    });
  };

  const handleScroll = () => {
    if (isDragging) return;
    computeMetrics();
    const scrollLeft = viewport.scrollLeft;
    const newIndex = Math.round(scrollLeft / step);
    if (newIndex !== index && newIndex >= 0 && newIndex <= maxIndex) {
      index = newIndex;
      update(true);
    }
  };

  // Auto-slide functionality
  let autoSlideInterval = null;
  const autoSlideDelay = 3000;
  
  const startAutoSlide = () => {
    if (autoSlideInterval) clearInterval(autoSlideInterval);
    autoSlideInterval = setInterval(() => {
      if (isDragging) return;
      computeMetrics();
      if (index >= maxIndex) {
        index = 0;
      } else {
        index++;
      }
      update();
    }, autoSlideDelay);
  };
  
  const stopAutoSlide = () => {
    if (autoSlideInterval) {
      clearInterval(autoSlideInterval);
      autoSlideInterval = null;
    }
  };
  
  // Touch drag handlers
  const handleTouchStart = (e) => {
    stopAutoSlide();
    isDragging = true;
    startX = e.touches[0].clientX;
    startScrollX = viewport.scrollLeft;
    viewport.style.scrollBehavior = 'auto';
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    currentX = e.touches[0].clientX;
    const deltaX = startX - currentX;
    viewport.scrollLeft = startScrollX + deltaX;
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    viewport.style.scrollBehavior = 'smooth';
    setTimeout(startAutoSlide, 1000);
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    stopAutoSlide();
    isDragging = true;
    startX = e.clientX;
    startScrollX = viewport.scrollLeft;
    viewport.style.scrollBehavior = 'auto';
    viewport.style.cursor = 'grabbing';
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    currentX = e.clientX;
    const deltaX = startX - currentX;
    viewport.scrollLeft = startScrollX + deltaX;
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    viewport.style.scrollBehavior = 'smooth';
    viewport.style.cursor = 'grab';
    setTimeout(startAutoSlide, 1000);
  };

  // Event listeners
  viewport.addEventListener('touchstart', handleTouchStart, { passive: true });
  viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
  viewport.addEventListener('touchend', handleTouchEnd, { passive: true });
  viewport.addEventListener('mousedown', handleMouseDown);
  viewport.addEventListener('mousemove', handleMouseMove);
  viewport.addEventListener('mouseup', handleMouseUp);
  viewport.addEventListener('mouseleave', handleMouseUp);
  viewport.addEventListener('scroll', handleScroll, { passive: true });

  // 모든 카드에 동일한 너비와 높이 적용
  const forceCardWidths = () => {
    return safeExecute(() => {
      if (!viewport || !items.length) return;
      
      const windowWidth = viewport.clientWidth;
      const isMobile = windowWidth <= 767;
      viewport.style.setProperty('--team-window-width', `${windowWidth}px`);
      
      if (isMobile) {
        // 모바일: 100% 너비만 설정, 높이는 자동
        items.forEach(item => {
          item.style.width = '100%';
          item.style.flex = '0 0 100%';
          item.style.height = '';
          item.style.minHeight = '';
          item.style.maxHeight = '';
          const card = item.querySelector('.team-card');
          if (card) {
            card.style.height = '';
            card.style.minHeight = '';
            card.style.maxHeight = '';
          }
        });
      } else {
        // 데스크톱/태블릿: 높이 측정 후 동일하게 설정
        // 1. 모든 카드 높이 제한 해제
        items.forEach(item => {
          const card = item.querySelector('.team-card');
          item.style.height = 'auto';
          if (card) card.style.height = 'auto';
        });
        
        // 2. 최대 높이 측정
        let maxHeight = 0;
        items.forEach(item => {
          const card = item.querySelector('.team-card');
          if (card) {
            const height = card.offsetHeight;
            maxHeight = Math.max(maxHeight, height);
          }
        });
        
        // 3. 모든 카드에 동일한 너비와 높이 적용
        const cardWidth = (windowWidth - 20) / 2;
        items.forEach(item => {
          const card = item.querySelector('.team-card');
          item.style.width = `${cardWidth}px`;
          item.style.flex = `0 0 ${cardWidth}px`;
          item.style.height = `${maxHeight}px`;
          if (card) {
            card.style.height = `${maxHeight}px`;
          }
        });
      }
    }, 'TeamSlider: forceCardWidths');
  };

  const handleResize = debounce(() => {
    safeExecute(() => {
      forceCardWidths();
      computeMetrics();
      viewport.scrollLeft = index * step;
      update(true);
    }, 'TeamSlider: resize');
  }, 150);
  
  window.addEventListener('resize', handleResize, { passive: true });

  viewport.addEventListener('mouseenter', stopAutoSlide);
  viewport.addEventListener('mouseleave', startAutoSlide);
  
  computeMetrics();
  forceCardWidths();
  viewport.scrollLeft = 0;
  update(true);
  startAutoSlide();
}

