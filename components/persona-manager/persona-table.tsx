"use client"

import { useState } from "react"
import { Edit, Trash2, GitMerge, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useFeedback } from "@/contexts/persona-context"
import { EditDescriptionPopover } from "./edit-description-popover"
import { EditLabelPopover } from "./edit-label-popover"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

interface PersonaTableProps {
  onAddClick: () => void
  onMergeClick: (personaId: string) => void
}

export function PersonaTable({ onAddClick, onMergeClick }: PersonaTableProps) {
  const { personas, updatePersona, archivePersona } = useFeedback()
  const [personaToDelete, setPersonaToDelete] = useState<string | null>(null)

  const activePersonas = personas.filter((p) => p.isActive)
  const activePersonaLabels = activePersonas.map(p => p.label);

  const handleUpdateLabel = (personaId: string, newLabel: string) => {
    updatePersona(personaId, { label: newLabel })
    toast({
      title: "Persona updated",
      description: "The persona label has been updated successfully.",
    })
  }

  const updateDescription = (personaId: string, description: string) => {
    updatePersona(personaId, { description })
    toast({
      title: "Persona updated",
      description: "The persona description has been updated successfully.",
    })
  }

  const confirmDelete = () => {
    if (personaToDelete) {
      archivePersona(personaToDelete)
      toast({
        title: "Persona deleted",
        description: "The persona has been deleted. Tagged responses are now unclassified.",
      })
      setPersonaToDelete(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-700">Active Personas</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onAddClick} disabled={activePersonas.length >= 5}>
                Add Persona
              </Button>
            </TooltipTrigger>
            {activePersonas.length >= 5 && (
              <TooltipContent>
                <p className="text-xs max-w-xs">
                  You've reached the maximum of 5 active personas. Archive or merge existing personas to add more.
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Tagged Interviews</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activePersonas.map((persona, index) => (
              <TableRow key={persona.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <TableCell>
                  <EditLabelPopover
                    personaId={persona.id}
                    currentLabel={persona.label}
                    onSave={handleUpdateLabel}
                    existingLabels={activePersonaLabels.filter(l => l.toLowerCase() !== persona.label.toLowerCase())}
                  >
                    <button className="hover:text-blue-600 font-medium text-left">
                      {persona.label}
                    </button>
                  </EditLabelPopover>
                </TableCell>
                <TableCell>
                  <EditDescriptionPopover
                    description={persona.description}
                    onSave={(description) => updateDescription(persona.id, description)}
                  >
                    <button className="text-sm text-gray-600 hover:text-blue-600 max-w-md text-left py-1">
                      {persona.description || "Add description..."}
                    </button>
                  </EditDescriptionPopover>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="cursor-pointer">
                    {persona.interviewCount} interviews
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => onMergeClick(persona.id)} aria-label="Merge persona">
                            <GitMerge className="h-4 w-4" />
                            <span className="sr-only">Merge</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Merge with another persona</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setPersonaToDelete(persona.id)} aria-label="Delete persona">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs">
                            Delete this persona. Tagged responses become unclassified.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!personaToDelete} onOpenChange={(open) => !open && setPersonaToDelete(null)}>
        <AlertDialogContent className="bg-white dark:bg-gray-950">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Persona</AlertDialogTitle>
            <AlertDialogDescription>
              Any captured responses currently tagged with this persona will be updated to unclassified. This
              classification can be updated on individual response records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
