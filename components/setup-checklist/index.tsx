"use client"

import { SetupChecklistProvider } from "@/contexts/setup-checklist-context"
import { SetupChecklistModal } from "./setup-checklist-modal"
import { SetupButton } from "./setup-button"

export function SetupChecklist() {
  return (
    <SetupChecklistProvider>
      <SetupChecklistModal />
      <SetupButton />
    </SetupChecklistProvider>
  )
}
