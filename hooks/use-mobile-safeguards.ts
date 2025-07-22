"use client"

import { useEffect } from "react"

/**
 * useMobileSafeguards – disables pinch-zoom, pull-to-refresh and overscroll bounce
 * on iOS/Android. Also injects a restrictive viewport meta tag.
 *
 * This is the same logic used in external chat pages, extracted so it can be
 * reused by the embedded chat iframe.
 */
export function useMobileSafeguards() {
  useEffect(() => {
    // 1. Inject / update viewport meta tag
    const content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";
    let viewportMeta: HTMLMetaElement | null = document.querySelector(
      'meta[name="viewport"]'
    );
    const createdViewport = !viewportMeta;
    if (!viewportMeta) {
      viewportMeta = document.createElement("meta");
      viewportMeta.name = "viewport";
      document.head.appendChild(viewportMeta);
    }
    const previousContent = viewportMeta!.getAttribute("content");
    viewportMeta!.setAttribute("content", content);

    // 2. Prevent overscroll bounce via CSS
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `html,body{overscroll-behavior:none;}`;
    document.head.appendChild(styleEl);

    // 3. Prevent pinch-zoom & pull-to-refresh via touch listeners
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    const preventPullToRefresh = (e: TouchEvent) => {
      // Allow normal interaction if the target is a button / link
      const interactive = (e.target as HTMLElement)?.closest(
        'button, a, [role="button"], input, textarea'
      );
      if (interactive) return;

      // Only block if the document is scrolled to the very top
      if (window.scrollY !== 0) return;

      const touchY = e.touches[0]?.clientY;
      // Smaller threshold (10px) to avoid capturing header taps
      if (touchY < 10 && e.type === "touchstart") {
        e.preventDefault();
      }
    };
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener("touchmove", preventZoom, { passive: false });
    document.addEventListener("touchstart", preventPullToRefresh, {
      passive: false,
    });
    document.addEventListener("gesturestart", preventGesture, { passive: false });

    return () => {
      // Restore original viewport if we modified it
      if (viewportMeta) {
        if (createdViewport) {
          viewportMeta.remove();
        } else if (previousContent) {
          viewportMeta.setAttribute("content", previousContent);
        }
      }
      // Remove style element
      styleEl.remove();
      // Remove listeners
      document.removeEventListener("touchmove", preventZoom);
      document.removeEventListener("touchstart", preventPullToRefresh);
      document.removeEventListener("gesturestart", preventGesture);
    };
  }, []);
} 