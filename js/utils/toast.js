/**
 * Toast Notification Utility
 * Simple toast notification system for user feedback
 */

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: 'error', 'success', 'info' (default: 'info')
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
  // Create toast container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.textContent = message;

  // Add to container
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('toast--show');
  });

  // Remove after duration
  setTimeout(() => {
    toast.classList.remove('toast--show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300); // Wait for fade-out animation
  }, duration);
}


