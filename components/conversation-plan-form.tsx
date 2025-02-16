"use client"
import { useState, useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray } from "react-hook-form"
import { conversationPlanSchema, type ConversationPlan } from "./conversationPlanSchema"

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Check, Loader2 } from "lucide-react"

type SectionStatus = "view" | "edit" | "saving" | "saved"

export default function ConversationPlanForm() {
  const [overviewStatus, setOverviewStatus] = useState<SectionStatus>("view")
  const [objectiveStatuses, setObjectiveStatuses] = useState<SectionStatus[]>([])

  const form = useForm<ConversationPlan>({
    resolver: zodResolver(conversationPlanSchema),
    defaultValues: {
      title: "Understanding Churn: All Paying Cursor Users",
      duration: "≈5",
      summary:
        "A focused conversation to uncover why paying Cursor users churn, exploring their experiences with key features, perceived value, and identifying areas for improvement.",
      objectives: [
        {
          objective: "Briefly introduce the conversation context and collect essential respondent information.",
          keyLearningOutcome:
            "Set the context for the conversation and gather required identifiers (Name, Email) for record-keeping and potential follow-up.",
          focusPoints: ["Very briefly introduce the conversation topic", "Politely request identifier details."],
          expectedConversationTurns: "1",
        },
        {
          objective: "Identify primary reasons for cancellation among all paying Cursor subscribers",
          keyLearningOutcome:
            "Pinpoint the main drivers of churn specific to Cursor's features, pricing, or overall user experience, across all paid plans.",
          focusPoints: [
            "Main reason(s) for canceling their Cursor subscription (e.g., cost, feature limitations, AI performance).",
            "Specific Cursor features or aspects that influenced their decision (AI code completion, natural language editing, multi-line suggestions).",
            "Whether they switched to another code editor or development tool, and if so, why.",
          ],
          expectedConversationTurns: "3",
        },
        {
          objective: "Explore the perceived value and overall experience with Cursor's core offerings",
          keyLearningOutcome:
            "Reveal whether Cursor's key features (AI-powered code completion, natural language editing, codebase awareness) met user expectations and delivered tangible benefits.",
          focusPoints: [
            "How well Cursor's AI features (code completion, natural language editing, codebase awareness) met their expectations.",
            "Whether they experienced tangible benefits (time saved, code quality improvement, reduced cognitive load).",
            "Overall satisfaction with Cursor's performance and usability.",
          ],
          expectedConversationTurns: "3",
        },
        {
          objective: "Gather suggestions for product or service enhancements",
          keyLearningOutcome:
            "Determine actionable changes Cursor can implement to address churn contributors and improve customer satisfaction across all paid plans.",
          focusPoints: [
            "Specific features or improvements they would like to see in Cursor.",
            "Suggestions for enhancing user onboarding, documentation, or support.",
            "Any additional features or integrations that would have made them stay.",
          ],
          expectedConversationTurns: "3",
        },
      ],
    },
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
    setObjectiveStatuses(new Array(objectiveFields.length).fill("view"))
  }, [objectiveFields.length])

  const onSubmit: SubmitHandler<ConversationPlan> = async (data) => {
    console.log("Form data", data)
    // TODO: send data to backend (store JSONB in DB, etc.)
  }

  const handleSaveOverview = async () => {
    setOverviewStatus("saving")
    // Simulating API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setOverviewStatus("saved")
    setTimeout(() => setOverviewStatus("view"), 2000)
  }

  const handleSaveObjective = async (index: number) => {
    setObjectiveStatuses((prev) => {
      const newStatuses = [...prev]
      newStatuses[index] = "saving"
      return newStatuses
    })
    // Simulating API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setObjectiveStatuses((prev) => {
      const newStatuses = [...prev]
      newStatuses[index] = "saved"
      return newStatuses
    })
    setTimeout(() => {
      setObjectiveStatuses((prev) => {
        const newStatuses = [...prev]
        newStatuses[index] = "view"
        return newStatuses
      })
    }, 2000)
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Overview
              {overviewStatus === "view" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOverviewStatus("edit")}
                  className="h-8 text-xs px-4 transition-all duration-300 ease-in-out"
                >
                  Edit
                </Button>
              )}
              {overviewStatus === "edit" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveOverview}
                  className="h-8 text-xs px-4 transition-all duration-300 ease-in-out"
                >
                  Save
                </Button>
              )}
              {overviewStatus === "saving" && (
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
              {overviewStatus === "saved" && (
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
          </CardContent>
        </Card>

        <div className="space-y-6">
          {objectiveFields.map((fieldObj, index) => (
            <Card key={fieldObj.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  Objective {index + 1}
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
                <FormField
                  control={control}
                  name={`objectives.${index}.objective`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Objective</FormLabel>
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

                <FormField
                  control={control}
                  name={`objectives.${index}.keyLearningOutcome`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Key Learning Outcome</FormLabel>
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

                <FormField
                  control={control}
                  name={`objectives.${index}.focusPoints`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Focus Points</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List your focus points, separated by commas..."
                          className="bg-[#FAFAFA] disabled:bg-[#FAFAFA] disabled:text-gray-900"
                          value={field.value?.join(", ")}
                          onChange={(e) => field.onChange(e.target.value.split(",").map((s) => s.trim()))}
                          disabled={objectiveStatuses[index] !== "edit"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`objectives.${index}.expectedConversationTurns`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Expected Conversation Turns</FormLabel>
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

                {objectiveStatuses[index] === "edit" && (
                  <Button
                    variant="outline"
                    onClick={() => remove(index)}
                    className="mt-2 text-xs text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 h-8 text-xs px-3 transition-all duration-300 ease-in-out"
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

