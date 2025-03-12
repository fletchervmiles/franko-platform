import { z } from "zod"

// Type for a single objective
export type Objective = {
  objective: string;
  desiredOutcome: string;
  agentGuidance: string[];
  expectedConversationTurns: string;
}

// Type for numbered objectives (for database storage)
export type NumberedObjectives = {
  [key: string]: Objective;
}

// Complete schema with all fields (for database storage)
export const conversationPlanSchema = z.object({
  thinking: z.object({
    topicStrategy: z.string().optional(),
    appliedtoOrganisation: z.string().optional(),
    userPersona: z.string().optional(),
    durationThoughts: z.string().optional(),
  }).optional(),
  title: z.string().min(1, { message: "Title is required" }),
  duration: z.string().min(1, { message: "Duration is required" }),
  summary: z.string().min(1, { message: "Summary is required" }),
  objectives: z
    .array(
      z.object({
        objective: z.string().min(1, { message: "Objective is required" }),
        desiredOutcome: z.string().min(1, { message: "Desired Outcome is required" }),
        agentGuidance: z.array(z.string()).min(1, { message: "At least one guidance item is required" }),
        expectedConversationTurns: z.string().min(1, { message: "Expected Conversation Turns is required" }),
      }),
    )
    .min(1, { message: "At least one objective is required" }),
})

// Type for the complete conversation plan (for database storage)
export type ConversationPlan = z.infer<typeof conversationPlanSchema>

// UI-specific schema (only includes fields visible in the UI)
export const conversationPlanUISchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  duration: z.string().min(1, { message: "Duration is required" }),
  summary: z.string().min(1, { message: "Summary is required" }),
  objectives: z
    .array(
      z.object({
        objective: z.string().min(1, { message: "Objective is required" }),
        desiredOutcome: z.string().min(1, { message: "Desired Outcome is required" }),
        agentGuidance: z.array(z.string()).min(1, { message: "At least one guidance item is required" }),
      }),
    )
    .min(1, { message: "At least one objective is required" }),
})

// Type for the UI-visible conversation plan
export type ConversationPlanUI = z.infer<typeof conversationPlanUISchema>

// Helper function to convert array-based objectives to numbered object format
export function arrayToNumberedObjectives(objectives: Objective[]): NumberedObjectives {
  const numberedObj: NumberedObjectives = {};
  
  objectives.forEach((obj, index) => {
    // Create keys like objective01, objective02, etc.
    const paddedIndex = String(index + 1).padStart(2, '0');
    numberedObj[`objective${paddedIndex}`] = obj;
  });
  
  return numberedObj;
}

// Helper function to convert numbered object format back to array
export function numberedObjectivesToArray(numberedObj: NumberedObjectives): Objective[] {
  try {
    // Validate input
    if (!numberedObj || typeof numberedObj !== 'object') {
      console.error('Invalid numbered objectives format:', numberedObj);
      return []; // Return empty array instead of failing
    }
    
    // Sort the keys to ensure correct order (objective01, objective02, etc.)
    const sortedKeys = Object.keys(numberedObj).sort();
    
    if (sortedKeys.length === 0) {
      console.warn('No objectives found in numbered object');
      return []; // Return empty array if no keys
    }
    
    // Map and validate each objective
    return sortedKeys.map(key => {
      const obj = numberedObj[key];
      
      // Ensure each objective has the required properties or provide defaults
      return {
        objective: obj?.objective || "Objective description unavailable",
        desiredOutcome: obj?.desiredOutcome || "Desired outcome unavailable",
        agentGuidance: Array.isArray(obj?.agentGuidance) ? obj.agentGuidance : 
          (obj?.agentGuidance ? [String(obj.agentGuidance)] : ["Guide the conversation naturally"]),
        expectedConversationTurns: obj?.expectedConversationTurns || "1"
      };
    });
  } catch (error) {
    console.error('Error converting numbered objectives to array:', error);
    // Return a minimal valid array to prevent complete failure
    return [{
      objective: "Error processing objectives",
      desiredOutcome: "Contact support for assistance",
      agentGuidance: ["There was an error processing the conversation plan"],
      expectedConversationTurns: "1"
    }];
  }
}

