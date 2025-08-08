"use client";

import { Suspense, useEffect } from "react";
import { NavSidebar } from "@/components/nav-sidebar";
import { SettingsProvider } from "@/lib/settings-context";
import dynamic from "next/dynamic";

// Dynamically import ModalManager with no SSR to avoid the useSearchParams issue
const ModalManager = dynamic(
  () => import("@/components/multi-agent/modal-manager"),
  { 
    ssr: false,
    loading: () => <div className="min-h-[400px]" />
  }
);

export default function WorkspacePage() {
  // If user navigated here via sidebar Feedback button, open modal once bubble is ready
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const flag = window.sessionStorage.getItem('franko_open_on_workspace');
    if (!flag) return;
    window.sessionStorage.removeItem('franko_open_on_workspace');

    const tryOpen = () => {
      if ((window as any).FrankoModal && typeof (window as any).FrankoModal.open === 'function') {
        (window as any).FrankoModal.open();
        return true;
      }
      return false;
    };

    if (tryOpen()) return;
    const start = Date.now();
    const interval = setInterval(() => {
      if (tryOpen() || Date.now() - start > 4000) {
        clearInterval(interval);
      }
    }, 200);
  }, []);

  return (
    <>
      <NavSidebar>
        <SettingsProvider>
          <div className="w-full p-4 md:p-8 lg:p-12">
            <ModalManager />
          </div>
        </SettingsProvider>
      </NavSidebar>
    </>
  );
}