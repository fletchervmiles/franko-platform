export interface FeedbackItem {
    date: string
    feedback: string
    persona: string
  }
  
  export interface ConfidenceLevel {
    level: string
    description: string
    color: string
  }
  
  export interface SegmentOption {
    id: string
    label: string
    type: "persona" | "pmfBucket"
  }
  
  export interface Quote {
    text: string
    speaker: string
    date: string
  }
  
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
  
  export async function fetchFeedbackData(): Promise<FeedbackItem[]> {
    // Mock data for demonstration purposes with more responses per day
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate more dense mock data
        const mockData: FeedbackItem[] = []
  
        // Generate data for the last 6 months
        const today = new Date()
        const startDate = new Date(today)
        startDate.setMonth(today.getMonth() - 6)
  
        // Personas and feedback options
        const personas = ["Solo Developer", "Startup CTO", "Enterprise Engineer", "Coding Student", "Product Manager"]
        const feedbackOptions = ["Very Disappointed", "Somewhat Disappointed", "Not Disappointed"]
  
        // Generate 5-10 responses per day for the last 6 months
        for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
          // Generate between 5-10 responses for this day
          const responsesForDay = Math.floor(Math.random() * 6) + 5
  
          for (let i = 0; i < responsesForDay; i++) {
            // Randomly select persona and feedback
            const persona = personas[Math.floor(Math.random() * personas.length)]
  
            // Weight the feedback to ensure we have enough "Very Disappointed" responses
            // for a meaningful PMF score (around 40%)
            let feedback
            const rand = Math.random()
            if (rand < 0.4) {
              feedback = "Very Disappointed"
            } else if (rand < 0.7) {
              feedback = "Somewhat Disappointed"
            } else {
              feedback = "Not Disappointed"
            }
  
            // Format date as MM/DD/YYYY
            const month = d.getMonth() + 1
            const day = d.getDate()
            const year = d.getFullYear()
            const dateStr = `${month}/${day}/${year}`
  
            mockData.push({
              date: dateStr,
              feedback,
              persona,
            })
          }
        }
  
        resolve(mockData)
      }, 500)
    })
  }
  
  export function calculatePMFScore(data: FeedbackItem[], selectedSegments: string[], timePeriod: string): number {
    const filteredData = filterData(data, selectedSegments, timePeriod)
    const totalResponses = filteredData.length
    if (totalResponses === 0) return 0
  
    const veryDisappointedCount = filteredData.filter(
      (item) => item.feedback.toLowerCase() === "very disappointed",
    ).length
    return Math.round((veryDisappointedCount / totalResponses) * 100)
  }
  
  export function filterData(data: FeedbackItem[], selectedSegments: string[], timePeriod: string): FeedbackItem[] {
    // Handle PMF bucket segments (very-disappointed, somewhat-disappointed, not-disappointed)
    const pmfBucketSegments = selectedSegments.filter((segment) =>
      ["very-disappointed", "somewhat-disappointed", "not-disappointed"].includes(segment),
    )
  
    // Handle persona segments
    const personaSegments = selectedSegments.filter(
      (segment) => !["very-disappointed", "somewhat-disappointed", "not-disappointed", "all"].includes(segment),
    )
  
    const useAllData =
      selectedSegments.includes("all") || (personaSegments.length === 0 && pmfBucketSegments.length === 0)
  
    let filteredData: FeedbackItem[] = []
  
    if (useAllData) {
      filteredData = [...data]
    } else {
      // Filter by persona segments if any
      if (personaSegments.length > 0) {
        filteredData = data.filter((item) => personaSegments.includes(item.persona.toLowerCase().replace(/\s+/g, "-")))
      } else {
        filteredData = [...data]
      }
  
      // Further filter by PMF bucket segments if any
      if (pmfBucketSegments.length > 0) {
        filteredData = filteredData.filter((item) => {
          const feedback = item.feedback.toLowerCase().replace(/\s+/g, "-")
          return pmfBucketSegments.includes(feedback)
        })
      }
    }
  
    // Time period filtering (simplified for the mock data)
    const today = new Date()
    let startDate: Date
  
    if (timePeriod === "Monthly") {
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
    } else if (timePeriod === "Quarterly") {
      startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate())
    } else if (timePeriod === "6 Months") {
      startDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate())
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()) // Default to monthly
    }
  
    filteredData = filteredData.filter((item) => {
      const [month, day, year] = item.date.split("/").map(Number)
      const itemDate = new Date(year, month - 1, day)
      return itemDate >= startDate
    })
  
    return filteredData
  }
  
  export function getSegmentCounts(data: FeedbackItem[], timePeriod: string): Record<string, number> {
    const filteredData = filterData(data, ["all"], timePeriod)
  
    const segmentCounts: Record<string, number> = {
      "solo-developer": 0,
      "startup-cto": 0,
      "enterprise-engineer": 0,
      "coding-student": 0,
      "product-manager": 0,
      "very-disappointed": 0,
      "somewhat-disappointed": 0,
      "not-disappointed": 0,
    }
  
    filteredData.forEach((item) => {
      const personaKey = item.persona.toLowerCase().replace(/\s+/g, "-") as keyof typeof segmentCounts
      if (segmentCounts.hasOwnProperty(personaKey)) {
        segmentCounts[personaKey]++
      }
  
      const feedbackKey = item.feedback.toLowerCase().replace(/\s+/g, "-") as keyof typeof segmentCounts
      if (segmentCounts.hasOwnProperty(feedbackKey)) {
        segmentCounts[feedbackKey]++
      }
    })
  
    return segmentCounts
  }
  
  export function getFilteredDataCount(data: FeedbackItem[], selectedSegments: string[], timePeriod: string): number {
    const filteredData = filterData(data, selectedSegments, timePeriod)
    return filteredData.length
  }
  
  export function getConfidenceLevel(sampleSize: number): ConfidenceLevel {
    if (sampleSize < 20) {
      return {
        level: "Very Low",
        description: "Directional only",
        color: "bg-gray-100 text-gray-800",
      }
    } else if (sampleSize < 50) {
      return {
        level: "Low",
        description: "Limited insights",
        color: "bg-yellow-100 text-yellow-800",
      }
    } else if (sampleSize < 100) {
      return {
        level: "Moderate",
        description: "Reasonable insights",
        color: "bg-blue-100 text-blue-800",
      }
    } else {
      return {
        level: "High",
        description: "Good insights",
        color: "bg-green-100 text-green-800",
      }
    }
  }
  
  export function calculateResponseDistribution(
    data: FeedbackItem[],
    selectedSegments: string[],
    timePeriod: string,
  ): { label: string; count: number; color: string }[] {
    const filteredData = filterData(data, selectedSegments, timePeriod)
  
    const veryDisappointedCount = filteredData.filter(
      (item) => item.feedback.toLowerCase() === "very disappointed",
    ).length
    const somewhatDisappointedCount = filteredData.filter(
      (item) => item.feedback.toLowerCase() === "somewhat disappointed",
    ).length
    const notDisappointedCount = filteredData.filter((item) => item.feedback.toLowerCase() === "not disappointed").length
  
    return [
      { label: "Very disappointed", count: veryDisappointedCount, color: "#10b981" }, // Emerald-500 - Primary green
      { label: "Somewhat disappointed", count: somewhatDisappointedCount, color: "#34d399" }, // Emerald-400 - Medium green
      { label: "Not disappointed", count: notDisappointedCount, color: "#6b7280" }, // Gray-500 - Original gray
    ]
  }
  
  // Calculate PMF score trend over time using a rolling average approach
  export function calculatePMFTrend(
    data: FeedbackItem[],
    selectedSegments: string[],
    timePeriod: string,
  ): { date: string; score: number | null; responses: number }[] {
    // Filter data by segments first
    const useAllData = selectedSegments.includes("all") || selectedSegments.length === 0
    const segmentFilteredData = useAllData
      ? data
      : data.filter((item) => selectedSegments.includes(item.persona.toLowerCase().replace(/\s+/g, "-")))
  
    if (segmentFilteredData.length === 0) return []
  
    // Parse all dates and create an array of items with parsed dates
    const parsedItems = segmentFilteredData.map((item) => {
      const [month, day, year] = item.date.split("/").map(Number)
      return {
        ...item,
        parsedDate: new Date(year, month - 1, day),
      }
    })
  
    // Sort by date (ascending)
    parsedItems.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())
  
    // Get today's date for filtering
    const today = new Date()
  
    // Filter data based on the selected time period
    let filteredItems: typeof parsedItems = []
    let startDate: Date
  
    if (timePeriod === "Monthly") {
      startDate = new Date(today)
      startDate.setMonth(today.getMonth() - 1)
      filteredItems = parsedItems.filter((item) => item.parsedDate >= startDate && item.parsedDate <= today)
    } else if (timePeriod === "Quarterly") {
      startDate = new Date(today)
      startDate.setMonth(today.getMonth() - 3)
      filteredItems = parsedItems.filter((item) => item.parsedDate >= startDate && item.parsedDate <= today)
    } else if (timePeriod === "6 Months") {
      startDate = new Date(today)
      startDate.setMonth(today.getMonth() - 6)
      filteredItems = parsedItems.filter((item) => item.parsedDate >= startDate && item.parsedDate <= today)
    } else {
      // Default to Monthly
      startDate = new Date(today)
      startDate.setMonth(today.getMonth() - 1)
      filteredItems = parsedItems.filter((item) => item.parsedDate >= startDate && item.parsedDate <= today)
    }
  
    if (filteredItems.length === 0) return []
  
    // Determine the number of data points and interval based on time period
    let numDataPoints: number
    let intervalDays: number
  
    if (timePeriod === "Monthly") {
      numDataPoints = 4 // Weekly data points for a month
      intervalDays = 7
    } else if (timePeriod === "Quarterly") {
      numDataPoints = 6 // Bi-weekly data points for a quarter
      intervalDays = 14
    } else if (timePeriod === "6 Months") {
      numDataPoints = 6 // Monthly data points for 6 months
      intervalDays = 30
    } else {
      // Default to Monthly
      numDataPoints = 4
      intervalDays = 7
    }
  
    // Calculate the rolling window size (how many days to look back for each point)
    const rollingWindowDays = Math.min(
      14,
      Math.floor((today.getTime() - startDate.getTime()) / (numDataPoints * 86400000)),
    )
  
    // Create evenly spaced data points within the selected time period
    const dataPointDates: Date[] = []
    const totalDays = Math.ceil((today.getTime() - startDate.getTime()) / 86400000)
    const dayInterval = Math.max(1, Math.floor(totalDays / numDataPoints))
  
    for (let i = 0; i < numDataPoints; i++) {
      const pointDate = new Date(today)
      pointDate.setDate(today.getDate() - dayInterval * i)
      dataPointDates.unshift(pointDate) // Add to beginning to maintain chronological order
    }
  
    // Calculate rolling average PMF score for each data point
    const trend = dataPointDates.map((date) => {
      // Calculate the start of the rolling window
      const windowStart = new Date(date)
      windowStart.setDate(windowStart.getDate() - rollingWindowDays)
  
      // Get data within the rolling window
      const windowData = filteredItems.filter((item) => item.parsedDate >= windowStart && item.parsedDate <= date)
  
      // Count total responses in the window
      const responses = windowData.length
  
      // Skip data points with fewer than 15 responses
      if (responses < 15) {
        return {
          date: formatDateForDisplay(date, timePeriod),
          score: null, // Set score to null for insufficient data
          responses,
        }
      }
  
      // Count "very disappointed" responses in the window
      const veryDisappointedCount = windowData.filter(
        (item) => item.feedback.toLowerCase() === "very disappointed",
      ).length
  
      // Calculate PMF score for this window
      const score = Math.round((veryDisappointedCount / responses) * 100)
  
      return {
        date: formatDateForDisplay(date, timePeriod),
        score,
        responses,
      }
    })
  
    return trend
  }
  
  // Helper function to format dates for display
  function formatDateForDisplay(date: Date, timePeriod: string): string {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  
    if (timePeriod === "Monthly") {
      return `${monthNames[date.getMonth()]} ${date.getDate()}`
    } else if (timePeriod === "Quarterly") {
      return `${monthNames[date.getMonth()]} ${date.getDate()}`
    } else if (timePeriod === "6 Months") {
      return `${monthNames[date.getMonth()]}`
    } else {
      return `${monthNames[date.getMonth()]} ${date.getDate()}`
    }
  }
  
  // Mock data for segment insights
  export function fetchSegmentInsights(segmentId: string, timePeriod: string): Promise<SegmentInsights> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate mock segment insights based on segmentId
        let insights: SegmentInsights
  
        if (segmentId === "very-disappointed") {
          insights = {
            overview: {
              personaName: "Very Disappointed Users",
              summary: "Users who would be very disappointed if they could no longer use the product.",
              pmfScore: 100, // By definition, 100% of this segment is "very disappointed"
              confidence: "high",
              numResponses: 120,
              lastUpdated: new Date().toISOString(),
            },
            benefit: {
              summaryMarkdown:
                "These users find significant value in the product's core features, particularly code completion and AI assistance.",
              alignment: "strong",
              quotes: [
                {
                  text: "I can't imagine coding without this tool anymore. It's become an essential part of my workflow.",
                  speaker: "Enterprise Engineer",
                  date: "2023-04-15T14:30:00Z",
                },
                {
                  text: "The AI suggestions are spot on and save me hours every day.",
                  speaker: "Solo Developer",
                  date: "2023-04-10T09:15:00Z",
                },
              ],
              roadmap: {
                pros: "Strong adoption and retention among power users",
                cons: "High expectations for new features and improvements",
                reco: "Focus on stability and performance to maintain trust",
              },
            },
            improvement: {
              summaryMarkdown:
                "Despite their strong attachment, these users want improvements in performance, especially for large codebases.",
              quotes: [
                {
                  text: "Sometimes it slows down with really large projects. If that was fixed, it would be perfect.",
                  speaker: "Startup CTO",
                  date: "2023-04-05T16:45:00Z",
                },
                {
                  text: "Better integration with my existing tools would make my workflow even smoother.",
                  speaker: "Product Manager",
                  date: "2023-03-28T11:20:00Z",
                },
              ],
              roadmap: {
                pros: "Clear direction for high-impact improvements",
                cons: "Technical challenges in addressing performance issues",
                reco: "Prioritize performance optimization for large projects",
              },
            },
            differences: [
              "Much higher usage frequency than other segments",
              "More likely to use advanced features",
              "Higher tolerance for occasional bugs",
              "More engaged with product updates",
            ],
            strategy:
              "Focus on maintaining the core experience while gradually addressing performance issues. These users are your champions and will advocate for the product if you keep them happy.",
            charts: {
              benefitDist: [
                { label: "Code completion", value: 85 },
                { label: "AI assistance", value: 75 },
                { label: "Integration", value: 60 },
                { label: "Speed", value: 45 },
              ],
              gapDist: [
                { label: "Performance", value: 65 },
                { label: "Large projects", value: 55 },
                { label: "Offline mode", value: 40 },
                { label: "Documentation", value: 25 },
              ],
              trend: [
                { date: "Jan", segmentScore: 95, globalScore: 40 },
                { date: "Feb", segmentScore: 97, globalScore: 42 },
                { date: "Mar", segmentScore: 96, globalScore: 45 },
                { date: "Apr", segmentScore: 98, globalScore: 47 },
                { date: "May", segmentScore: 100, globalScore: 48 },
                { date: "Jun", segmentScore: 100, globalScore: 50 },
              ],
            },
          }
        } else if (segmentId === "somewhat-disappointed") {
          insights = {
            overview: {
              personaName: "Somewhat Disappointed Users",
              summary: "Users who would be somewhat disappointed if they could no longer use the product.",
              pmfScore: 35,
              confidence: "medium",
              numResponses: 85,
              lastUpdated: new Date().toISOString(),
            },
            benefit: {
              summaryMarkdown:
                "These users appreciate the product but don't consider it essential. They value the convenience but have viable alternatives.",
              alignment: "mild",
              quotes: [
                {
                  text: "It's a good tool that makes some tasks easier, but I could go back to my old workflow if needed.",
                  speaker: "Coding Student",
                  date: "2023-04-12T10:30:00Z",
                },
                {
                  text: "I like the interface and ease of use, but there are other tools that do similar things.",
                  speaker: "Product Manager",
                  date: "2023-04-08T14:15:00Z",
                },
              ],
              roadmap: {
                pros: "Potential to convert to strong advocates with targeted improvements",
                cons: "Risk of churn if competitors improve their offerings",
                reco: "Identify and address specific pain points to increase stickiness",
              },
            },
            improvement: {
              summaryMarkdown:
                "This segment finds the learning curve steep and wants better documentation and tutorials.",
              quotes: [
                {
                  text: "It took me a while to figure out how to use all the features effectively.",
                  speaker: "Solo Developer",
                  date: "2023-04-02T09:45:00Z",
                },
                {
                  text: "Better documentation would help me get more value from the product.",
                  speaker: "Enterprise Engineer",
                  date: "2023-03-25T16:20:00Z",
                },
              ],
              roadmap: {
                pros: "Relatively easy improvements to implement",
                cons: "Requires dedicated resources for documentation and tutorials",
                reco: "Create better onboarding and learning resources",
              },
            },
            differences: [
              "Less frequent usage than 'very disappointed' segment",
              "More price-sensitive",
              "More likely to use basic features only",
              "More likely to switch between multiple tools",
            ],
            strategy:
              "Focus on improving onboarding and documentation to help these users get more value from the product. Consider targeted feature improvements based on their specific use cases.",
            charts: {
              benefitDist: [
                { label: "Ease of use", value: 70 },
                { label: "Interface", value: 65 },
                { label: "Basic features", value: 60 },
                { label: "Support", value: 40 },
              ],
              gapDist: [
                { label: "Documentation", value: 75 },
                { label: "Learning curve", value: 65 },
                { label: "Advanced features", value: 50 },
                { label: "Pricing", value: 45 },
              ],
              trend: [
                { date: "Jan", segmentScore: 30, globalScore: 40 },
                { date: "Feb", segmentScore: 32, globalScore: 42 },
                { date: "Mar", segmentScore: 33, globalScore: 45 },
                { date: "Apr", segmentScore: 34, globalScore: 47 },
                { date: "May", segmentScore: 35, globalScore: 48 },
                { date: "Jun", segmentScore: 35, globalScore: 50 },
              ],
            },
          }
        } else if (segmentId === "not-disappointed") {
          insights = {
            overview: {
              personaName: "Not Disappointed Users",
              summary: "Users who would not be disappointed if they could no longer use the product.",
              pmfScore: 10,
              confidence: "medium",
              numResponses: 95,
              lastUpdated: new Date().toISOString(),
            },
            benefit: {
              summaryMarkdown:
                "These users see the product as interchangeable with alternatives. They use it occasionally but don't rely on it.",
              alignment: "weak",
              quotes: [
                {
                  text: "It's fine for what it does, but I have other tools that work just as well for me.",
                  speaker: "Enterprise Engineer",
                  date: "2023-04-14T11:30:00Z",
                },
                {
                  text: "I only use it occasionally for specific tasks. It's not part of my daily workflow.",
                  speaker: "Solo Developer",
                  date: "2023-04-07T15:45:00Z",
                },
              ],
            },
            improvement: {
              summaryMarkdown:
                "This segment finds the product doesn't address their specific needs or use cases well enough.",
              quotes: [
                {
                  text: "It doesn't have the specific features I need for my type of work.",
                  speaker: "Startup CTO",
                  date: "2023-04-03T10:15:00Z",
                },
                {
                  text: "The product seems designed for a different type of user than me.",
                  speaker: "Product Manager",
                  date: "2023-03-27T14:50:00Z",
                },
              ],
            },
            differences: [
              "Much lower usage frequency",
              "Less engagement with product updates",
              "More likely to be using the free tier",
              "Often using the product for different purposes than intended",
            ],
            strategy:
              "Consider whether these users are part of your target market. If not, their feedback may be less relevant. If they are, identify specific features or improvements that would make the product more valuable to them.",
            charts: {
              benefitDist: [
                { label: "Occasional use", value: 50 },
                { label: "Free tier", value: 45 },
                { label: "Specific features", value: 30 },
                { label: "Trying out", value: 25 },
              ],
              gapDist: [
                { label: "Relevance", value: 80 },
                { label: "Specific needs", value: 70 },
                { label: "Value for money", value: 60 },
                { label: "Use case fit", value: 55 },
              ],
              trend: [
                { date: "Jan", segmentScore: 8, globalScore: 40 },
                { date: "Feb", segmentScore: 9, globalScore: 42 },
                { date: "Mar", segmentScore: 9, globalScore: 45 },
                { date: "Apr", segmentScore: 10, globalScore: 47 },
                { date: "May", segmentScore: 10, globalScore: 48 },
                { date: "Jun", segmentScore: 10, globalScore: 50 },
              ],
            },
          }
        } else if (segmentId === "solo-developer") {
          insights = {
            overview: {
              personaName: "Solo Developer",
              summary: "Independent developers working on their own projects or freelancing.",
              pmfScore: 55,
              confidence: "high",
              numResponses: 110,
              lastUpdated: new Date().toISOString(),
            },
            benefit: {
              summaryMarkdown:
                "Solo developers value the productivity boost and cost-effectiveness of the product, which helps them compete with larger teams.",
              alignment: "strong",
              quotes: [
                {
                  text: "This tool makes me feel like I have an extra team member. I can deliver projects faster and take on more work.",
                  speaker: "Solo Developer",
                  date: "2023-04-15T10:30:00Z",
                },
                {
                  text: "The AI features help me write better code without needing to consult others.",
                  speaker: "Solo Developer",
                  date: "2023-04-09T14:15:00Z",
                },
              ],
              roadmap: {
                pros: "Strong adoption and high PMF score in this segment",
                cons: "Price sensitivity may limit revenue potential",
                reco: "Maintain affordable pricing tiers while adding high-value features",
              },
            },
            improvement: {
              summaryMarkdown:
                "This segment wants better integration with a wider range of tools and platforms they use in their diverse workflows.",
              quotes: [
                {
                  text: "I use a lot of different tools depending on the client project. Better integration would save me time.",
                  speaker: "Solo Developer",
                  date: "2023-04-04T09:45:00Z",
                },
                {
                  text: "I'd like more templates and starting points for common project types.",
                  speaker: "Solo Developer",
                  date: "2023-03-28T16:20:00Z",
                },
              ],
              roadmap: {
                pros: "Clear direction for improvements with high impact",
                cons: "Wide range of integration needs across the segment",
                reco: "Prioritize integrations with the most popular tools first",
              },
            },
            differences: [
              "Higher price sensitivity than enterprise users",
              "More diverse use cases and workflows",
              "Higher value placed on productivity features",
              "More likely to use the product across multiple projects",
            ],
            strategy:
              "Focus on maintaining the productivity advantage while expanding integrations. Consider creating templates and starting points for common project types to further enhance productivity.",
            charts: {
              benefitDist: [
                { label: "Productivity", value: 90 },
                { label: "Cost-effectiveness", value: 85 },
                { label: "AI assistance", value: 75 },
                { label: "Code quality", value: 65 },
              ],
              gapDist: [
                { label: "Integrations", value: 70 },
                { label: "Templates", value: 65 },
                { label: "Customization", value: 55 },
                { label: "Learning resources", value: 45 },
              ],
              trend: [
                { date: "Jan", segmentScore: 50, globalScore: 40 },
                { date: "Feb", segmentScore: 52, globalScore: 42 },
                { date: "Mar", segmentScore: 53, globalScore: 45 },
                { date: "Apr", segmentScore: 54, globalScore: 47 },
                { date: "May", segmentScore: 55, globalScore: 48 },
                { date: "Jun", segmentScore: 55, globalScore: 50 },
              ],
            },
          }
        } else {
          // Default insights for other segments
          insights = {
            overview: {
              personaName: segmentId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
              summary: "Users in this segment have specific needs and use cases.",
              pmfScore: 45,
              confidence: "medium",
              numResponses: 75,
              lastUpdated: new Date().toISOString(),
            },
            benefit: {
              summaryMarkdown:
                "This segment values the core features and finds the product useful for their specific workflows.",
              alignment: "mild",
              quotes: [
                {
                  text: "The product helps me accomplish my tasks more efficiently.",
                  speaker: segmentId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                  date: "2023-04-13T11:30:00Z",
                },
                {
                  text: "It integrates well with my existing workflow.",
                  speaker: segmentId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                  date: "2023-04-06T15:45:00Z",
                },
              ],
              roadmap: {
                pros: "Moderate adoption with potential for growth",
                cons: "Diverse needs within the segment",
                reco: "Identify common patterns and prioritize features accordingly",
              },
            },
            improvement: {
              summaryMarkdown:
                "This segment would like to see improvements in specific areas relevant to their use cases.",
              quotes: [
                {
                  text: "I wish it had better support for my specific use case.",
                  speaker: segmentId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                  date: "2023-04-02T10:15:00Z",
                },
                {
                  text: "Some features could be more intuitive for my workflow.",
                  speaker: segmentId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                  date: "2023-03-26T14:50:00Z",
                },
              ],
              roadmap: {
                pros: "Clear opportunities for targeted improvements",
                cons: "Need to balance with needs of other segments",
                reco: "Focus on improvements with cross-segment benefits",
              },
            },
            differences: [
              "Specific usage patterns unique to this segment",
              "Different priorities compared to other segments",
              "Moderate engagement with product updates",
              "Balanced mix of basic and advanced feature usage",
            ],
            strategy:
              "Understand the specific needs of this segment better through targeted research. Identify opportunities to address their needs without compromising the experience for other segments.",
            charts: {
              benefitDist: [
                { label: "Feature A", value: 70 },
                { label: "Feature B", value: 65 },
                { label: "Feature C", value: 55 },
                { label: "Feature D", value: 45 },
              ],
              gapDist: [
                { label: "Gap A", value: 60 },
                { label: "Gap B", value: 55 },
                { label: "Gap C", value: 45 },
                { label: "Gap D", value: 35 },
              ],
              trend: [
                { date: "Jan", segmentScore: 40, globalScore: 40 },
                { date: "Feb", segmentScore: 42, globalScore: 42 },
                { date: "Mar", segmentScore: 43, globalScore: 45 },
                { date: "Apr", segmentScore: 44, globalScore: 47 },
                { date: "May", segmentScore: 45, globalScore: 48 },
                { date: "Jun", segmentScore: 45, globalScore: 50 },
              ],
            },
          }
        }
  
        resolve(insights)
      }, 800)
    })
  }
  
  // Get all available segments
  export function getAvailableSegments(): SegmentOption[] {
    return [
      { id: "all", label: "All Segments", type: "persona" },
      { id: "solo-developer", label: "Solo Developer", type: "persona" },
      { id: "startup-cto", label: "Startup CTO", type: "persona" },
      { id: "enterprise-engineer", label: "Enterprise Engineer", type: "persona" },
      { id: "coding-student", label: "Coding Student", type: "persona" },
      { id: "product-manager", label: "Product Manager", type: "persona" },
      { id: "very-disappointed", label: "Very Disappointed", type: "pmfBucket" },
      { id: "somewhat-disappointed", label: "Somewhat Disappointed", type: "pmfBucket" },
      { id: "not-disappointed", label: "Not Disappointed", type: "pmfBucket" },
    ]
  }
  