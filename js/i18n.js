/* ./js/i18n.js */
(function () {
  'use strict';
  window.I18N = window.I18N || {};
  window.I18N.en = Object.assign({}, window.I18N.en, {
    'highlight.float': 'Elimination of floating-point',
    'pA.kf1.tail': ' operations, ensuring identical results regardless of the execution environments',
    'pA.kf2.tail': ' environment-specific error issues'
  });
  window.I18N.ko = Object.assign({}, window.I18N.ko, {
    'highlight.float': '부동소수점 연산 제거',
    'pA.kf1.tail': '으로 실행 환경과 무관하게 동일한 결과 보장',
    'pA.kf2.tail': ' 환경 의존 오차 문제 제거'
  });
})();
