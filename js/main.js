/**
 * Main application script
 * Initializes all modules and components
 */

import { initHeroSlider } from './modules/hero-slider.js';
import { initSolutions } from './modules/solutions.js';
import { initTechPanels } from './modules/tech-panels.js';
import { initUseCaseSlider, initTeamSlider } from './modules/sliders.js';
import { initGoalDropdowns } from './modules/goal-dropdowns.js';
import { initLanguage } from './modules/language.js';
import { initNavigation } from './modules/navigation.js';
import { initSNSToggle } from './modules/sns-toggle.js';
import { initSidebarMenu } from './modules/sidebar-menu.js';
import { initHeroScroll } from './modules/hero-scroll.js';
import { initResponsive } from './modules/responsive.js';
import { safeExecute } from './utils/error-handler.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize AOS (Animate On Scroll)
  safeExecute(() => {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        once: true,
        duration: 700,
        easing: 'ease-out-cubic'
      });
    }
  }, 'Main: AOS init');

  // Initialize all modules with error handling
  const modules = [
    { name: 'HeroSlider', init: initHeroSlider },
    { name: 'Solutions', init: initSolutions },
    { name: 'TechPanels', init: initTechPanels },
    { name: 'UseCaseSlider', init: initUseCaseSlider },
    { name: 'TeamSlider', init: initTeamSlider },
    { name: 'GoalDropdowns', init: initGoalDropdowns },
    { name: 'Language', init: initLanguage },
    { name: 'Navigation', init: initNavigation },
    { name: 'SNSToggle', init: initSNSToggle },
    { name: 'SidebarMenu', init: initSidebarMenu },
    { name: 'HeroScroll', init: initHeroScroll },
    { name: 'Responsive', init: initResponsive }
  ];

  modules.forEach(module => {
    safeExecute(() => {
      module.init();
    }, `Main: ${module.name}`);
  });
});
