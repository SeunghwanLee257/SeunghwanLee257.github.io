'use strict';
(function () {
  const LANG_KEY = 'fhe16-lang';

  function applyLang(lang) {
    var isKo = lang === 'ko';
    document.documentElement.classList.toggle('lang-ko', isKo);
    localStorage.setItem(LANG_KEY, lang);

    // Update toggle button labels
    document.querySelectorAll('.lang-toggle').forEach(function (btn) {
      btn.textContent = isKo ? 'EN' : '한국어';
    });

    // Update <title> if it has data-en/data-ko
    var titleEl = document.querySelector('title[data-en]');
    if (titleEl) document.title = isKo ? (titleEl.dataset.ko || document.title) : titleEl.dataset.en;

    // Update elements with data-en / data-ko (for textContent-only elements like option, button, label)
    document.querySelectorAll('[data-en][data-ko]').forEach(function (el) {
      var tag = el.tagName.toLowerCase();
      // Skip title (handled above), skip elements that use span-pair approach
      if (tag === 'title') return;
      el.textContent = isKo ? el.dataset.ko : el.dataset.en;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.lang-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var isKo = document.documentElement.classList.contains('lang-ko');
        applyLang(isKo ? 'en' : 'ko');
      });
    });
    // init
    var isKo = document.documentElement.classList.contains('lang-ko');
    document.querySelectorAll('.lang-toggle').forEach(function (btn) {
      btn.textContent = isKo ? 'EN' : '한국어';
    });
    // Apply data-en/data-ko attributes on load
    applyLang(isKo ? 'ko' : 'en');
  });

  // Apply stored preference immediately (before DOMContentLoaded) to avoid flash
  var stored = localStorage.getItem(LANG_KEY);
  if (stored !== 'en') {  // ko-first: default Korean unless user explicitly chose English
    document.documentElement.classList.add('lang-ko');
  }
}());
