 "use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  type FeedbackItem,
  fetchFeedbackData,
  calculatePMFScore,
  getSegmentCounts,
  getFilteredDataCount,
  type ConfidenceLevel,
  getConfidenceLevel,
  calculateResponseDistribution,
  calculatePMFTrend,
} from "@/lib/placeholder-data"

// Define segment option type
export interface SegmentOption {
  id: string
  label: string
  type: "persona" | "pmfBucket"
}

// Define quote type
export interface Quote {
  text: string
  speaker: string
  date: string
}

// Define segment insights type
export interface SegmentInsights {
  overview: {
    personaName: string
    summary: string
    pmfScore: number
    confidence: "low" | "medium" | "high"
    numResponses: number
    lastUpdated: string
  }
  benefit: {
    summaryMarkdown: string
    alignment: "strong" | "mild" | "weak"
    quotes: Quote[]
    roadmap?: { pros: string; cons: string; reco: string }
  }
  improvement: {
    summaryMarkdown: string
    quotes: Quote[]
    roadmap?: { pros: string; cons: string; reco: string }
  }
  differences: string[]
  strategy: string
  charts: {
    benefitDist: { label: string; value: number }[]
    gapDist: { label: string; value: number }[]
    trend: { date: string; segmentScore: number; globalScore: number }[]
  }
}

// Define persona type
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

