/**
 * Completion Calculator Utility
 * 
 * Calculates the completion percentage of a conversation based on the objectives status.
 * Objective status values are weighted as follows:
 * - "complete" = 100%
 * - "current" = 50%
 * - "tbc" = 0%
 * 
 * Returns the completion percentage as a string (e.g., "75%")
 */

interface ObjectiveStatus {
  status: 'complete' | 'current' | 'tbc' | 'done';
  turns_used: number;
  expected_max: number;
  expected_min: number;
}

interface ChatProgress {
  objectives: Record<string, ObjectiveStatus>;
  overall_turns: number;
  expected_total_max: number;
  expected_total_min: number;
}

/**
 * Calculates the completion percentage based on objectives status
 * 
 * @param chatProgress - Chat progress JSON object or string
 * @returns Completion percentage as a string (e.g., "75%")
 */
export function calculateCompletionStatus(chatProgress: ChatProgress | string | null): string {
  try {
    // If chatProgress is a string, parse it
    const progress: ChatProgress = typeof chatProgress === 'string' 
      ? JSON.parse(chatProgress) 
      : chatProgress;
    
    // If chatProgress is null, invalid, or doesn't have objectives
    if (!progress || !progress.objectives || typeof progress.objectives !== 'object') {
      return "n/a";
    }
    
    // Count the total number of objectives
    const objectiveEntries = Object.entries(progress.objectives);
    const totalObjectives = objectiveEntries.length;
    
    if (totalObjectives === 0) {
      return "n/a";
    }
    
    // Calculate the completion value for each objective
    let totalCompletionValue = 0;
    
    for (const [_, objective] of objectiveEntries) {
      if (objective.status === 'complete' || objective.status === 'done') {
        totalCompletionValue += 100; // 100% complete
      } else if (objective.status === 'current') {
        totalCompletionValue += 50; // 50% complete
      }
      // 'tbc' objectives are 0% complete, so we don't add anything
    }
    
    // Calculate the average percentage
    const averageCompletion = Math.round(totalCompletionValue / totalObjectives);
    
    // Return the formatted percentage
    return `${averageCompletion}%`;
  } catch (error) {
    console.error('Error calculating completion status:', error);
    return "n/a";
  }
}