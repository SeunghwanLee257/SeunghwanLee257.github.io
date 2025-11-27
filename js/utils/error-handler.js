/**
 * Error Handler Utilities
 * Centralized error handling and logging
 */

/**
 * Safe execution wrapper with error handling
 * @param {Function} fn - Function to execute
 * @param {string} context - Context description for error logging
 * @param {*} fallback - Fallback value if error occurs
 * @returns {*} Function result or fallback
 */
export function safeExecute(fn, context = 'Unknown', fallback = null) {
  try {
    return fn();
  } catch (error) {
    console.error(`[${context}] Error:`, error);
    return fallback;
  }
}

/**
 * Safe async execution wrapper
 * @param {Function} fn - Async function to execute
 * @param {string} context - Context description for error logging
 * @param {*} fallback - Fallback value if error occurs
 * @returns {Promise<*>} Function result or fallback
 */
export async function safeExecuteAsync(fn, context = 'Unknown', fallback = null) {
  try {
    return await fn();
  } catch (error) {
    console.error(`[${context}] Async Error:`, error);
    return fallback;
  }
}

/**
 * Validate element exists
 * @param {Element|null} element
 * @param {string} name
 * @returns {boolean}
 */
export function validateElement(element, name = 'Element') {
  if (!element) {
    console.warn(`[Validation] ${name} not found`);
    return false;
  }
  return true;
}

