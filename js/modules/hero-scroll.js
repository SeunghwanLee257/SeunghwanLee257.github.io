/**
 * Hero Scroll Animation Module
 * Handles hero section scroll-based animations and header visibility
 */

import { $, toggleClass } from '../utils/dom.js';
import { rafThrottle } from '../utils/performance.js';
import { safeExecute, validateElement } from '../utils/error-handler.js';

const isMobileOrTablet = () => {
  return window.innerWidth <= 1023;
};

export function initHeroScroll() {
  const hero = $('.hero');
  const header = $('.header');
  
  if (!validateElement(hero, 'Hero') || !validateElement(header, 'Header')) return;

  let ticking = false;
  let headerWasVisible = false;
  
  const getScrollElement = () => {
    const candidates = [
      document.documentElement,
      document.body,
      $('html'),
      $('body'),
      $('main')
    ];
    
    for (const el of candidates) {
      if (el && (el.scrollHeight > el.clientHeight || el.scrollTop > 0)) {
        return el;
      }
    }
    
    return document.documentElement;
  };
  
  const scrollElement = getScrollElement();
  
  const updateHero = (forcedScrollY = null) => {
    const scrollY = forcedScrollY !== null ? forcedScrollY : Math.max(
      window.scrollY || 0,
      window.pageYOffset || 0,
      document.documentElement.scrollTop || 0,
      document.body.scrollTop || 0,
      scrollElement.scrollTop || 0
    );
    
    const isAtTop = scrollY <= 5;
    
    // 모든 디바이스에서 header는 항상 표시
    if (!header.classList.contains('is-visible')) {
      toggleClass(header, 'is-visible', true);
    }
    
    if (isMobileOrTablet()) {
      // 모바일: hero와 header 배경만 변경
      toggleClass(hero, 'is-scrolled', !isAtTop);
      toggleClass(header, 'has-scrolled', !isAtTop);
    } else {
      // 데스크톱: hero와 header 배경만 변경
      toggleClass(hero, 'is-scrolled', !isAtTop);
      toggleClass(header, 'has-scrolled', !isAtTop);
    }
    
    ticking = false;
  };
  
  const throttledUpdate = rafThrottle(updateHero);
  
  const handleScroll = () => {
    throttledUpdate();
  };
  
  // 초기 상태: header 항상 표시, 배경 없음
  toggleClass(header, 'is-visible', true);
  toggleClass(header, 'has-scrolled', false);
  headerWasVisible = true;
  
  setTimeout(() => safeExecute(updateHero, 'HeroScroll: initial update'), 50);
  
  const scrollOptions = { passive: true, capture: true };
  
  // Optimize: only listen to window scroll
  window.addEventListener('scroll', handleScroll, scrollOptions);
  window.addEventListener('wheel', handleScroll, scrollOptions);
  
  const handleResize = rafThrottle(() => {
    handleScroll();
    if (isMobileOrTablet() && !header.classList.contains('is-visible')) {
      toggleClass(header, 'is-visible', true);
    }
  });
  
  window.addEventListener('resize', handleResize, { passive: true });
  
  // Backup scroll check with throttling
  let lastScrollY = -1;
  const checkScroll = () => {
    const currentScrollY = Math.max(
      window.scrollY || 0,
      window.pageYOffset || 0,
      document.documentElement.scrollTop || 0,
      document.body.scrollTop || 0,
      scrollElement.scrollTop || 0
    );
    
    if (currentScrollY !== lastScrollY) {
      lastScrollY = currentScrollY;
      updateHero(currentScrollY);
    }
  };
  
  // Use setInterval with longer interval for backup check
  setInterval(() => safeExecute(checkScroll, 'HeroScroll: backup check'), 100);
}

