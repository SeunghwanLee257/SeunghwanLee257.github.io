/**
 * Responsive Utilities Module
 * Handles responsive layout adjustments, including ecosystem button positioning
 */

import { $ } from '../utils/dom.js';
import { debounce } from '../utils/performance.js';
import { safeExecute } from '../utils/error-handler.js';

const MOBILE_BREAKPOINT = 767;

/**
 * Creates the ecosystem button element
 */
function createEcosystemButton() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ecosystem-btn';
  btn.setAttribute('aria-label', 'View benchmarks');
  btn.innerHTML = '<span class="ecosystem-label">Benchmarks</span>';
  
  // 즉시 숨김 (CSS 로드 전에도 보이지 않도록) - 화면 밖으로 완전히 이동
  btn.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; position: fixed !important; left: -9999px !important; top: -9999px !important; width: 0 !important; height: 0 !important; overflow: hidden !important;';
  
  return btn;
}

/**
 * Gets the target parent element for the ecosystem button based on viewport
 */
function getTargetParent() {
  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
  const headerCenter = $('.header-center');
  const headerLeft = $('.header-left');
  
  return isMobile && headerCenter ? headerCenter : headerLeft;
}

/**
 * Inserts the button into the correct position within the parent
 */
function insertButton(btn, parent) {
  if (!parent) return;
  
  // DOM에 삽입하기 전에 강제로 숨김
  btn.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; position: absolute !important; left: -9999px !important;';
  
  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
  const nav = $('.nav', parent);
  
  if (isMobile) {
    parent.appendChild(btn);
  } else if (nav) {
    parent.insertBefore(btn, nav);
  } else {
    parent.appendChild(btn);
  }
}

/**
 * Moves the button to the correct parent if needed
 */
function moveButton(btn) {
  const targetParent = getTargetParent();
  const currentParent = btn.parentElement;
  
  if (targetParent && currentParent !== targetParent) {
    insertButton(btn, targetParent);
  }
}

/**
 * Creates and positions the ecosystem button
 */
function createAndPositionBtn() {
  return safeExecute(() => {
    let btn = $('.ecosystem-btn');
    
    if (!btn) {
      // Create new button
      const targetParent = getTargetParent();
      if (targetParent) {
        btn = createEcosystemButton();
        insertButton(btn, targetParent);
        
        // 여러 프레임과 지연을 거쳐서 확실하게 숨김 유지 후 표시
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              // 인라인 스타일 제거하고 CSS가 제어하도록
              btn.style.cssText = '';
              btn.classList.add('is-ready');
            }, 50);
          });
        });
      }
    } else {
      // Move existing button if needed and ensure it's ready
      // 이동 전에 완전히 숨김
      btn.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; position: fixed !important; left: -9999px !important; top: -9999px !important; width: 0 !important; height: 0 !important; overflow: hidden !important;';
      moveButton(btn);
      
      // 여러 프레임과 지연을 거쳐서 확실하게 숨김 유지 후 표시
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            // 인라인 스타일 제거하고 CSS가 제어하도록
            btn.style.cssText = '';
            btn.classList.add('is-ready');
          }, 50);
        });
      });
    }
  }, 'Responsive: createAndPositionBtn');
}

export function initResponsive() {
  // Execute after all resources are loaded with additional delay
  const initButton = () => {
    // 추가 지연으로 CSS가 완전히 로드된 후 실행
    setTimeout(() => {
      createAndPositionBtn();
    }, 100);
  };
  
  if (document.readyState === 'complete') {
    initButton();
  } else {
    window.addEventListener('load', initButton, { once: true });
  }
  
  // Handle resize events
  const debouncedMove = debounce(createAndPositionBtn, 150);
  window.addEventListener('resize', debouncedMove, { passive: true });
}

