/**
 * SNS Toggle Module
 * Handles SNS menu bottom bar toggle functionality
 */

import { $, toggleClass, setAttr } from '../utils/dom.js';
import { safeExecute } from '../utils/error-handler.js';

export function initSNSToggle() {
  const snsMenu = $('#snsMenu');
  if (!snsMenu) return;

  const toggleSNS = () => {
    return safeExecute(() => {
      const isActive = snsMenu.classList.contains('is-active');
      toggleClass(snsMenu, 'is-active', !isActive);
      setAttr(snsMenu, 'aria-expanded', !isActive);
    }, 'SNSToggle: toggleSNS');
  };

  // 클릭/터치로 토글
  snsMenu.addEventListener('click', (event) => {
    // 링크 클릭은 기본 동작 유지
    if (event.target.closest('.sns-menu-link')) {
      return;
    }
    event.preventDefault();
    toggleSNS();
  });

  // 터치 이벤트 (모바일)
  let touchStartY = 0;
  let touchEndY = 0;
  
  snsMenu.addEventListener('touchstart', (event) => {
    touchStartY = event.changedTouches[0].screenY;
  }, { passive: true });

  snsMenu.addEventListener('touchend', (event) => {
    touchEndY = event.changedTouches[0].screenY;
    const swipeDistance = touchStartY - touchEndY;
    
    // 위로 스와이프하면 active, 아래로 스와이프하면 inactive
    if (Math.abs(swipeDistance) > 30) {
      if (swipeDistance > 0) {
        // 위로 스와이프 - active
        toggleClass(snsMenu, 'is-active', true);
        setAttr(snsMenu, 'aria-expanded', true);
      } else {
        // 아래로 스와이프 - inactive
        toggleClass(snsMenu, 'is-active', false);
        setAttr(snsMenu, 'aria-expanded', false);
      }
    }
  }, { passive: true });

  // 외부 클릭 시 닫기
  document.addEventListener('click', (event) => {
    if (snsMenu.classList.contains('is-active') && 
        !snsMenu.contains(event.target) &&
        !event.target.closest('.sns-menu-link')) {
      toggleClass(snsMenu, 'is-active', false);
      setAttr(snsMenu, 'aria-expanded', false);
    }
  });

  // Escape 키로 닫기
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && snsMenu.classList.contains('is-active')) {
      toggleClass(snsMenu, 'is-active', false);
      setAttr(snsMenu, 'aria-expanded', false);
    }
  });
}

