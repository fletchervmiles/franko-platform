"use client"
import { useState, useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray } from "react-hook-form"
import { conversationPlanSchema, conversationPlanUISchema, type ConversationPlan } from "./conversationPlanSchema"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Check, Loader2, BookOpen, Target, List, MessageCircle, HelpCircle, MessageSquare, ChevronDown, ChevronRight, Circle, Plus, X, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type SectionStatus = "view" | "edit" | "saving" | "saved"

interface ConversationPlanFormProps {
  chatId: string;
  onSubmit?: (data: ConversationPlan) => Promise<void>;
  initialData?: ConversationPlan | null;
  startInEditMode?: boolean;
}

// Custom component for bullet point editing
interface BulletPointEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

function BulletPointEditor({ items, onChange, placeholder = "Add a new item..." }: BulletPointEditorProps) {
  const [newItem, setNewItem] = useState("");

  const handleAddItem = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()]);
      setNewItem("");
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  }

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
  }

  const handleUpdateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange(newItems);
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="text-blue-500 flex-shrink-0">•</span>
            <Input
              value={item}
              onChange={(e) => handleUpdateItem(index, e.target.value)}
              className="flex-grow bg-[#FAFAFA]"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-red-500"
              onClick={() => handleRemoveItem(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          className="flex-grow bg-[#FAFAFA]"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-shrink-0"
          onClick={handleAddItem}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}

export default function ConversationPlanForm({ chatId, onSubmit, initialData, startInEditMode = false }: ConversationPlanFormProps) {
  const [overviewStatus, setOverviewStatus] = useState<SectionStatus>(startInEditMode ? "edit" : "view")
  const [objectiveStatuses, setObjectiveStatuses] = useState<SectionStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: startInEditMode,
    objectives: startInEditMode
  })
  const router = useRouter()
  const [objectiveToDelete, setObjectiveToDelete] = useState<number | null>(null)

  const form = useForm<ConversationPlan>({
    resolver: zodResolver(conversationPlanSchema),
    defaultValues: {
      title: "",
      duration: "",
      summary: "",
      objectives: [],
    }
  })

  const { control, handleSubmit, watch } = form

  const {
    fields: objectiveFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "objectives",
  })

  useEffect(() => {
    async function loadConversationPlan() {
      try {
        const response = await fetch(`/api/conversation-plan?chatId=${chatId}`);
        if (!response.ok) throw new Error('Failed to load plan');
        const plan = await response.json();
        if (plan) {
          form.reset(plan)
          // Set all objective statuses based on startInEditMode
          setObjectiveStatuses(new Array(plan.objectives.length).fill(startInEditMode ? "edit" : "view"))
        }
      } catch (error) {
        console.error("Error loading conversation plan:", error)
        toast.error("Failed to load conversation plan")
      } finally {
        setIsLoading(false)
      }
    }
    loadConversationPlan()
  }, [chatId, form, startInEditMode])

  const onSubmitHandler: SubmitHandler<ConversationPlan> = async (data) => {
    console.log("Form data", data)
    // TODO: send data to backend (store JSONB in DB, etc.)
    if (onSubmit) {
      await onSubmit(data)
    }
  }

  const handleSaveOverview = async () => {
    setOverviewStatus("saving")
    try {
      const values = form.getValues()
      const response = await fetch(`/api/conversation-plan?chatId=${chatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) throw new Error('Failed to save plan');
      
      setOverviewStatus("saved")
      toast.success("Overview saved successfully")
    } catch (error) {
      console.error("Error saving overview:", error)
      toast.error("Failed to save overview")
      setOverviewStatus("edit")
      return
    }
    setTimeout(() => setOverviewStatus("view"), 2000)
  }

  const handleSaveObjective = async (index: number) => {
    setObjectiveStatuses((prev) => {
      const newStatuses = [...prev]
      newStatuses[index] = "saving"
      return newStatuses
    })

    try {
      const values = form.getValues()
      const response = await fetch(`/api/conversation-plan?chatId=${chatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) throw new Error('Failed to save objective');

      setObjectiveStatuses((prev) => {
        const newStatuses = [...prev]
        newStatuses[index] = "saved"
        return newStatuses
      })
      toast.success("Objective saved successfully")
    } catch (error) {
      console.error("Error saving objective:", error)
      toast.error("Failed to save objective")
      setObjectiveStatuses((prev) => {
        const newStatuses = [...prev]
        newStatuses[index] = "edit"
        return newStatuses
      })
      return
    }

    setTimeout(() => {
      setObjectiveStatuses((prev) => {
        const newStatuses = [...prev]
        newStatuses[index] = "view"
        return newStatuses
      })
    }, 2000)
  }

  const handleOpenChat = () => {
    router.push(`/chat/${chatId}`)
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // Handle objective deletion with confirmation and persist changes to database
  const handleDeleteObjective = async (index: number) => {
    // Remove the objective from the form state
    remove(index)
    setObjectiveToDelete(null)
    
    try {
      // Get current form values after removing the objective
      const values = form.getValues()
      
      // Save the updated form values to the database
      const response = await fetch(`/api/conversation-plan?chatId=${chatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) throw new Error('Failed to save plan after deleting objective');
      
      toast.success("Objective removed successfully")
    } catch (error) {
      console.error("Error saving after objective deletion:", error)
      toast.error("Failed to save changes after removing objective")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600">
                  <Circle className="w-2.5 h-2.5 fill-current" />
                </div>
                <span className="text-sm font-medium text-gray-600">Overview</span>
              </div>
              <div className="flex gap-2">
                {overviewStatus === "view" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOverviewStatus("edit")}
                    className="h-8 px-4"
                  >
                    Edit
                  </Button>
                )}
                {overviewStatus === "edit" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveOverview}
                    className="h-8 px-4 transition-all duration-300 ease-in-out"
                  >
                    Save
                  </Button>
                )}
                {overviewStatus === "saving" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="h-8 px-3 transition-all duration-300 ease-in-out"
                  >
                    <Loader2 className="w-3 h-3 mr-0.5 animate-spin" />
                    Saving...
                  </Button>
                )}
                {overviewStatus === "saved" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 transition-all duration-300 ease-in-out text-green-700"
                  >
                    <Check className="w-3 h-3 mr-0.5" />
                    Saved
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex-1">
              <FormField
                control={control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <FormLabel className="text-sm font-medium text-gray-700">Title</FormLabel>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="Enter a short, jargon-free title"
                        className="bg-[#FAFAFA] disabled:bg-[#FAFAFA] disabled:text-black"
                        {...field}
                        disabled={overviewStatus !== "edit"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex-1">
              <FormField
                control={control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      <FormLabel className="text-sm font-medium text-gray-700">Duration</FormLabel>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="e.g. '≈2 minutes' or '3'"
                        className="bg-[#FAFAFA] disabled:bg-[#FAFAFA] disabled:text-black"
                        {...field}
                        disabled={true} // Always disabled
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex-1">
              <FormField
                control={control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-gray-400" />
                      <FormLabel className="text-sm font-medium text-gray-700">Summary</FormLabel>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="One-sentence purpose statement"
                        className="bg-[#FAFAFA] disabled:bg-[#FAFAFA] disabled:text-black"
                        {...field}
                        disabled={overviewStatus !== "edit"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {objectiveFields.map((fieldObj, index) => (
            <Card key={fieldObj.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600">
                      <Circle className="w-2.5 h-2.5 fill-current" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">Step {index + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {objectiveStatuses[index] === "view" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setObjectiveStatuses((prev) => {
                            const newStatuses = [...prev]
                            newStatuses[index] = "edit"
                            return newStatuses
                          })
                        }
                        className="h-8 text-xs px-4 transition-all duration-300 ease-in-out"
                      >
                        Edit
                      </Button>
                    )}
                    {objectiveStatuses[index] === "edit" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSaveObjective(index)}
                          className="h-8 text-xs px-4 transition-all duration-300 ease-in-out"
                        >
                          Save
                        </Button>
                        <AlertDialog open={objectiveToDelete === index} onOpenChange={(open) => !open && setObjectiveToDelete(null)}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setObjectiveToDelete(index)}
                              className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300 ease-in-out"
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remove objective</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this objective. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteObjective(index)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    {objectiveStatuses[index] === "saving" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="h-8 text-xs px-3 transition-all duration-300 ease-in-out"
                      >
                        <Loader2 className="w-3 h-3 mr-0.5 animate-spin" />
                        Saving...
                      </Button>
                    )}
                    {objectiveStatuses[index] === "saved" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs px-3 transition-all duration-300 ease-in-out text-green-700"
                      >
                        <Check className="w-3 h-3 mr-0.5" />
                        Saved
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex-1">
                  <FormField
                    control={control}
                    name={`objectives.${index}.objective`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-gray-400" />
                          <FormLabel className="text-sm font-medium text-gray-700">Objective</FormLabel>
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder="E.g. Identify main driver of churn"
                            className="bg-[#FAFAFA] disabled:bg-[#FAFAFA] disabled:text-black min-h-[60px] resize-y"
                            {...field}
                            disabled={objectiveStatuses[index] !== "edit"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex-1">
                  <FormField
                    control={control}
                    name={`objectives.${index}.desiredOutcome`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          <FormLabel className="text-sm font-medium text-gray-700">Desired Outcome</FormLabel>
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder="The result or importance of this objective"
                            className="bg-[#FAFAFA] disabled:bg-[#FAFAFA] disabled:text-black min-h-[60px] resize-y"
                            {...field}
                            disabled={objectiveStatuses[index] !== "edit"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Collapsible section for Agent Guidance */}
                <div className="flex-1">
                  <div 
                    className="flex items-center gap-2 cursor-pointer" 
                    onClick={() => toggleSection(`guidance-${index}`)}
                  >
                    {expandedSections[`guidance-${index}`] !== false ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center" className="bg-black text-white border-black max-w-xs">
                          <p>Agent guidance provides specific instructions for the AI to follow during this step of the conversation. These instructions help the AI understand how to approach the objective and what techniques to use to achieve the desired outcome.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <FormLabel className="text-sm font-medium text-gray-700 cursor-pointer">
                      Agent Guidance
                    </FormLabel>
                  </div>

                  {(expandedSections[`guidance-${index}`] !== false) && (
                  <FormField
                    control={control}
                    name={`objectives.${index}.agentGuidance`}
                    render={({ field }) => (
                        <FormItem className="mt-2 ml-6">
                        <FormControl>
                          {objectiveStatuses[index] === "edit" ? (
                              <BulletPointEditor 
                                items={field.value || []}
                                onChange={field.onChange}
                                placeholder="Add guidance item..."
                            />
                          ) : (
                            <ul className="space-y-2 mt-1">
                              {field.value?.map((guidance, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                  <span className="text-blue-500">•</span>
                                  <span>{guidance}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  )}
                </div>

                {/* Hidden field for expectedConversationTurns */}
                <div className="hidden">
                  <FormField
                    control={control}
                    name={`objectives.${index}.expectedConversationTurns`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="e.g. 2 or '≈3'"
                            {...field}
                            disabled={objectiveStatuses[index] !== "edit"}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </form>
    </Form>
  )
}

