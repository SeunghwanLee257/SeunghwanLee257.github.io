/**
 * Navigation Module
 * Handles smooth scroll navigation
 */

import { $$, $ } from '../utils/dom.js';
import { safeExecute } from '../utils/error-handler.js';

export function initNavigation() {
  safeExecute(() => {
    // 이벤트 위임을 사용하여 모든 .nav a[href^="#"] 링크에 대한 클릭 이벤트 처리
    document.addEventListener('click', (event) => {
      const link = event.target.closest('.nav a[href^="#"]');
      if (!link) return;
      
      event.preventDefault();
      event.stopImmediatePropagation();
      
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      
      // walllnut.bundle.js의 smoothScrollTo 함수 사용 (있는 경우)
      if (typeof window.smoothScrollTo === 'function') {
        window.smoothScrollTo(targetId);
        return;
      }
      
      // smoothScrollTo가 없으면 직접 구현
      const targetElement = $(targetId);
      if (!targetElement) {
        // Target element not found - silently fail
        return;
      }
      
      const header = $('.header');
      const headerHeight = header?.offsetHeight || 0;
      const offset = headerHeight + 20;
    
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      const targetPosition = targetElement.getBoundingClientRect().top + currentScroll - offset;
      
      const duration = 800;
      const startTime = performance.now();
      
      const easeInOutCubic = (t) => {
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };
      
      const animateScroll = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);
        
        window.scrollTo(0, currentScroll + (targetPosition - currentScroll) * eased);
        
        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        } else {
          if (history?.pushState) {
            history.pushState(null, '', targetId);
          } else {
            location.hash = targetId;
          }
        }
      };
      
      requestAnimationFrame(animateScroll);
    }, true); // capture phase에서 이벤트 처리
    
    // Navigation links initialized
  }, 'Navigation: init');
}

