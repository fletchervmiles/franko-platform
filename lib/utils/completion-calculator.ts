/**
 * Completion Calculator Utility
 * 
 * Calculates the completion percentage of a conversation based on the objectives status.
 * Objective status values are weighted as follows:
 * - "done" = 100%
 * - "current" = 50%
 * - "tbc" = 0%
 * 
 * Returns the completion percentage as a string (e.g., "75%")
 */

// Updated to match the format from our AI responses
interface ObjectiveStatus {
  status: 'done' | 'current' | 'tbc';
  count?: number;
  target?: number;
  guidance?: string;
}

interface ChatProgress {
  objectives: Record<string, ObjectiveStatus>;
}

/**
 * Calculates the completion percentage based on objectives status
 * 
 * @param objectives - Chat progress data in various formats
 * @returns Completion percentage as a string (e.g., "75%")
 */
export function calculateCompletionStatus(
  objectives: ChatProgress | Record<string, ObjectiveStatus> | string | null
): string {
  try {
    // Handle different input formats
    let objectivesRecord: Record<string, ObjectiveStatus> | null = null;
    
    // If it's a string, try to parse it
    if (typeof objectives === 'string') {
      const parsed = JSON.parse(objectives);
      // Check if it's a ChatProgress object or direct objectives record
      objectivesRecord = parsed.objectives || parsed;
    } 
    // If it's a ChatProgress object with objectives property
    else if (objectives && typeof objectives === 'object' && 'objectives' in objectives) {
      objectivesRecord = (objectives as ChatProgress).objectives;
    } 
    // If it's already a Record<string, ObjectiveStatus>
    else if (objectives && typeof objectives === 'object') {
      objectivesRecord = objectives as Record<string, ObjectiveStatus>;
    }
    
    // If we couldn't extract objectives or they're empty
    if (!objectivesRecord || Object.keys(objectivesRecord).length === 0) {
      return "0%";
    }
    
    // Calculate the completion value for each objective
    let totalCompletionValue = 0;
    const objectiveEntries = Object.entries(objectivesRecord);
    
    for (const [_, objective] of objectiveEntries) {
      if (objective.status === 'done') {
        totalCompletionValue += 100; // 100% complete
      } else if (objective.status === 'current') {
        totalCompletionValue += 50; // 50% complete
      }
      // 'tbc' objectives are 0% complete, so we don't add anything
    }
    
    // Calculate the average percentage
    const averageCompletion = Math.round(totalCompletionValue / objectiveEntries.length);
    
    // Return the formatted percentage
    return `${averageCompletion}%`;
  } catch (error) {
    console.error('Error calculating completion status:', error);
    return "0%";
  }
}