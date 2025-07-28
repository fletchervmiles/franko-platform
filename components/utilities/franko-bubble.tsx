"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function FrankoBubble() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();

  // Exact-match rule: bubble only on "/workspace" with NO query params
  const hasQuery = searchParams && searchParams.toString().length > 0;
  const shouldRender = isSignedIn && pathname === "/workspace" && !hasQuery;

  const name = user?.fullName ?? "";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  // Keep a ref to the dynamically injected <script> so we can remove it later
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return; // SSR safeguard

    const cleanup = () => {
      try {
        document.querySelector('[aria-label="Open chat"]')?.remove();
        document.querySelector('iframe[src*="/embed/"]')?.remove();
        if (scriptRef.current) {
          scriptRef.current.parentNode?.removeChild(scriptRef.current);
          scriptRef.current = null;
        }
        // Keep global FrankoModal to avoid race conditions during React remounts
        // if (window.FrankoModal) delete (window as any).FrankoModal;
      } catch (err) {
        console.warn("[Franko] Cleanup error:", err);
      }
    };

    if (shouldRender) {
      // Inject only if not already present
      if (!scriptRef.current) {
        window.FrankoUser = {
          user_id: userId,
          user_metadata: { name, email },
        } as any;

        const s = document.createElement("script");
        s.src = "https://franko.ai/embed.js";
        s.setAttribute("data-modal-slug", "franko-1753006030406");
        s.setAttribute("data-mode", "bubble");
        s.async = true;
        scriptRef.current = s;
        document.head.appendChild(s);
      }
    } else {
      cleanup();
    }

    // Cleanup on unmount
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRender, userId, name, email, searchParams]);

  // No visual JSX needed; side-effect only component.
  return null;
} 