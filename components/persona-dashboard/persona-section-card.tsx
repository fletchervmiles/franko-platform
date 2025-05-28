"use client"

import { useState, useEffect, type ReactNode } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { User, InfoIcon, ExternalLink, Search, ThumbsUp, ThumbsDown, LucideIcon } from "lucide-react"
// import { QuoteModal } from "./quote-modal" // Commented out
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export interface PersonaInfo {
  id: string
  text: string // For insight view
  snippet: string // For quote view
  signal: "high" | "medium" | "low"
  interviewId: string
  timestamp: string
}

export interface PersonaCardData {
  // Overall Persona Info (assuming these are general to the persona displayed)
  personaName?: string // Example: "Startup CTO / Founder"
  
  // Section-specific data
  whoSummary: string;
  whoInfo: PersonaInfo[];

  discoverySummary: string;
  discoveryInfo: PersonaInfo[];

  benefitSummary: string;
  benefitInfo: PersonaInfo[];

  frictionSummary: string;
  frictionInfo: PersonaInfo[];
}

interface PersonaDetailSectionProps {
  IconComponent: LucideIcon;
  sectionTitle: string;
  tooltipText: string;
  summaryText: string;
  items: PersonaInfo[];
  isLoading?: boolean;
  insightsTabLabel?: string;
  quotesTabLabel?: string;
  // Props for modal - will be handled internally for now if modal is per section
  // onInfoClick: (info: PersonaInfo, index: number) => void;
}

