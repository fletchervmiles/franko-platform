"use client"

import { Button } from "@/components/ui/button"
import { useSetupChecklist } from "../../contexts/setup-checklist-context";

export function SetupButton() {
  const { isVisible, isCollapsed, setIsCollapsed, isCompleted } = useSetupChecklist()

  if (!isVisible || !isCollapsed || isCompleted) return null

  return (
    <Button
      onClick={() => setIsCollapsed(false)}
      className="fixed bottom-6 right-6 z-50 rounded-full shadow-md bg-blue-600 hover:bg-blue-700 text-white"
      size="sm"
    >
      Onboarding
    </Button>
  )
}
