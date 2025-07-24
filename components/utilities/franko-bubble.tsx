"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect } from "react";

const EXCLUDED_PATHS = ["/", "/pricing", "/faqs", "/terms", "/privacy"];

export function FrankoBubble() {
  const pathname = usePathname();
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();

  if (!isSignedIn) return null;
  if (!pathname || EXCLUDED_PATHS.includes(pathname)) return null;

  const name = user?.fullName ?? "";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  // Clean up bubble, iframe, and scripts on unmount so it doesn't persist after route changes
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        try {
          // Remove bubble button
          document.querySelector('[aria-label="Open chat"]')?.remove();
          // Remove Franko iframe
          document.querySelector('iframe[src*="/embed/"]')?.remove();
          // Remove any embed.js script tags that were added
          document.querySelectorAll('script[src*="/embed.js"]').forEach((el) => el.parentNode?.removeChild(el));
          // Clear the global API to avoid stale references
          if (window.FrankoModal) delete (window as any).FrankoModal;
        } catch (e) {
          console.warn("[Franko] Cleanup error:", e);
        }
      }
    };
  }, []);

  return (
    <>
      {/* Bubble snippet */}
      <Script
        id="franko-bubble-global"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `(
            function(){
              if(!window.FrankoModal){
                window.FrankoModal=(...a)=>{window.FrankoModal.q=window.FrankoModal.q||[];window.FrankoModal.q.push(a)};
                window.FrankoModal=new Proxy(window.FrankoModal,{get:(t,p)=>p==="q"?t.q:(...a)=>t(p,...a)})
              }
              window.FrankoUser = { user_id: ${JSON.stringify(userId)}, user_metadata: { name: ${JSON.stringify(
            name
          )}, email: ${JSON.stringify(email)} } };
              const l=()=>{
                const s=document.createElement("script");
                s.src="https://franko.ai/embed.js";
                s.setAttribute("data-modal-slug","franko-1753006030406");
                s.setAttribute("data-mode","bubble");
                s.onload=()=>{ if(window.FrankoModal.q){ window.FrankoModal.q.forEach(([m,...a])=>window.FrankoModal[m]&&window.FrankoModal[m](...a)); window.FrankoModal.q=[]; } };
                document.head.appendChild(s);
              };
              document.readyState==="complete"?l():addEventListener("load",l);
            })();`,
        }}
      />
    </>
  );
} 