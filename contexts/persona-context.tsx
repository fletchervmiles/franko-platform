"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"
import { toast } from "@/components/ui/use-toast"
import { useUser } from "@clerk/nextjs"

// Define persona type (ensure this matches the structure returned by your GET API)
export interface Persona {
  id: string
  label: string
  description: string
  interviewCount: number
  veryDisappointedPercentage: number
  confidenceLevel: string | null
  isActive: boolean
  isCustomized: boolean
}

interface PersonaContextType {
  personas: Persona[]
  isLoadingPersonas: boolean
  refetchPersonas: () => Promise<void>
  addPersona: (persona: { label: string; description: string }) => Promise<void>
  updatePersona: (id: string, updates: Partial<Pick<Persona, 'label' | 'description'>>) => Promise<void>
  archivePersona: (id: string) => Promise<void>
  mergePersonas: (sourceId: string, targetId: string) => Promise<void>
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined)

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(true)
  const { user, isLoaded } = useUser()

  // Fetch personas data function
  const fetchPersonas = useCallback(async () => {
    if (!isLoaded || !user?.id) return; // Wait for auth
    console.log("Fetching personas...") // Debug log
    try {
      setIsLoadingPersonas(true)
      const response = await fetch('/api/user-personas') // Call GET endpoint
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch personas: ${response.statusText}`)
      }
      const data: Persona[] = await response.json()
      console.log("Fetched personas data:", data) // Debug log
      setPersonas(data)
    } catch (error) {
      console.error("Failed to fetch personas:", error)
      toast({
        title: "Error Loading Personas",
        description: error instanceof Error ? error.message : "Could not load persona data.",
        variant: "destructive",
      })
      setPersonas([]) // Clear personas on error
    } finally {
      setIsLoadingPersonas(false)
    }
  }, [isLoaded, user?.id])

  // Fetch data on component mount
  useEffect(() => {
    if (isLoaded && user?.id) {
      fetchPersonas()
    }
  }, [fetchPersonas, isLoaded, user?.id]) // Include dependencies

  // Add a new persona
  const addPersona = async (personaData: { label: string; description: string }) => {
    try {
      const response = await fetch('/api/user-personas', { // Call POST endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personaData),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to add persona: ${response.statusText}`)
      }
      // const newPersona = await response.json() // Optional: use returned data
      await fetchPersonas() // Refetch the list to include the new one + calculated fields
      toast({ title: "Persona Added", description: `Persona "${personaData.label}" created.` })
    } catch (error) {
      console.error("Failed to add persona:", error)
      toast({
        title: "Error Adding Persona",
        description: error instanceof Error ? error.message : "Could not add persona.",
        variant: "destructive",
      })
      throw error // Re-throw to indicate failure upstream if needed
    }
  }

  // Update an existing persona
  const updatePersona = async (id: string, updates: Partial<Pick<Persona, 'label' | 'description'>>) => {
    try {
      const response = await fetch(`/api/user-personas/${id}`, { // Call PATCH endpoint
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to update persona: ${response.statusText}`)
      }
      // const updatedPersona = await response.json() // Optional: use returned data
      await fetchPersonas() // Refetch list to reflect changes
      toast({ title: "Persona Updated", description: `Persona details saved.` })
    } catch (error) {
      console.error("Failed to update persona:", error)
      toast({
        title: "Error Updating Persona",
        description: error instanceof Error ? error.message : "Could not update persona.",
        variant: "destructive",
      })
      throw error // Re-throw
    }
  }

  // Archive a persona
  const archivePersona = async (id: string) => {
    try {
      const response = await fetch(`/api/user-personas/${id}`, { // Call DELETE endpoint
        method: 'DELETE',
      })
      if (!response.ok && response.status !== 204) { // Allow 204 No Content
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to archive persona: ${response.statusText}`)
      }
      await fetchPersonas() // Refetch list
      toast({ title: "Persona Archived", description: `Persona has been archived.` })
    } catch (error) {
      console.error("Failed to archive persona:", error)
      toast({
        title: "Error Archiving Persona",
        description: error instanceof Error ? error.message : "Could not archive persona.",
        variant: "destructive",
      })
      throw error // Re-throw
    }
  }

  // Merge personas
  const mergePersonas = async (sourceId: string, targetId: string) => {
    try {
      const response = await fetch(`/api/user-personas/merge`, { // Call POST merge endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, targetId }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to merge personas: ${response.statusText}`)
      }
      await fetchPersonas() // Refetch list
      toast({ title: "Personas Merged", description: `Personas merged successfully.` })
    } catch (error) {
      console.error("Failed to merge personas:", error)
      toast({
        title: "Error Merging Personas",
        description: error instanceof Error ? error.message : "Could not merge personas.",
        variant: "destructive",
      })
      throw error // Re-throw
    }
  }

  const value = {
    personas,
    isLoadingPersonas,
    refetchPersonas: fetchPersonas, // Expose refetch function
    addPersona,
    updatePersona,
    archivePersona,
    mergePersonas,
  }

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>
}

// --- Hooks ---
export function usePersonas() {
  const context = useContext(PersonaContext)
  if (context === undefined) {
    throw new Error("usePersonas must be used within a PersonaProvider")
  }
  return context
}

// Legacy hook name for compatibility
export function useFeedback() {
  // Consider adding a console.warn here to encourage using usePersonas
  // console.warn("useFeedback for personas is deprecated. Please use usePersonas instead.");
  return usePersonas()
} 