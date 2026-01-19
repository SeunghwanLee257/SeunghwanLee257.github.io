/**
 * DOM Utilities
 * Common DOM manipulation helpers
 */

/**
 * Query selector with null check
 * @param {string} selector
 * @param {Element} context
 * @returns {Element|null}
 */
export function $(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * Query selector all as array
 * @param {string} selector
 * @param {Element} context
 * @returns {Array<Element>}
 */
export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/**
 * Check if element exists
 * @param {Element|null} element
 * @returns {boolean}
 */
export function exists(element) {
  return element !== null && element !== undefined;
}

/**
 * Toggle class on element
 * @param {Element} element
 * @param {string} className
 * @param {boolean} condition
 */
export function toggleClass(element, className, condition) {
  if (element) {
    element.classList.toggle(className, condition);
  }
}

/**
 * Set attribute on element
 * @param {Element} element
 * @param {string} attr
 * @param {string|boolean} value
 */
export function setAttr(element, attr, value) {
  if (element) {
    element.setAttribute(attr, String(value));
  }
}

