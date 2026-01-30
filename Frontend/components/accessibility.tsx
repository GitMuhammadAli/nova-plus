"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { SKIP_LINK_TARGET_ID } from "@/lib/accessibility";

/**
 * Skip Link Component
 * Allows keyboard users to skip navigation and go directly to main content
 */
export function SkipLink({
  href = `#${SKIP_LINK_TARGET_ID}`,
  children = "Skip to main content",
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={cn(
        "fixed left-0 top-0 z-[100] block -translate-y-full px-4 py-2",
        "bg-primary text-primary-foreground font-medium",
        "focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "transition-transform duration-200"
      )}
    >
      {children}
    </a>
  );
}

/**
 * Main Content Target
 * Place this at the beginning of your main content
 */
export function MainContentTarget({
  id = SKIP_LINK_TARGET_ID,
}: {
  id?: string;
}) {
  return <div id={id} tabIndex={-1} className="outline-none" />;
}

/**
 * Visually Hidden Component
 * Content is hidden visually but accessible to screen readers
 */
export function VisuallyHidden({
  children,
  as: Component = "span",
}: {
  children: React.ReactNode;
  as?: React.ElementType;
}) {
  return (
    <Component
      className={cn(
        "absolute w-px h-px p-0 -m-px overflow-hidden",
        "clip-[rect(0,0,0,0)] whitespace-nowrap border-0"
      )}
    >
      {children}
    </Component>
  );
}

/**
 * Live Region Component
 * For announcing dynamic content changes to screen readers
 */
export function LiveRegion({
  children,
  politeness = "polite",
  atomic = false,
  className,
}: {
  children: React.ReactNode;
  politeness?: "polite" | "assertive";
  atomic?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      role="status"
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * Screen Reader Only Announcement
 * Announces a message to screen readers without visible UI
 */
export function SrAnnouncement({
  message,
  politeness = "polite",
}: {
  message: string;
  politeness?: "polite" | "assertive";
}) {
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

/**
 * Focus Trap Component
 * Traps focus within a container (useful for modals)
 */
export function FocusTrap({
  children,
  active = true,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Store previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;

    // Focus first element
    firstElement?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      // Restore focus when unmounted
      previouslyFocused?.focus();
    };
  }, [active]);

  return <div ref={containerRef}>{children}</div>;
}

/**
 * Reduced Motion Wrapper
 * Disables animations when user prefers reduced motion
 */
export function ReducedMotion({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [prefersReduced, setPrefersReduced] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  if (prefersReduced && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Keyboard Navigation Info
 * Shows keyboard shortcuts overlay (typically on ? key)
 */
export function KeyboardShortcuts({
  shortcuts,
  className,
}: {
  shortcuts: Array<{ key: string; description: string }>;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="font-semibold text-sm">Keyboard Shortcuts</h3>
      <dl className="space-y-1">
        {shortcuts.map(({ key, description }) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <dt>
              <kbd className="px-2 py-1 text-xs bg-muted rounded border">
                {key}
              </kbd>
            </dt>
            <dd className="text-muted-foreground">{description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

