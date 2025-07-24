"use client";

import { Suspense } from "react";
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