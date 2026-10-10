"use client";

import { useEffect, useRef } from "react";

export interface UseUnsavedChangesWarningOptions {
  isDirty: boolean;
  isSubmitting?: boolean;
  message?: string;
}

/**
 * Hook to prevent accidental loss of filled form data on reload or navigation.
 * - Prompts confirmation on browser refresh / reload / tab close via window beforeunload event.
 * - Prompts confirmation before internal link navigation (sidebar, breadcrumb, etc.).
 */
export function useUnsavedChangesWarning({
  isDirty,
  isSubmitting = false,
  message = "Data produk yang sudah diisi belum disimpan. Apakah Anda yakin ingin memuat ulang atau meninggalkan halaman ini?",
}: UseUnsavedChangesWarningOptions) {
  const isDirtyRef = useRef(isDirty);
  const isSubmittingRef = useRef(isSubmitting);
  const messageRef = useRef(message);

  useEffect(() => {
    isDirtyRef.current = isDirty;
    isSubmittingRef.current = isSubmitting;
    messageRef.current = message;
  }, [isDirty, isSubmitting, message]);

  // 1. Intercept browser reload / refresh / tab close (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirtyRef.current || isSubmittingRef.current) {
        return;
      }

      event.preventDefault();
      // Standard requirement for cross-browser prompt display
      event.returnValue = messageRef.current;
      return messageRef.current;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // 2. Intercept internal link navigation (sidebar, breadcrumbs, header links)
  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      if (!isDirtyRef.current || isSubmittingRef.current) {
        return;
      }

      const target = (event.target as HTMLElement | null)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        target.target === "_blank" ||
        target.hasAttribute("download")
      ) {
        return;
      }

      // Ignore if clicking the exact current URL/path
      if (
        target.pathname === window.location.pathname &&
        target.search === window.location.search
      ) {
        return;
      }

      const confirmLeave = window.confirm(messageRef.current);
      if (!confirmLeave) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleAnchorClick, {
        capture: true,
      });
    };
  }, []);
}
