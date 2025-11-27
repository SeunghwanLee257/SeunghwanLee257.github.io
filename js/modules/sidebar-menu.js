/**
 * Sidebar Menu Module
 * Handles mobile sidebar menu toggle
 */

import { setupButtonHandlers, setupOutsideClickHandler, setupEscapeHandler } from '../utils/event-handlers.js';
import { $, toggleClass, setAttr } from '../utils/dom.js';

export function initSidebarMenu() {
  const menuBtn = $('.header-menu-btn');
  const sidebarMenu = $('#sidebarMenu');
  
  if (!menuBtn || !sidebarMenu) return;

  const toggleSidebar = () => {
    const isOpen = sidebarMenu.classList.contains('is-open');
    toggleClass(sidebarMenu, 'is-open', !isOpen);
    setAttr(sidebarMenu, 'aria-hidden', isOpen);
    toggleClass(menuBtn, 'is-active', !isOpen);
    setAttr(menuBtn, 'aria-expanded', !isOpen);
    
    document.body.style.overflow = !isOpen ? 'hidden' : '';
  };

  setupButtonHandlers(menuBtn, toggleSidebar);
  setupOutsideClickHandler(sidebarMenu, menuBtn, toggleSidebar, 'is-open');
  setupEscapeHandler(sidebarMenu, toggleSidebar, 'is-open');
}

