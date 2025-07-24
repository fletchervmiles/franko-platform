"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function FrankoBubble() {
  const pathname = usePathname();
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();

  // Exact-match rule: bubble only on "/workspace"
  const shouldRender = isSignedIn && pathname === "/workspace";

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
        if (window.FrankoModal) delete (window as any).FrankoModal;
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
  }, [shouldRender, userId, name, email]);

  // No visual JSX needed; side-effect only component.
  return null;
} 