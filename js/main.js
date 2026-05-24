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
// import { initResponsive } from './modules/responsive.js'; // Disabled - using dropdown instead
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
    { name: 'HeroScroll', init: initHeroScroll }
    // { name: 'Responsive', init: initResponsive } // Disabled - using dropdown instead
  ];

  modules.forEach(module => {
    safeExecute(() => {
      module.init();
    }, `Main: ${module.name}`);
  });

  // Nav Dropdowns (multiple)
  safeExecute(() => {
    const dropdowns = document.querySelectorAll('.nav-dropdown');

    dropdowns.forEach(dropdown => {
      const btn = dropdown.querySelector('.nav-dropdown-btn');
      const menu = dropdown.querySelector('.nav-dropdown-menu');

      if (btn && menu) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();

          // 다른 드롭다운 닫기
          dropdowns.forEach(other => {
            if (other !== dropdown) {
              other.classList.remove('is-open');
              other.querySelector('.nav-dropdown-btn')?.setAttribute('aria-expanded', 'false');
            }
          });

          const isOpen = dropdown.classList.toggle('is-open');
          btn.setAttribute('aria-expanded', isOpen);
        });

        // 메뉴 항목 클릭 시 닫기
        menu.querySelectorAll('a').forEach(link => {
          link.addEventListener('click', () => {
            dropdown.classList.remove('is-open');
            btn.setAttribute('aria-expanded', 'false');
          });
        });
      }
    });

    // 외부 클릭 시 모든 드롭다운 닫기
    document.addEventListener('click', (e) => {
      dropdowns.forEach(dropdown => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('is-open');
          dropdown.querySelector('.nav-dropdown-btn')?.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }, 'Main: NavDropdown');

  // Modal opener from nav dropdown
  safeExecute(() => {
    document.querySelectorAll('[data-open-modal]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const modalId = link.getAttribute('data-open-modal');
        const tabId = link.getAttribute('data-tab');
        const modal = document.getElementById(modalId);

        if (modal) {
          modal.classList.add('is-open');
          document.body.style.overflow = 'hidden';

          // Activate specific tab if specified
          if (tabId) {
            const tab = modal.querySelector(`#${tabId}-tab`);
            const panel = modal.querySelector(`#${tabId}-panel`);
            if (tab && panel) {
              modal.querySelectorAll('.archive-modal-tab').forEach(t => t.classList.remove('is-active'));
              modal.querySelectorAll('.archive-modal-panel').forEach(p => p.classList.remove('is-active'));
              tab.classList.add('is-active');
              panel.classList.add('is-active');
            }
          }
        }
      });
    });
  }, 'Main: ModalOpener');
});
