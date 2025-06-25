"use client"

import { createContext, useContext, useEffect, useState, type ReactNode, useMemo } from "react"
import { usePathname } from "next/navigation"
import { logger } from "@/lib/logger" // Assuming logger is accessible client-side or use console.error
import type { SelectUserOnboardingStatus } from "@/db/schema" // Import the DB schema type
import { useUser } from "@clerk/nextjs"
import { useProfile } from "@/components/contexts/profile-context"

export type ChecklistStep = {
  key: keyof SetupProgress
  label: string
  instructions: string[]
}

export type SetupProgress = {
  contextAdded: boolean
  brandingAdded: boolean
  personasReviewed: boolean
  agentCreated: boolean
  shareLinkVisited: boolean
}

type SetupChecklistContextType = {
  progress: SetupProgress
  isLoading: boolean
  error: string | null
  isCompleted: boolean
  completedCount: number
  totalSteps: number
  isVisible: boolean
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  steps: ChecklistStep[]
  refetchStatus: () => void
}

const defaultProgress: SetupProgress = {
  contextAdded: false,
  brandingAdded: false,
  personasReviewed: false,
  agentCreated: false,
  shareLinkVisited: false,
}

// Only map the manual onboarding fields to SetupProgress
const dbFieldToProgressKey: Record<string, keyof SetupProgress> = {
    step1ContextComplete: 'contextAdded',
    step2BrandingComplete: 'brandingAdded',
    step3PersonasReviewed: 'personasReviewed',
    step4AgentCreated: 'agentCreated',
    step5LinkShared: 'shareLinkVisited'
};

const checklistSteps: ChecklistStep[] = [
  {
    key: "contextAdded",
    label: "Add Context",
    instructions: [
      "**Why:** Company details are saved and used as context by your Interview Agents.",
      "",
      "**Steps**",
      "1. Navigate to **Context** in the sidebar.",
      "2. Confirm or enter your company name and website URL.",
      "3. Click **Extract Context** (approximately 45 seconds).",
      "4. Review and add details if required.",
    ],
  },
  {
    key: "brandingAdded",
    label: "Add Branding",
    instructions: [
      "**Why:** Branding is used to style UI when you send customers your agent links",
      "",
      "**Steps**",
      "1. Within **Context**, open the **Branding** tab.",
      "2. Upload your logo (SVG or PNG) and choose primary and accent colours.",
    ],
  },
  {
    key: "personasReviewed",
    label: "Review Generated Personas",
    instructions: [
      "**Why:** Personas descriptions are used to segment user interview response data, revealing differing needs and PMF scores.",
      "",
      "**Steps**",
      "1. Within **Context**, open the **Persona** tab.",
      "2. Examine the three to five auto‑generated personas.",
      "3. Edit labels or merge duplicates as needed.",
    ],
  },
  {
    key: "agentCreated",
    label: "Create Interview Agent",
    instructions: [
      "**Why:** Create a unique agent that will conduct customer interviews.",
      "",
      "**Steps**",
      "1. Navigate to **Workspace** in the sidebar.",
      "2. Select **Create Interview Agent**.",
      "3. Select the PMF interview template.",
      "4. Click **Generate**",
    ],
  },
  {
    key: "shareLinkVisited",
    label: "Get Shareable Link",
    instructions: [
      "**Why:** Your agent is set up and ready to be sent to customers.",
      "",
      "**Steps**",
      "1. Navigate to the **Share** tab.",
      "2. Copy the URL.",
      "3. Open in a new window. This is your link ready to be sent to customers.",
    ],
  },
]

const SetupChecklistContext = createContext<SetupChecklistContextType | undefined>(undefined)

export function SetupChecklistProvider({ children }: { children: ReactNode }) {
  const [dbStatus, setDbStatus] = useState<SelectUserOnboardingStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, isLoaded } = useUser();
  const { profile, isLoading: isProfileLoading } = useProfile();

  const fetchStatus = async (retryCount = 0, maxRetries = 2) => {
    if (!isLoaded || !user?.id) return; // Wait for auth
    setIsLoading(true)
    setError(null)
    try {
      console.log(`Fetching onboarding status (attempt ${retryCount + 1}/${maxRetries + 1})`);
      const response = await fetch('/api/onboarding/status');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) // Try to get error message
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data: SelectUserOnboardingStatus = await response.json();
      setDbStatus(data);
      setIsLoading(false);
      console.log('Onboarding status updated:', JSON.stringify(data));
    } catch (err) {
       const message = err instanceof Error ? err.message : "An unknown error occurred";
       logger.error("Failed to fetch onboarding status:", message); // Use logger or console.error
       if (retryCount >= maxRetries) {
         setError(message);
         setDbStatus(null); // Clear potentially stale data on error
       } else {
         console.log(`Retrying onboarding status fetch (${retryCount + 1}/${maxRetries})`);
         setTimeout(() => fetchStatus(retryCount + 1, maxRetries), 1000 * Math.pow(2, retryCount));
         return; // Don't set isLoading to false until final attempt
       }
    } finally {
      if (retryCount >= maxRetries) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isLoaded && user?.id && !isProfileLoading && profile) {
      fetchStatus();
    }
  }, [isLoaded, user?.id, isProfileLoading, profile]);

  const progress = useMemo((): SetupProgress => {
    if (!dbStatus) {
      return defaultProgress;
    }
    return {
      contextAdded: dbStatus.step1ContextComplete,
      brandingAdded: dbStatus.step2BrandingComplete,
      personasReviewed: dbStatus.step3PersonasReviewed,
      agentCreated: dbStatus.step4AgentCreated,
      shareLinkVisited: dbStatus.step5LinkShared,
    };
  }, [dbStatus]);

  const completedCount = useMemo(() => Object.values(progress).filter(Boolean).length, [progress]);
  const isCompleted = useMemo(() => completedCount === checklistSteps.length, [completedCount]);

  const isVisible = !isLoading && !error;

  return (
    <SetupChecklistContext.Provider
      value={{
        progress,
        isLoading,
        error,
        isCompleted,
        completedCount,
        totalSteps: checklistSteps.length,
        isVisible,
        isCollapsed,
        setIsCollapsed,
        steps: checklistSteps,
        refetchStatus: fetchStatus,
      }}
    >
      {children}
      <div id="setup-announcer" className="sr-only" aria-live="polite" aria-atomic="true"></div>
    </SetupChecklistContext.Provider>
  )
}

export function useSetupChecklist() {
  const context = useContext(SetupChecklistContext)
  if (context === undefined) {
    throw new Error("useSetupChecklist must be used within a SetupChecklistProvider")
  }
  return context
}
