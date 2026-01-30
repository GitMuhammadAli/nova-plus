/**
 * Accessibility Utilities
 * Helper functions and constants for improving accessibility
 */

/**
 * Keyboard key codes for event handling
 */
export const Keys = {
  Enter: "Enter",
  Space: " ",
  Escape: "Escape",
  Tab: "Tab",
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  Home: "Home",
  End: "End",
} as const;

/**
 * Check if event is an activation key (Enter or Space)
 */
export function isActivationKey(event: React.KeyboardEvent): boolean {
  return event.key === Keys.Enter || event.key === Keys.Space;
}

/**
 * Handle keyboard activation (Enter/Space) like a click
 */
export function handleKeyboardActivation(
  event: React.KeyboardEvent,
  callback: () => void
): void {
  if (isActivationKey(event)) {
    event.preventDefault();
    callback();
  }
}

/**
 * Create keyboard handler that triggers callback on Enter/Space
 */
export function createKeyboardHandler(callback: () => void) {
  return (event: React.KeyboardEvent) => {
    handleKeyboardActivation(event, callback);
  };
}

/**
 * Get ARIA live region props for dynamic content
 */
export function getLiveRegionProps(
  politeness: "polite" | "assertive" = "polite",
  atomic: boolean = false
) {
  return {
    "aria-live": politeness,
    "aria-atomic": atomic,
    role: "status",
  };
}

/**
 * Screen reader only class
 */
export const srOnly = "sr-only";

/**
 * Skip link target ID
 */
export const SKIP_LINK_TARGET_ID = "main-content";

/**
 * Focus trap helper - get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
}

/**
 * Trap focus within a container (for modals, dialogs)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== Keys.Tab) return;

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown);
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Announce message to screen readers
 */
export function announce(message: string, politeness: "polite" | "assertive" = "polite"): void {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", politeness);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Generate unique ID for ARIA associations
 */
let idCounter = 0;
export function generateId(prefix: string = "id"): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Describe field errors for screen readers
 */
export function getErrorDescribedBy(
  baseId: string,
  hasError: boolean
): string | undefined {
  return hasError ? `${baseId}-error` : undefined;
}

/**
 * Reduced motion media query check
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * High contrast mode check
 */
export function prefersHighContrast(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-contrast: more)").matches;
}

