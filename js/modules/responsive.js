/**
 * Responsive Utilities Module
 * Handles responsive layout adjustments
 */

import { $, exists } from '../utils/dom.js';
import { debounce } from '../utils/performance.js';
import { safeExecute, validateElement } from '../utils/error-handler.js';

export function initResponsive() {
  const moveEcosystemBtn = () => {
    return safeExecute(() => {
      // 버튼을 현재 위치와 관계없이 찾기
      const ecosystemBtn = $('.ecosystem-btn');
      const headerCenter = $('.header-center');
      const headerLeft = $('.header-left');
      const isMobile = window.innerWidth <= 767;
      
      if (!ecosystemBtn) {
        return;
      }
      
      const currentParent = ecosystemBtn.parentElement;
      
      if (isMobile && headerCenter) {
        // 모바일: header-center로 이동
        if (currentParent !== headerCenter) {
          headerCenter.appendChild(ecosystemBtn);
        }
      } else {
        // 데스크톱: header-left로 이동
        if (headerLeft && currentParent !== headerLeft) {
          const nav = $('.nav', headerLeft);
          if (nav) {
            headerLeft.insertBefore(ecosystemBtn, nav);
          } else {
            headerLeft.appendChild(ecosystemBtn);
          }
        }
      }
    }, 'Responsive: moveEcosystemBtn');
  };

  moveEcosystemBtn();
  const debouncedMove = debounce(moveEcosystemBtn, 150);
  window.addEventListener('resize', debouncedMove, { passive: true });
}