interface FeedbackContextType {
  feedbackData: FeedbackItem[]
  isLoading: boolean
  error: string | null
  selectedSegments: string[]
  setSelectedSegments: React.Dispatch<React.SetStateAction<string[]>>
  selectedTimePeriod: string
  setSelectedTimePeriod: (period: string) => void
  pmfScore: number
  segmentCounts: Record<string, number>
  sampleSize: number
  confidenceLevel: ConfidenceLevel
  responseDistribution: { label: string; count: number; color: string }[]
  trendData: { date: string; score: number | null; responses: number }[]
  // Properties for personas page
  availableSegments: SegmentOption[]
  selectedSegmentId: string
  setSelectedSegmentId: (segmentId: string) => void
  segmentInsights: SegmentInsights | null
  isLoadingInsights: boolean
  // Properties for persona management
  personas: Persona[]
  isLoadingPersonas: boolean
  addPersona: (persona: { label: string; description: string }) => void
  updatePersona: (id: string, updates: Partial<Persona>) => void
  archivePersona: (id: string) => void
  mergePersonas: (sourceId: string, targetId: string) => void
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined)

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedbackData, setFeedbackData] = useState<FeedbackItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSegments, setSelectedSegments] = useState<string[]>(["all"])
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("Monthly")
  const [pmfScore, setPmfScore] = useState(0)
  const [segmentCounts, setSegmentCounts] = useState<Record<string, number>>({})
  const [sampleSize, setSampleSize] = useState(0)
  const [confidenceLevel, setConfidenceLevel] = useState<ConfidenceLevel>({
    level: "Very Low",
    description: "Directional only",
    color: "bg-gray-100 text-gray-800",
  })
  const [responseDistribution, setResponseDistribution] = useState<{ label: string; count: number; color: string }[]>(
    [],
  )
  const [trendData, setTrendData] = useState<{ date: string; score: number | null; responses: number }[]>([])

  // State for personas page
  const [availableSegments, setAvailableSegments] = useState<SegmentOption[]>([
    { id: "all", label: "All Segments", type: "persona" },
    { id: "solo-developer", label: "Solo Developer", type: "persona" },
    { id: "startup-cto", label: "Startup CTO", type: "persona" },
    { id: "enterprise-engineer", label: "Enterprise Engineer", type: "persona" },
    { id: "coding-student", label: "Coding Student", type: "persona" },
    { id: "product-manager", label: "Product Manager", type: "persona" },
    { id: "very-disappointed", label: "Very Disappointed", type: "pmfBucket" },
    { id: "somewhat-disappointed", label: "Somewhat Disappointed", type: "pmfBucket" },
    { id: "not-disappointed", label: "Not Disappointed", type: "pmfBucket" },
  ])
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("solo-developer")
  const [segmentInsights, setSegmentInsights] = useState<SegmentInsights | null>(null)
  const [isLoadingInsights, setIsLoadingInsights] = useState(true)

  // State for persona management
  const [personas, setPersonas] = useState<Persona[]>([])
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(true)

  // Fetch data on component mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        const data = await fetchFeedbackData()
        setFeedbackData(data)

        // Calculate initial segment counts
        const counts = getSegmentCounts(data, selectedTimePeriod)
        setSegmentCounts(counts)

        // Calculate initial sample size
        const initialSampleSize = getFilteredDataCount(data, ["all"], selectedTimePeriod)
        setSampleSize(initialSampleSize)

        // Calculate initial confidence level
        const initialConfidenceLevel = getConfidenceLevel(initialSampleSize)
        setConfidenceLevel(initialConfidenceLevel)

        // Calculate initial PMF score with all data
        const initialScore = calculatePMFScore(data, ["all"], selectedTimePeriod)
        setPmfScore(initialScore)

        // Load mock personas
        loadMockPersonas()
      } catch (err) {
        setError("Failed to load feedback data")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Load mock personas
  const loadMockPersonas = () => {
    setIsLoadingPersonas(true)

    // Simulate API delay
    setTimeout(() => {
      const mockPersonas: Persona[] = [
        {
          id: "p1",
          label: "Solo Developer",
          description: "Independent developers working on their own projects or freelancing.",
          interviewCount: 110,
          veryDisappointedPercentage: 55,
          confidenceLevel: "High",
          isActive: true,
          isCustomized: false,
        },
        {
          id: "p2",
          label: "Startup CTO",
          description: "Technical leaders at early-stage companies.",
          interviewCount: 85,
          veryDisappointedPercentage: 48,
          confidenceLevel: "Medium",
          isActive: true,
          isCustomized: false,
        },
        {
          id: "p3",
          label: "Enterprise Engineer",
          description: "Developers working in large corporate environments.",
          interviewCount: 95,
          veryDisappointedPercentage: 32,
          confidenceLevel: "High",
          isActive: true,
          isCustomized: false,
        },
        {
          id: "p4",
          label: "Coding Student",
          description: "Students learning to code or in computer science programs.",
          interviewCount: 65,
          veryDisappointedPercentage: 28,
          confidenceLevel: "Medium",
          isActive: true,
          isCustomized: false,
        },
        {
          id: "p5",
          label: "Product Manager",
          description: "Product managers who code or work closely with engineering teams.",
          interviewCount: 70,
          veryDisappointedPercentage: 35,
          confidenceLevel: "Medium",
          isActive: true,
          isCustomized: false,
        },
        {
          id: "p6",
          label: "Archived Persona",
          description: "This is an archived persona for testing.",
          interviewCount: 25,
          veryDisappointedPercentage: 20,
          confidenceLevel: "Low",
          isActive: false,
          isCustomized: true,
        },
      ]

      setPersonas(mockPersonas)
      setIsLoadingPersonas(false)
    }, 800)
  }

  // Recalculate PMF score when segments or time period change
  useEffect(() => {
    if (feedbackData.length > 0) {
      const score = calculatePMFScore(feedbackData, selectedSegments, selectedTimePeriod)
      setPmfScore(score)

      // Update segment counts when time period changes
      const counts = getSegmentCounts(feedbackData, selectedTimePeriod)
      setSegmentCounts(counts)

      // Update sample size
      const newSampleSize = getFilteredDataCount(feedbackData, selectedSegments, selectedTimePeriod)
      setSampleSize(newSampleSize)

      // Update confidence level
      const newConfidenceLevel = getConfidenceLevel(newSampleSize)
      setConfidenceLevel(newConfidenceLevel)

      // Calculate response distribution
      const distribution = calculateResponseDistribution(feedbackData, selectedSegments, selectedTimePeriod)
      setResponseDistribution(distribution)

      // Calculate trend data
      const trend = calculatePMFTrend(feedbackData, selectedSegments, selectedTimePeriod)
      setTrendData(trend)
    }
  }, [feedbackData, selectedSegments, selectedTimePeriod])

  // Load persona insights when segment or time period changes
  useEffect(() => {
    async function loadSegmentInsights() {
      if (!selectedSegmentId) return

      setIsLoadingInsights(true)

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Mock segment insights data based on selected segment
      const selectedSegment = availableSegments.find((s) => s.id === selectedSegmentId)

      if (!selectedSegment) {
        setSegmentInsights(null)
        setIsLoadingInsights(false)
        return
      }

      // Generate mock data based on segment type and ID
      const mockInsights: SegmentInsights = {
        overview: {
          personaName: selectedSegment.label,
          summary: `${selectedSegment.label} ${selectedSegment.type === "persona" ? "users are primarily focused on productivity and code quality." : "responses indicate strong alignment with the product vision."}`,
          pmfScore:
            selectedSegment.type === "pmfBucket" && selectedSegment.id === "very-disappointed"
              ? 85
              : selectedSegment.type === "pmfBucket" && selectedSegment.id === "somewhat-disappointed"
                ? 35
                : selectedSegment.type === "pmfBucket" && selectedSegment.id === "not-disappointed"
                  ? 15
                  : 42,
          confidence: "high",
          numResponses: 124,
          lastUpdated: new Date().toISOString(),
        },
        benefit: {
          summaryMarkdown: `<p>Users in this segment particularly value the <strong>code completion accuracy</strong> and <strong>contextual understanding</strong> across files. They report significant time savings and improved code quality.</p>
          <p>The GitHub integration is also frequently mentioned as a key benefit that streamlines their workflow.</p>`,
          alignment: "strong",
          quotes: [
            {
              text: "The code completion is incredibly accurate and saves me hours every day.",
              speaker: selectedSegment.type === "persona" ? selectedSegment.label : "User",
              date: "2023-05-15T00:00:00Z",
            },
            {
              text: "I love how it understands context across multiple files. This has been a game changer.",
              speaker: selectedSegment.type === "persona" ? selectedSegment.label : "User",
              date: "2023-05-18T00:00:00Z",
            },
            {
              text: "The GitHub integration is seamless and makes my workflow much smoother.",
              speaker: selectedSegment.type === "persona" ? selectedSegment.label : "User",
              date: "2023-06-05T00:00:00Z",
            },
            {
              text: "The refactoring suggestions have improved my code quality significantly.",
              speaker: selectedSegment.type === "persona" ? selectedSegment.label : "User",
              date: "2023-06-10T00:00:00Z",
            },
          ],
          roadmap: {
            pros: "Strong alignment with core value proposition. High retention potential.",
            cons: "May require specialized features that don't benefit broader user base.",
            reco: "Prioritize improvements to code completion accuracy and GitHub integration.",
          },
        },
        improvement: {
          summaryMarkdown: `<p>The main pain points for this segment are <strong>performance issues</strong> with large codebases and occasional <strong>misunderstandings of complex code</strong>.</p>
          <p>Users also mention wanting better documentation for advanced features and improved integration with testing frameworks.</p>`,
          quotes: [
            {
              text: "It's good but sometimes misunderstands my intent with complex code.",
              speaker: selectedSegment.type === "persona" ? selectedSegment.label : "User",
              date: "2023-06-02T00:00:00Z",
            },
            {
              text: "Performance can be slow with very large codebases.",
              speaker: selectedSegment.type === "persona" ? selectedSegment.label : "User",
              date: "2023-06-12T00:00:00Z",
            },
            {
              text: "I wish there was better documentation for some of the advanced features.",
              speaker: selectedSegment.type === "persona" ? selectedSegment.label : "User",
              date: "2023-06-20T00:00:00Z",
            },
          ],
          roadmap: {
            pros: "Addressing these issues would significantly increase PMF with this segment.",
            cons: "Performance optimizations may require substantial engineering resources.",
            reco: "Focus on improving performance with large codebases and enhancing documentation.",
          },
        },
        differences: [
          `${selectedSegment.label} users are 2.5x more likely to value code completion accuracy than other segments.`,
          `They spend 30% more time in the editor than average users.`,
          `This segment has a 40% higher retention rate than the overall user base.`,
          `They are 20% more likely to use GitHub integration features.`,
        ],
        strategy: `<p>To strengthen market share with ${selectedSegment.label} users:</p>
        <ul>
          <li>Prioritize performance improvements for large codebases</li>
          <li>Enhance documentation for advanced features</li>
          <li>Develop specialized GitHub workflow integrations</li>
          <li>Create targeted educational content about advanced code completion features</li>
        </ul>`,
        charts: {
          benefitDist: [
            { label: "Code Completion", value: 78 },
            { label: "GitHub Integration", value: 65 },
            { label: "Refactoring", value: 52 },
            { label: "Multi-file Context", value: 48 },
            { label: "Speed", value: 35 },
          ],
          gapDist: [
            { label: "Large Codebase Performance", value: 42 },
            { label: "Complex Code Understanding", value: 38 },
            { label: "Documentation", value: 25 },
            { label: "Testing Integration", value: 18 },
            { label: "Offline Support", value: 12 },
          ],
          trend: [
            { date: "Jan", segmentScore: 35, globalScore: 30 },
            { date: "Feb", segmentScore: 38, globalScore: 32 },
            { date: "Mar", segmentScore: 40, globalScore: 35 },
            { date: "Apr", segmentScore: 43, globalScore: 36 },
            { date: "May", segmentScore: 45, globalScore: 38 },
            { date: "Jun", segmentScore: 48, globalScore: 40 },
          ],
        },
      }

      setSegmentInsights(mockInsights)
      setIsLoadingInsights(false)
    }

    loadSegmentInsights()
  }, [selectedSegmentId, selectedTimePeriod, availableSegments])

  // Add a new persona
  const addPersona = (personaData: { label: string; description: string }) => {
    const newPersona: Persona = {
      id: `p${personas.length + 1}`,
      label: personaData.label,
      description: personaData.description,
      interviewCount: 0,
      veryDisappointedPercentage: 0,
      confidenceLevel: null,
      isActive: true,
      isCustomized: true,
    }

    setPersonas((prev) => [...prev, newPersona])
  }

  // Update an existing persona
  const updatePersona = (id: string, updates: Partial<Persona>) => {
    setPersonas((prev) =>
      prev.map((persona) => (persona.id === id ? { ...persona, ...updates, isCustomized: true } : persona)),
    )
  }

  // Archive a persona
  const archivePersona = (id: string) => {
    setPersonas((prev) => prev.map((persona) => (persona.id === id ? { ...persona, isActive: false } : persona)))
  }

  // Merge personas
  const mergePersonas = (sourceId: string, targetId: string) => {
    const sourcePersona = personas.find((p) => p.id === sourceId)
    const targetPersona = personas.find((p) => p.id === targetId)

    if (!sourcePersona || !targetPersona) return

    // Update target persona with merged interview count
    const updatedTargetPersona = {
      ...targetPersona,
      interviewCount: targetPersona.interviewCount + sourcePersona.interviewCount,
      // Recalculate VD percentage (simplified)
      veryDisappointedPercentage: Math.round(
        (targetPersona.veryDisappointedPercentage * targetPersona.interviewCount +
          sourcePersona.veryDisappointedPercentage * sourcePersona.interviewCount) /
          (targetPersona.interviewCount + sourcePersona.interviewCount),
      ),
      isCustomized: true,
    }

    // Archive source persona and update target
    setPersonas((prev) =>
      prev.map((persona) => {
        if (persona.id === sourceId) {
          return { ...persona, isActive: false, interviewCount: 0 }
        }
        if (persona.id === targetId) {
          return updatedTargetPersona
        }
        return persona
      }),
    )
  }

  const value = {
    feedbackData,
    isLoading,
    error,
    selectedSegments,
    setSelectedSegments,
    selectedTimePeriod,
    setSelectedTimePeriod,
    pmfScore,
    segmentCounts,
    sampleSize,
    confidenceLevel,
    responseDistribution,
    trendData,
    // Properties for personas page
    availableSegments,
    selectedSegmentId,
    setSelectedSegmentId,
    segmentInsights,
    isLoadingInsights,
    // Properties for persona management
    personas,
    isLoadingPersonas,
    addPersona,
    updatePersona,
    archivePersona,
    mergePersonas,
  }

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>
}

export function useFeedback() {
  const context = useContext(FeedbackContext)
  if (context === undefined) {
    throw new Error("useFeedback must be used within a FeedbackProvider")
  }
  return context
}
