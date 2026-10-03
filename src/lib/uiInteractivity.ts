/**
 * UI Interactivity & Button Rejuvenation Utility
 * Ensures all button elements, links, tabs, and form controls remain responsive,
 * clickable, and focusable during and after component state transitions (e.g. Tutorial -> Menu).
 */

export function restoreAllUIInteractivity(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // 1. Immediately cancel any active Web Speech synthesis to unblock browser event queue
  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }
  } catch (e) {
    console.warn("SpeechSynthesis cancel notice:", e);
  }

  // 2. Clean up document body and root container pointer-events and styles
  try {
    document.body.style.pointerEvents = "auto";
    document.body.style.userSelect = "auto";
    document.documentElement.style.pointerEvents = "auto";
    document.body.classList.remove("pointer-events-none", "gamepad-active");

    const root = document.getElementById("root");
    if (root) {
      root.style.pointerEvents = "auto";
      root.style.userSelect = "auto";
    }
  } catch (e) {
    console.warn("Document style reset notice:", e);
  }

  // 3. Clear blurred/detached activeElement focus and focus the main window
  try {
    if (document.activeElement && document.activeElement !== document.body) {
      (document.activeElement as HTMLElement).blur();
    }
    window.focus();
    if (document.body && typeof document.body.focus === "function") {
      document.body.focus();
    }
  } catch (e) {
    // Silently continue
  }

  // 4. Force re-enable all interactive buttons, inputs, and links
  const reEnableElements = () => {
    try {
      const interactiveEls = document.querySelectorAll<HTMLElement>(
        'button, [role="button"], a[href], input, select, textarea, [tabindex]'
      );

      interactiveEls.forEach((el) => {
        // Reset pointer events
        if (el.style.pointerEvents === "none") {
          el.style.pointerEvents = "auto";
        }

        // Reset aria-disabled if erroneously set
        if (el.getAttribute("aria-disabled") === "true" && el.dataset.keepDisabled !== "true") {
          el.removeAttribute("aria-disabled");
        }

        // Re-enable native buttons unless intentionally marked as disabled
        if (el instanceof HTMLButtonElement) {
          if (el.disabled && el.dataset.keepDisabled !== "true") {
            el.disabled = false;
          }
        }

        // Ensure tabindex is valid for keyboard navigation
        if (el.tabIndex < 0 && el.dataset.noTab !== "true" && el.tagName === "BUTTON") {
          el.tabIndex = 0;
        }
      });
    } catch (e) {
      console.warn("Element re-enable notice:", e);
    }
  };

  // Run immediately
  reEnableElements();

  // Run again after the next microtask / animation frame to catch React reconciliation mounts
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      reEnableElements();
      setTimeout(reEnableElements, 80);
      setTimeout(reEnableElements, 250);
    });
  }

  // 5. Dispatch global event for any components that need to refresh their listeners
  try {
    window.dispatchEvent(new CustomEvent("moro:ui-interactivity-restored"));
  } catch (e) {
    // CustomEvent fallback
  }
}

/**
 * React hook to guarantee UI interactivity is restored when a component unmounts
 */
import { useEffect } from "react";

export function useRestoreUIOnUnmount(): void {
  useEffect(() => {
    return () => {
      restoreAllUIInteractivity();
    };
  }, []);
}
