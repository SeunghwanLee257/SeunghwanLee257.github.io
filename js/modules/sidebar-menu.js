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
  
  // Archive 모달 열기 이벤트
  const archiveLinks = sidebarMenu.querySelectorAll('.sidebar-menu-link[data-modal]');
  const archiveModal = document.getElementById('archiveModal');
  
  if (archiveLinks.length > 0 && archiveModal) {
    archiveLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 사이드바 먼저 닫기
        if (sidebarMenu.classList.contains('is-open')) {
          toggleSidebar();
        }
        
        // 모달 열기 전에 약간의 지연 (사이드바 닫기 애니메이션 완료 대기)
        setTimeout(() => {
          const modalId = link.getAttribute('data-modal');
          // 탭 전환
          if (modalId === 'alumni-community') {
            switchArchiveTab('alumni');
          } else if (modalId === 'ir') {
            switchArchiveTab('ir');
          }
          openArchiveModal(archiveModal);
        }, 100);
      });
    });
  }
  
  // Archive 모달 닫기 이벤트
  if (archiveModal) {
    const closeBtn = archiveModal.querySelector('.archive-modal-close');
    const overlay = archiveModal.querySelector('.archive-modal-overlay');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeArchiveModal(archiveModal));
    }
    
    if (overlay) {
      overlay.addEventListener('click', () => closeArchiveModal(archiveModal));
    }
    
    // 탭 전환 이벤트
    const tabs = archiveModal.querySelectorAll('.archive-modal-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        switchArchiveTab(tabName);
      });
    });
  }
  
  // ESC 키로 모달 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && archiveModal && archiveModal.classList.contains('is-open')) {
      closeArchiveModal(archiveModal);
    }
  });
}

function switchArchiveTab(tabName) {
  const archiveModal = document.getElementById('archiveModal');
  if (!archiveModal) return;
  
  const tabs = archiveModal.querySelectorAll('.archive-modal-tab');
  const panels = archiveModal.querySelectorAll('.archive-modal-panel');
  
  tabs.forEach(tab => {
    const isActive = tab.getAttribute('data-tab') === tabName;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', isActive);
  });
  
  panels.forEach(panel => {
    const isActive = panel.id === `${tabName}-panel`;
    panel.classList.toggle('is-active', isActive);
    panel.setAttribute('aria-hidden', !isActive);
  });
}

function openArchiveModal(modal) {
  if (!modal) return;
  
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeArchiveModal(modal) {
  if (!modal) return;
  
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

