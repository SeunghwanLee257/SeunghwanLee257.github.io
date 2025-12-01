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
  btn.className = 'ecosystem-btn is-ready';
  btn.setAttribute('aria-label', 'View benchmarks');
  btn.innerHTML = '<span class="ecosystem-label">Benchmarks</span>';
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
      }
    } else {
      // Move existing button if needed and ensure it's ready
      moveButton(btn);
      btn.classList.add('is-ready');
    }
  }, 'Responsive: createAndPositionBtn');
}

export function initResponsive() {
  // Execute after all resources are loaded
  if (document.readyState === 'complete') {
    createAndPositionBtn();
  } else {
    window.addEventListener('load', createAndPositionBtn, { once: true });
  }
  
  // Handle resize events
  const debouncedMove = debounce(createAndPositionBtn, 150);
  window.addEventListener('resize', debouncedMove, { passive: true });
}

