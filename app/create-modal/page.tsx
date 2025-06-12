"use client"

import { SettingsProvider } from "@/lib/settings-context"
import SimpleTabs from "@/components/multi-agent/simple-tabs"
import { NavSidebar } from "@/components/nav-sidebar"

export default function CreateModalPage() {
  return (
    <NavSidebar>
      <SettingsProvider>
        <div className="w-full p-4 md:p-8 lg:p-12 space-y-8">
          <SimpleTabs />
        </div>
      </SettingsProvider>
    </NavSidebar>
  )
}
