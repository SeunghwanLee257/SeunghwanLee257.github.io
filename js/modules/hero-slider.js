/**
 * Hero Slider Module
 * Handles hero section slide navigation and benchmark button toggle
 */

import { setupButtonHandlers } from '../utils/event-handlers.js';
import { $, $$, toggleClass, setAttr } from '../utils/dom.js';
import { validateElement } from '../utils/error-handler.js';

export function initHeroSlider() {
  const benchBtn = $('.ecosystem-btn');
  const heroSlider = $('[data-hero-slider]');
  if (!validateElement(heroSlider, 'HeroSlider')) return;

  const slides = $$('.hero-slide', heroSlider);
  const prevBtn = $('.hero-nav-prev', heroSlider);
  const nextBtn = $('.hero-nav-next', heroSlider);
  let activeIndex = slides.findIndex(slide => slide.classList.contains('is-active'));
  if (activeIndex < 0) activeIndex = 0;

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
    if (benchBtn) {
      toggleClass(benchBtn, 'is-active', normalizedIndex === 1);
    }
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

  const handleHeroRequest = (event) => {
    const requested = event?.detail?.index ?? 1;
    updateSlideState(requested);
  };

  document.addEventListener('hero:request-slide', handleHeroRequest);

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
  }

  updateSlideState(activeIndex);
}

