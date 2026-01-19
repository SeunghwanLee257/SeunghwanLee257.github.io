/**
 * Hero Scroll Animation Module
 * Handles hero section scroll-based animations
 * Note: Header visibility is controlled by initHeaderAutoHide()
 */

import { $, toggleClass } from '../utils/dom.js';
import { rafThrottle } from '../utils/performance.js';
import { safeExecute, validateElement } from '../utils/error-handler.js';

/**
 * Gets the current scroll position
 */
function getScrollY() {
  return Math.max(
    window.scrollY || 0,
    window.pageYOffset || 0,
    document.documentElement.scrollTop || 0,
    document.body.scrollTop || 0
  );
}

export function initHeroScroll() {
  const hero = $('.hero');
  const header = $('.header');
  
  if (!validateElement(hero, 'Hero') || !validateElement(header, 'Header')) return;
  
  /**
   * Updates hero and header styles based on scroll position
   */
  const updateHero = (forcedScrollY = null) => {
    const scrollY = forcedScrollY !== null ? forcedScrollY : getScrollY();
    const isAtTop = scrollY <= 5;
    
    // Update hero and header background states
    // Header visibility is controlled by initHeaderAutoHide()
    toggleClass(hero, 'is-scrolled', !isAtTop);
    toggleClass(header, 'has-scrolled', !isAtTop);
  };
  
  // Initialize header state
  toggleClass(header, 'has-scrolled', false);
  
  // Initial update
  safeExecute(updateHero, 'HeroScroll: initial update');
  
  // Throttled scroll handler
  const throttledUpdate = rafThrottle(updateHero);
  const handleScroll = () => throttledUpdate();
  
  // Event listeners
  const scrollOptions = { passive: true, capture: true };
  window.addEventListener('scroll', handleScroll, scrollOptions);
  window.addEventListener('wheel', handleScroll, scrollOptions);
  
  const handleResize = rafThrottle(handleScroll);
  window.addEventListener('resize', handleResize, { passive: true });
  
  // Backup scroll check (handles edge cases)
  let lastScrollY = -1;
  const checkScroll = () => {
    const currentScrollY = getScrollY();
    if (currentScrollY !== lastScrollY) {
      lastScrollY = currentScrollY;
      updateHero(currentScrollY);
    }
  };
  
  setInterval(() => safeExecute(checkScroll, 'HeroScroll: backup check'), 100);
}

