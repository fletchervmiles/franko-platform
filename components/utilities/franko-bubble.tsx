"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useAuth, useUser } from "@clerk/nextjs";

const EXCLUDED_PATHS = ["/", "/pricing", "/faqs", "/terms", "/privacy"];

export function FrankoBubble() {
  const pathname = usePathname();
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();

  if (!isSignedIn) return null;
  if (EXCLUDED_PATHS.includes(pathname)) return null;

  const name = user?.fullName ?? "";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  return (
    <>
      {/* Identity snippet */}
      <Script
        id="franko-user-global"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.FrankoUser = { user_id: ${JSON.stringify(userId)}, user_metadata: { name: ${JSON.stringify(
            name
          )}, email: ${JSON.stringify(email)} } };`,
        }}
      />

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
              const l=()=>{
                const s=document.createElement("script");
                s.src="https://franko.ai/embed.js";
                s.setAttribute("data-modal-slug","franko-1753006030406");
                s.setAttribute("data-mode","bubble");
                s.setAttribute("data-position","bottom-right");
                s.setAttribute("data-bubble-text","Feedback");
                s.setAttribute("data-bubble-color","#0C0A08");
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