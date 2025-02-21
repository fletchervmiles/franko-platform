"use client"
import { useState, useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray } from "react-hook-form"
import { conversationPlanSchema, type ConversationPlan } from "./conversationPlanSchema"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Check, Loader2, BookOpen, Target, List, MessageCircle } from "lucide-react"

type SectionStatus = "view" | "edit" | "saving" | "saved"

interface ConversationPlanFormProps {
  chatId: string;
  onSubmit?: (data: ConversationPlan) => Promise<void>;
  initialData?: ConversationPlan | null;
}

export default function ConversationPlanForm({ chatId, onSubmit, initialData }: ConversationPlanFormProps) {
  const [overviewStatus, setOverviewStatus] = useState<SectionStatus>("view")
  const [objectiveStatuses, setObjectiveStatuses] = useState<SectionStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

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
          setObjectiveStatuses(new Array(plan.objectives.length).fill("view"))
        }
      } catch (error) {
        console.error("Error loading conversation plan:", error)
        toast.error("Failed to load conversation plan")
      } finally {
        setIsLoading(false)
      }
    }
    loadConversationPlan()
  }, [chatId, form])

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
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-sm text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                  Details
                </span>
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
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-sm font-medium text-gray-500">Overview</span>
              </div>
              <FormField
                control={control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter a short, jargon-free title"
                        className="bg-[#FAFAFA] disabled:bg-[#FAFAFA] disabled:text-gray-900"
                        {...field}
                        disabled={overviewStatus !== "edit"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Duration</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. '≈2 minutes' or '3'"
                        className="bg-[#FAFAFA] disabled:bg-[#FAFAFA] disabled:text-gray-900"
                        {...field}
                        disabled={overviewStatus !== "edit"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="One-sentence purpose statement"
                        className="bg-[#FAFAFA] disabled:bg-[#FAFAFA] disabled:text-gray-900"
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
                    <span className="text-sm text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                      Step {index + 1}
                    </span>
                  </div>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveObjective(index)}
                      className="h-8 text-xs px-4 transition-all duration-300 ease-in-out"
                    >
                      Save
                    </Button>
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
                          <Target className="w-4 h-4 text-blue-500" />
                          <FormLabel className="text-base font-medium">Objective</FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            placeholder="E.g. Identify main driver of churn"
                            className="bg-[#FAFAFA] disabled:bg-[#FAFAFA] disabled:text-gray-900"
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
                    name={`objectives.${index}.keyLearningOutcome`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-blue-500" />
                          <FormLabel className="text-sm font-medium text-gray-700">Key Learning Outcome</FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            placeholder="The most important insight from this objective"
                            className="bg-[#FAFAFA] disabled:bg-[#FAFAFA] disabled:text-gray-900"
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
                    name={`objectives.${index}.focusPoints`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <List className="w-4 h-4 text-blue-500" />
                          <FormLabel className="text-sm font-medium text-gray-700">Focus Points</FormLabel>
                        </div>
                        <FormControl>
                          {objectiveStatuses[index] === "edit" ? (
                            <Textarea
                              placeholder="List your focus points, separated by commas..."
                              className="bg-[#FAFAFA] disabled:bg-[#FAFAFA] disabled:text-gray-900"
                              value={field.value?.join(", ")}
                              onChange={(e) => field.onChange(e.target.value.split(",").map((s) => s.trim()))}
                            />
                          ) : (
                            <ul className="space-y-2 mt-1">
                              {field.value?.map((point, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                  <span className="text-blue-500">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex-1">
                  <FormField
                    control={control}
                    name={`objectives.${index}.expectedConversationTurns`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-blue-500" />
                          <FormLabel className="text-sm font-medium text-gray-700">Expected Conversation Turns</FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            placeholder="e.g. 2 or '≈3'"
                            className="bg-[#FAFAFA] w-24 disabled:bg-[#FAFAFA] disabled:text-gray-900"
                            {...field}
                            disabled={objectiveStatuses[index] !== "edit"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {objectiveStatuses[index] === "edit" && (
                  <Button
                    variant="outline"
                    onClick={() => remove(index)}
                    className="mt-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 h-8 text-xs px-3 transition-all duration-300 ease-in-out"
                    type="button"
                  >
                    Remove Objective
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          <Button
            variant="outline"
            onClick={() => {
              append({
                objective: "",
                keyLearningOutcome: "",
                focusPoints: [""],
                expectedConversationTurns: "",
              })
              setObjectiveStatuses((prev) => [...prev, "edit"])
            }}
            type="button"
            className="mt-2 h-8 text-xs px-3 transition-all duration-300 ease-in-out"
          >
            + Add Objective
          </Button>
        </div>
      </form>
    </Form>
  )
}

