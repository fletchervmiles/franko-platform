"use client"

import { useState, useEffect } from "react"
import { PersonaHeader } from "./persona-header"
import { PersonaIntroBanner } from "./persona-intro-banner"
import { PersonaTable } from "./persona-table"
import { PersonaEmptyState } from "./persona-empty-state"
import { useFeedback } from "@/contexts/persona-context"
import { AddPersonaModal } from "./add-persona-modal"
import { MergePersonaModal } from "./merge-persona-modal"
import { HelpDrawer } from "./help-drawer"

export function PersonaManager() {
  const { personas, isLoadingPersonas } = useFeedback()
  const [showIntroBanner, setShowIntroBanner] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [showHelpDrawer, setShowHelpDrawer] = useState(false)
  const [personaToMerge, setPersonaToMerge] = useState<string | null>(null)

  // Dismiss intro banner and save preference
  const dismissIntroBanner = () => {
    setShowIntroBanner(false)
    localStorage.setItem("personaIntroBannerDismissed", "true")
  }

  // Check if banner was previously dismissed
  useEffect(() => {
    const bannerDismissed = localStorage.getItem("personaIntroBannerDismissed") === "true"
    setShowIntroBanner(!bannerDismissed)
  }, [])

  // Handle opening merge modal with selected persona
  const handleMergeClick = (personaId: string) => {
    setPersonaToMerge(personaId)
    setShowMergeModal(true)
  }

  // Close modals
  const closeAddModal = () => setShowAddModal(false)
  const closeMergeModal = () => {
    setShowMergeModal(false)
    setPersonaToMerge(null)
  }
  const closeHelpDrawer = () => setShowHelpDrawer(false)

  if (isLoadingPersonas) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    )
  }

  const activePersonas = personas.filter((p) => p.isActive)

  return (
    <div className="space-y-6">
      <PersonaHeader onHelpClick={() => setShowHelpDrawer(true)} />

      {showIntroBanner && <PersonaIntroBanner onDismiss={dismissIntroBanner} />}

      {activePersonas.length === 0 ? (
        <PersonaEmptyState onAddClick={() => setShowAddModal(true)} />
      ) : (
        <PersonaTable onAddClick={() => setShowAddModal(true)} onMergeClick={handleMergeClick} />
      )}

      {/* Modals */}
      <AddPersonaModal isOpen={showAddModal} onClose={closeAddModal} canAddMore={activePersonas.length < 5} />

      <MergePersonaModal isOpen={showMergeModal} onClose={closeMergeModal} sourcePersonaId={personaToMerge} />

      <HelpDrawer isOpen={showHelpDrawer} onClose={closeHelpDrawer} />
    </div>
  )
}
