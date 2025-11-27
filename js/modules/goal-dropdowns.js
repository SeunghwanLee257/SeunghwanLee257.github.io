/**
 * Goal Dropdowns Module
 * Handles goal section accordion functionality
 */

import { setupButtonHandlers } from '../utils/event-handlers.js';
import { $$, toggleClass, setAttr } from '../utils/dom.js';
import { safeExecute } from '../utils/error-handler.js';

export function initGoalDropdowns() {
  const cards = $$('.goal-dropdown-card');
  if (!cards.length) return;

  const setState = (targetCard, open) => {
    return safeExecute(() => {
      const header = targetCard.querySelector('.goal-dropdown-header');
      const content = targetCard.querySelector('.goal-dropdown-content');
      if (!header || !content) return;
      setAttr(header, 'aria-expanded', open);
      setAttr(content, 'aria-hidden', !open);
      toggleClass(targetCard, 'is-open', open);
      // initGoalAccordion이 설정한 max-height 인라인 스타일 제거
      if (content.style.maxHeight) {
        content.style.maxHeight = '';
      }
    }, 'GoalDropdowns: setState');
  };

  const closeAll = () => {
    cards.forEach(card => setState(card, false));
  };

  cards.forEach(card => {
    const header = card.querySelector('.goal-dropdown-header');
    if (!header) return;
    
    const handleToggle = () => {
      const isOpen = card.classList.contains('is-open');
      closeAll();
      // closeAll 후에는 모두 닫혀있으므로, 클릭한 카드는 열어야 함
      setState(card, true);
    };
    
    setupButtonHandlers(header, handleToggle);
  });

  // 첫 번째 카드를 기본으로 열기
  if (cards[0]) {
    setState(cards[0], true);
  }
}

