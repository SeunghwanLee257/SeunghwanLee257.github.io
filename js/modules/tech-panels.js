/**
 * Tech Panels Module
 * Handles technology panel switching
 */

import { $$, toggleClass, setAttr } from '../utils/dom.js';
import { safeExecute } from '../utils/error-handler.js';

export function initTechPanels() {
  const techPanels = $$('.tech-panel');
  const techTriggers = $$('[data-tech-target]');
  
  if (!techPanels.length || !techTriggers.length) return;

  const setActiveTech = (targetId) => {
    return safeExecute(() => {
      techPanels.forEach(panel => {
        const isActive = panel.id === targetId;
        const trigger = panel.querySelector('.tech-panel-trigger');
        
        toggleClass(panel, 'tech-panel--active', isActive);
        toggleClass(panel, 'tech-panel--inactive', !isActive);
        setAttr(panel, 'aria-hidden', !isActive);
        
        // Inactive 패널의 trigger는 키보드 포커스를 받지 않도록 설정
        if (trigger) {
          if (isActive) {
            trigger.removeAttribute('tabindex');
          } else {
            trigger.setAttribute('tabindex', '-1');
          }
        }
      });
    }, 'TechPanels: setActiveTech');
  };

  techTriggers.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tech-target');
      if (target) {
        setActiveTech(target);
      }
    });
  });

  setActiveTech('panel-a');
}

