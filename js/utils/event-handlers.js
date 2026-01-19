/**
 * Event Handlers Utilities
 * Common event handling patterns
 */

/**
 * Check if key is Enter or Space
 * @param {KeyboardEvent} event
 * @returns {boolean}
 */
export function isActivationKey(event) {
  return event.key === 'Enter' || event.key === ' ';
}

/**
 * Check if key is Escape
 * @param {KeyboardEvent} event
 * @returns {boolean}
 */
export function isEscapeKey(event) {
  return event.key === 'Escape';
}

/**
 * Handle click event with preventDefault
 * @param {Event} event
 * @param {Function} handler
 */
export function handleClick(event, handler) {
  event.preventDefault();
  handler(event);
}

/**
 * Handle click event with preventDefault and stopPropagation
 * @param {Event} event
 * @param {Function} handler
 */
export function handleClickWithStop(event, handler) {
  event.preventDefault();
  event.stopPropagation();
  handler(event);
}

/**
 * Handle keyboard activation (Enter/Space)
 * @param {KeyboardEvent} event
 * @param {Function} handler
 */
export function handleKeyboardActivation(event, handler) {
  if (isActivationKey(event)) {
    event.preventDefault();
    handler(event);
  }
}

/**
 * Setup click and keyboard handlers for a button
 * @param {HTMLElement} element
 * @param {Function} handler
 * @param {boolean} stopPropagation - Whether to stop propagation
 */
export function setupButtonHandlers(element, handler, stopPropagation = false) {
  if (!element) return;
  
  const clickHandler = stopPropagation ? handleClickWithStop : handleClick;
  
  element.addEventListener('click', (event) => {
    clickHandler(event, handler);
  });
  
  element.addEventListener('keydown', (event) => {
    handleKeyboardActivation(event, handler);
  });
}

/**
 * Setup outside click handler
 * @param {HTMLElement} targetElement - Element to check visibility
 * @param {HTMLElement} triggerElement - Trigger element to exclude
 * @param {Function} handler - Handler to call when clicking outside
 * @param {string} visibilityClass - Class name to check for visibility
 */
export function setupOutsideClickHandler(targetElement, triggerElement, handler, visibilityClass) {
  document.addEventListener('click', (event) => {
    if (targetElement.classList.contains(visibilityClass) && 
        !targetElement.contains(event.target) && 
        !triggerElement.contains(event.target)) {
      handler(event);
    }
  });
}

/**
 * Setup Escape key handler
 * @param {HTMLElement} targetElement - Element to check visibility
 * @param {Function} handler - Handler to call on Escape
 * @param {string} visibilityClass - Class name to check for visibility
 */
export function setupEscapeHandler(targetElement, handler, visibilityClass) {
  document.addEventListener('keydown', (event) => {
    if (isEscapeKey(event) && targetElement.classList.contains(visibilityClass)) {
      handler(event);
    }
  });
}

