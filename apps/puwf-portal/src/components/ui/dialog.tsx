"use client";

import { t } from "@kapas/localization";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import { useLocaleStore } from "@/stores/locale-store";

const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

const panelSizeClass = {
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-5xl",
} as const;

export function Dialog({
  open,
  title,
  onClose,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof panelSizeClass;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const large = size !== "md";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusables = () => Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    focusables()[0]?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const items = focusables();
      if (items.length === 0) {
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-ink/60 backdrop-blur-[3px]"
        aria-label={t(locale, "common.close")}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 flex w-full max-h-[min(92vh,900px)] flex-col overflow-hidden rounded-card border border-border bg-surface shadow-[0_24px_64px_rgba(20,30,24,0.35)]",
          panelSizeClass[size],
        )}
      >
        <header className="border-b border-border bg-page px-5 py-4 sm:px-6">
          <h2
            id={titleId}
            className={cn("font-semibold text-ink", large ? "text-lg leading-7" : "text-base leading-6")}
          >
            {title}
          </h2>
        </header>
        <div
          className={cn(
            "flex-1 space-y-3 overflow-y-auto px-5 py-4 text-ink sm:px-6 sm:py-5",
            large ? "text-base leading-7" : "text-sm leading-6",
          )}
        >
          {children}
        </div>
        {footer ? (
          <footer className="flex justify-end gap-2 border-t border-border bg-page px-5 py-3 sm:px-6">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