function PersonaDetailSection({ 
  IconComponent, 
  sectionTitle, 
  tooltipText, 
  summaryText, 
  items, 
  isLoading = false,
  insightsTabLabel = "Insights",
  quotesTabLabel = "Quotes",
  // onInfoClick
}: PersonaDetailSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [viewMode, setViewMode] = useState<"insights" | "quotes">("insights")
  
  // Modal state - keep it here if modal is per section, will remain commented out for now
  // const [selectedInfo, setSelectedInfo] = useState<PersonaInfo | null>(null)
  // const [isModalOpen, setIsModalOpen] = useState(false)
  // const [currentIndex, setCurrentIndex] = useState(0)

  // const handleInfoClickInternal = (info: PersonaInfo, index: number) => {
  //   setSelectedInfo(info);
  //   setCurrentIndex(index);
  //   setIsModalOpen(true);
  //   // if (onInfoClick) onInfoClick(info, index); // Call parent handler if needed
  // };

  // const handleCloseModal = () => setIsModalOpen(false);
  // const handlePrevious = () => {
  //   if (!items.length) return;
  //   const newIndex = (currentIndex - 1 + items.length) % items.length;
  //   setSelectedInfo(items[newIndex]);
  //   setCurrentIndex(newIndex);
  // };
  // const handleNext = () => {
  //   if (!items.length) return;
  //   const newIndex = (currentIndex + 1) % items.length;
  //   setSelectedInfo(items[newIndex]);
  //   setCurrentIndex(newIndex);
  // };

  const visibleItems = isExpanded ? items : items.slice(0, 5)
  const hasMoreItems = items.length > 5

  const getSignalBars = (signal: "high" | "medium" | "low") => {
    return { high: 3, medium: 2, low: 1 }[signal]
  }

  // Get icon color based on section title
  const getIconColor = (title: string) => {
    return "text-blue-600" // Make all icons blue for consistency
  }

  const iconColor = getIconColor(sectionTitle)

  if (isLoading) {
    // Basic loading skeleton for a section
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-gray-200 rounded mb-6 animate-pulse"></div>
          <div className="space-y-2.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center space-x-3">
            <IconComponent className={`h-5 w-5 ${iconColor}`} />
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">{sectionTitle}</p>
          </div>
          <TooltipProvider delayDuration={50}>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-slate-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm p-4">
                <p className="text-sm">{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        {summaryText && (
            <div className="bg-[#FAFAFA] rounded-md border border-slate-200 p-4 mt-2 mb-6">
                <div
                    className="text-sm text-slate-700 leading-relaxed whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: summaryText }}
                />
            </div>
        )}

        <div className="mt-4">
          <div className="flex space-x-2 mb-3 border-b">
            <button
              className={`pb-2 px-3 text-sm font-medium ${
                viewMode === "insights"
                  ? "border-b-2 border-slate-700 text-slate-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setViewMode("insights")}
            >
              {insightsTabLabel}
            </button>
            <button
              className={`pb-2 px-3 text-sm font-medium ${
                viewMode === "quotes"
                  ? "border-b-2 border-slate-700 text-slate-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setViewMode("quotes")}
            >
              {quotesTabLabel}
            </button>
          </div>

          <div className="space-y-2.5">
            {visibleItems.map((item) => {
              const activeBars = getSignalBars(item.signal)
              const display_text = viewMode === "insights" ? item.text : `"${item.snippet}"`
              return (
                <div
                  key={item.id}
                  className="flex border border-slate-200 rounded-md cursor-pointer transition-all bg-white hover:bg-[#FAFAFA] hover:border-slate-300 group"
                  // onClick={() => handleInfoClickInternal(item, index)} // Modal functionality commented out
                >
                  <div className="py-2 px-3.5 flex-grow w-[85%] relative">
                    <p className="text-sm text-slate-700 leading-relaxed pr-5">{display_text}</p>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400 absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 group-hover:text-blue-600 transition-all" />
                  </div>
                  <div className="py-2 px-2 border-l border-slate-200 w-[15%] min-w-[100px] flex items-center justify-between text-xs">
                    <div className="flex items-end gap-0.5 h-3">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 rounded-sm ${i < activeBars ? "bg-green-600" : "bg-slate-200"}`}
                          style={{ height: `${(i + 1) * 3 + 3}px` }}
                        />
                      ))}
                    </div>
                    <span className="text-slate-500 text-[11px]">
                      {new Date(item.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              )
            })}
            {hasMoreItems && (
              <button
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline mt-1"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? "Show less" : `Show ${items.length - 5} more`}
              </button>
            )}
          </div>
        </div>

        {/* Commented out QuoteModal usage - to be re-enabled if needed 
        {selectedInfo && (
          <QuoteModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            evidence={selectedInfo}
            onPrevious={handlePrevious}
            onNext={handleNext}
            hasMultiple={items.length > 1}
            currentIndex={currentIndex + 1}
            totalCount={items.length}
          />
        )}
        */}
      </CardContent>
    </Card>
  )
}


interface PersonaCardProps {
  data?: PersonaCardData 
  isLoading?: boolean
}

// Helper to generate dummy PersonaInfo items
const generateDummyInfo = (baseId: string, count: number, baseText: string, baseSnippet: string): PersonaInfo[] => {
    return Array.from({ length: count }, (_, i) => {
        const day = (i % 2 === 0) ? 24 : 25; // Alternate days
        return {
            id: `${baseId}-${i + 1}`,
            text: `${baseText} insight example text ${i + 1}. This demonstrates a key observation. `,
            snippet: `${baseSnippet} quote snippet ${i + 1}. This is a direct quote. More text. `,
            signal: i % 3 === 0 ? "high" : i % 2 === 0 ? "medium" : "low",
            interviewId: `interview-${baseId}-${i + 1}`,
            timestamp: new Date(2025, 4, day).toISOString(), // Month is 0-indexed (4 for May)
        };
    });
};

// Placeholder data for new sections - now generates 32 items
const defaultBenefitInfo: PersonaInfo[] = Array.from({ length: 32 }, (_, i) => {
    const day = (i % 2 === 0) ? 24 : 25;
    let text = "Placeholder benefit insight";
    let snippet = "Placeholder benefit quote";
    // Keep specific first 6 items, then generic for the rest
    if (i === 0) { text = "Slashes release cycles significantly."; snippet = "It really helps us focus on product more than rote code"; }
    else if (i === 1) { text = "Agent mode turns complex updates into hour-long tasks."; snippet = "I love when it just works through lint errors and everything just works"; }
    else if (i === 2) { text = "Deep codebase queries add confidence to development."; snippet = "I've done big features, end to end, in a day which is amazing"; }
    else if (i === 3) { text = "BYO-LLM flexibility keeps compute bills manageable."; snippet = "It's just helps us be deliver super fast, that's the main benefit"; }
    else if (i === 4) { text = "Helps teams stay small and move fast."; snippet = "I really like that we can bring our own API keys, we have lots of credits"; }
    else if (i === 5) { text = "Reduces need for extensive headcount for coding tasks."; snippet = "The agent mode is a game-changer for refactoring."; }
    else { text = `${text} ${i + 1}`; snippet = `${snippet} ${i + 1}`;}

    return {
        id: `b${i + 1}`,
        text: text,
        snippet: snippet,
        signal: i % 4 === 0 ? "high" : (i % 4 === 1 || i % 4 === 2) ? "medium" : "low",
        interviewId: `iv-b${i + 1}`,
        timestamp: new Date(2025, 4, day).toISOString(),
    };
});

const defaultFrictionInfo: PersonaInfo[] = Array.from({ length: 32 }, (_, i) => {
    const day = (i % 2 === 0) ? 24 : 25;
    let text = "Placeholder friction insight";
    let snippet = "Placeholder friction quote";
    if (i === 0) { text = "Inconsistent AI hallucinations (e.g. Sonnet 3.7) lead to costly rework."; snippet = "The hallucinations with Sonnet 3.7 are a real time-waster."; }
    else if (i === 1) { text = "Unreviewable diffs for AI changes erode trust."; snippet = "I wish the diffs were easier to review; sometimes it feels like a black box."; }
    else if (i === 2) { text = "Limited control over AI generation process can slow adoption."; snippet = "We need better audit trails for prompt-to-code to meet our security standards."; }
    else if (i === 3) { text = "Sprawling updates from AI agents are hard to manage."; snippet = "The full-repo exposure for context is a concern for our security team."; }
    else if (i === 4) { text = "Security gaps perceived with full-repo exposure for context."; snippet = "Sometimes the updates are too sprawling, and it's hard to control the scope."; }
    else if (i === 5) { text = "Missing prompt-to-code audit trails are a compliance concern."; snippet = "Lack of fine-grained control during generation can be frustrating."; }
    else { text = `${text} ${i + 1}`; snippet = `${snippet} ${i + 1}`;}

    return {
        id: `f${i + 1}`,
        text: text,
        snippet: snippet,
        signal: i % 4 === 0 ? "high" : (i % 4 === 1 || i % 4 === 2) ? "medium" : "low",
        interviewId: `iv-f${i + 1}`,
        timestamp: new Date(2025, 4, day).toISOString(),
    };
});

export function PersonaCard({ data, isLoading = false }: PersonaCardProps) {

  if (isLoading) {
    // Updated loading state to show 4 sections
    return (
        <div className="space-y-6">
            <PersonaDetailSection IconComponent={User} sectionTitle="LOADING" tooltipText="" summaryText="" items={[]} isLoading={true} />
            <PersonaDetailSection IconComponent={Search} sectionTitle="LOADING" tooltipText="" summaryText="" items={[]} isLoading={true} />
            <PersonaDetailSection IconComponent={ThumbsUp} sectionTitle="LOADING" tooltipText="" summaryText="" items={[]} isLoading={true} />
            <PersonaDetailSection IconComponent={ThumbsDown} sectionTitle="LOADING" tooltipText="" summaryText="" items={[]} isLoading={true} />
        </div>
    );
  }

  // Fallback data definitions (ensure generateDummyInfo is available)
  const whoSummaryFallback = `
<strong class="font-semibold">Primary Profile:</strong> Early-stage CTO-founders at SaaS startups dominate this persona. Based on 42 interviews, they lead four-to-eight-person cross-functional squads and still commit code. Their north-star metric is shipping velocity: proofs of concept and clean production releases every week. Losing the product would slow feedback loops, stall iteration, and sap their market-first momentum.

<strong class="font-semibold">Sub-segments:</strong> A smaller group of later-stage engineering leaders appears, guiding larger distributed teams across more complex, microservice-heavy stacks. They share the appetite for speed but temper it with the need to balance collaboration, quality gates, and security controls.
  `.trim();
  const whoInfoFallback: PersonaInfo[] = [
    {
      id: "who-quote-1",
      text: "I'm the founding CTO but still code most of our core features myself",
      snippet: "I'm the founding CTO but still code most of our core features myself",
      signal: "high",
      interviewId: "iv-who-1",
      timestamp: new Date(2025, 4, 5).toISOString(), // May 5th
    },
    {
      id: "who-quote-2",
      text: "We're building an AI first procurement tool",
      snippet: "We're building an AI first procurement tool",
      signal: "medium",
      interviewId: "iv-who-2",
      timestamp: new Date(2025, 4, 23).toISOString(), // May 23rd
    },
    {
      id: "who-quote-3",
      text: "We're an early ML infra startup, tackling build pipelines",
      snippet: "We're an early ML infra startup, tackling build pipelines",
      signal: "high",
      interviewId: "iv-who-3",
      timestamp: new Date(2025, 4, 25).toISOString(), // May 25th
    },
    {
      id: "who-quote-4",
      text: "I'm the CEO, but still code a bunch when I have time.",
      snippet: "I'm the CEO, but still code a bunch when I have time.",
      signal: "medium",
      interviewId: "iv-who-4",
      timestamp: new Date(2025, 4, 23).toISOString(), // May 23rd
    },
    {
      id: "who-quote-5",
      text: "We just closed seed funding so our eng team is about to get bigger",
      snippet: "We just closed seed funding so our eng team is about to get bigger",
      signal: "high",
      interviewId: "iv-who-5",
      timestamp: new Date(2025, 4, 5).toISOString(), // Assuming May 5th as date was missing, changed from original prompt's lack of date to a specific one.
    },
  ];

  const discoverySummaryFallback = `
<strong class="font-semibold">Discovery Channels:</strong> Most users find the product through organic search (45%), followed by word-of-mouth recommendations from peers (30%), and social media discussions in technical communities (25%). The high organic search traffic indicates strong SEO positioning for key technical terms.

<strong class="font-semibold">Sign-up Triggers:</strong> The primary motivation is solving immediate pain points around deployment complexity. Users report signing up after experiencing frustration with existing tools, particularly around configuration management and debugging production issues. Free tier availability and no credit card requirement lower the barrier to entry.
  `.trim();
  const discoveryInfoFallback = generateDummyInfo("discovery-fallback", 32, "Default Discovery", "Default Discovery"); // Updated count to 32
  
  const benefitSummaryProvided = `Founder-CTOs say they love Cursor because it slashes release cycles and headcount costs, allowing four-person teams to deliver like departments twice their size. Agent mode, their clear favorite, transforms sprawling multi-file refactors and feature builds into hour-long workflows instead of week-long sprints. Deep codebase queries supply instant architectural answers, while BYO LLM options fine-tune accuracy and keep compute bills in check. Enthusiasm remains high, based on 42 interviews.`; // Updated summary text
  const frictionSummaryProvided = `Founder-CTOs report that Cursor's inconsistent hallucinations as the biggest improvement opportunity. This is due to costly rework. Many such examples point to Sonnet 3.7. Other factors like unreviewable diffs, limited control slows and sprawling updates can erode trust. There are several mentions of security gaps with full-repo exposure and missing prompt-to-code audit trails. Based on 42 interviews, this group would like AI accuracy or security improvements to reduce churn but remains positive.`;

  const currentData = data || {
    whoSummary: whoSummaryFallback,
    whoInfo: whoInfoFallback,
    discoverySummary: discoverySummaryFallback,
    discoveryInfo: discoveryInfoFallback,
    benefitSummary: benefitSummaryProvided, // Use your provided summary
    benefitInfo: defaultBenefitInfo,      // Use defined placeholder items
    frictionSummary: frictionSummaryProvided, // Use your provided summary
    frictionInfo: defaultFrictionInfo,     // Use defined placeholder items
  };

  return (
    <div className="space-y-6">
      <PersonaDetailSection 
        IconComponent={User}
        sectionTitle="PERSONA | WHO THEY ARE"
        tooltipText="This snapshot is based on structured interview responses grouped under this persona type. An LLM workflow analyzes the data to surface common traits like role, company context, and work style, along with any clear subgroups (such as VC-backed vs bootstrapped founders)."
        summaryText={currentData.whoSummary}
        items={currentData.whoInfo}
        isLoading={isLoading} 
      />
      <PersonaDetailSection 
        IconComponent={Search}
        sectionTitle="DISCOVERY | WHERE THEY FIND YOU AND WHY THEY SIGN UP"
        tooltipText="This section analyzes how users discover your product and what motivates them to sign up. It includes insights from user interviews about their discovery channels, initial impressions, and key decision factors."
        summaryText={currentData.discoverySummary}
        items={currentData.discoveryInfo}
        isLoading={isLoading}
      />
      <PersonaDetailSection 
        IconComponent={ThumbsUp}
        sectionTitle="BENEFIT | WHAT THEY LOVE ABOUT YOUR PRODUCT"
        tooltipText="This section highlights the key benefits and value propositions that resonate most with this persona group, based on their direct feedback and usage patterns."
        summaryText={currentData.benefitSummary}
        items={currentData.benefitInfo}
        isLoading={isLoading}
      />
      <PersonaDetailSection 
        IconComponent={ThumbsDown}
        sectionTitle="FRICTION & CHURN | WHAT KEEPS THEM FROM LOVING YOU"
        tooltipText="This section identifies the primary pain points, frustrations, and potential churn drivers for this persona. Understanding these areas is crucial for product improvement and retention strategies."
        summaryText={currentData.frictionSummary}
        items={currentData.frictionInfo}
        isLoading={isLoading}
      />
    </div>
  )
}
