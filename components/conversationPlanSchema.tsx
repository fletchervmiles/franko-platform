import { z } from "zod"

export const conversationPlanSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  duration: z.string().min(1, { message: "Duration is required" }),
  summary: z.string().min(1, { message: "Summary is required" }),
  objectives: z
    .array(
      z.object({
        objective: z.string().min(1, { message: "Objective is required" }),
        keyLearningOutcome: z.string().min(1, { message: "Key Learning Outcome is required" }),
        focusPoints: z.array(z.string()).optional(),
        guidanceForAgent: z.array(z.string()).min(1, { message: "At least one guidance item is required" }),
        illustrativePrompts: z.array(z.string()).min(1, { message: "At least one illustrative prompt is required" }),
        expectedConversationTurns: z.string().min(1, { message: "Expected Conversation Turns is required" }),
      }),
    )
    .min(1, { message: "At least one objective is required" }),
})

export type ConversationPlan = z.infer<typeof conversationPlanSchema>

