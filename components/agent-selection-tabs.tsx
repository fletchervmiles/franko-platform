"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Check, Lightbulb, LogOut, UserPlus, PenLine, Clock, BarChart2, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

interface AgentSelectionTabsProps {
  onTemplateSelect: (template: string) => void;
  onBuildYourOwnSelect: () => void;
  onGenerateAgent: (template: string) => void;
  isSubmitting?: boolean;
  organisationName?: string;
}

export default function AgentSelectionTabs({ 
  onTemplateSelect, 
  onBuildYourOwnSelect, 
  onGenerateAgent,
  isSubmitting = false,
  organisationName = "your product"
}: AgentSelectionTabsProps) {
  console.log('[AgentSelectionTabs] Received organisationName prop:', organisationName);
  
  const [orgName, setOrgName] = useState(organisationName);
  
  useEffect(() => {
    console.log('[AgentSelectionTabs] organisationName prop changed to:', organisationName);
    if (organisationName && organisationName !== "your product") {
      setOrgName(organisationName);
    }
  }, [organisationName]);
  
  const [selectedAgent, setSelectedAgent] = useState<string>("pmf")

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgent(agentId)
    
    if (agentId === "custom") {
      onBuildYourOwnSelect()
    } else {
      onTemplateSelect(agentId)
    }
  }

  const handleGenerateAgent = () => {
    onGenerateAgent(selectedAgent)
  }

  const agents = [
    {
      id: "pmf",
      title: "Product-Market Fit Agent",
      icon: Lightbulb,
      description:
        "A guided conversation that follows the Product-Market Fit Engine by Rahul Volra from Superhuman.",
      recommended: true,
      duration: "5-10 minutes",
      analysis: "PMF Dashboard, Persona Dashboard, Chat with Data",
      iconColor: "text-blue-500",
      durationIconColor: "text-amber-500",
      analysisIconColor: "text-blue-500",
    },
    {
      id: "churn",
      title: "Customer Churn Agent",
      icon: LogOut,
      description: "Uncover why customers leave, identify unmet expectations, and discover what could win them back.",
      recommended: false,
      duration: ">5 minutes",
      analysis: "Churn Analysis",
      iconColor: "text-blue-500",
      durationIconColor: "text-amber-500",
      analysisIconColor: "text-blue-500",
    },
    {
      id: "onboard",
      title: "Customer Acquisition Agent",
      icon: UserPlus,
      description: "Learn how users discovered your product, why they signed up, and what they're expecting from you.",
      recommended: false,
      duration: ">5 minutes",
      analysis: "Acquisition Insights",
      iconColor: "text-blue-500",
      durationIconColor: "text-amber-500",
      analysisIconColor: "text-blue-500",
    },
    {
      id: "custom",
      title: "Build Your Own Agent",
      icon: PenLine,
      description: "Create a fully customized agent tailored to your specific research objectives and learning goals.",
      recommended: false,
      duration: "Custom",
      analysis: "Custom analysis",
      iconColor: "text-blue-500",
      durationIconColor: "text-amber-500",
      analysisIconColor: "text-blue-500",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-base font-medium mb-2">Select a preconfigured agent or build your own.</h3>
        <p className="text-sm text-gray-500 mb-6">
          We recommend starting with a preconfigured agent. You can customize details after generating your agent.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => handleSelectAgent(agent.id)}
            className={cn(
              "border rounded-lg text-left transition-all flex flex-col h-full relative p-3 sm:p-4",
              selectedAgent === agent.id
                ? "border-gray-300 shadow-sm bg-white"
                : "bg-white border-gray-200 hover:bg-gray-50",
            )}
          >
            {selectedAgent === agent.id && (
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}

            <div className="flex items-center">
              <agent.icon className={`w-4 h-4 mr-1.5 ${agent.iconColor} flex-shrink-0`} />
              <span className="font-medium text-sm truncate">{agent.title}</span>
            </div>
          </button>
        ))}
      </div>

      {selectedAgent && selectedAgent !== "custom" && (
        <div className="border rounded-lg overflow-hidden bg-white">
          <div className="p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-medium">
                    {selectedAgent === "pmf"
                      ? "Product-Market Fit Agent"
                      : selectedAgent === "churn"
                        ? "Customer Churn Agent"
                        : selectedAgent === "onboard"
                          ? "Customer Acquisition Agent"
                          : ""}
                  </h3>
                  {selectedAgent === "pmf" && (
                    <Badge className="ml-2 bg-blue-100 text-blue-700 border-none">Recommended</Badge>
                  )}
                </div>
                <p className="mt-2 text-sm text-black">{agents.find((a) => a.id === selectedAgent)?.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="border rounded-md px-4 py-3 bg-gray-50 min-w-[140px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Clock className="h-3.5 w-3.5 text-amber-500 mr-1.5 flex-shrink-0" />
                    <h4 className="text-sm font-medium">Duration</h4>
                  </div>
                </div>
                <p className="text-sm text-gray-500">{agents.find((a) => a.id === selectedAgent)?.duration}</p>
              </div>

              <div className="border rounded-md px-4 py-3 bg-gray-50 min-w-[240px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <BarChart2 className="h-3.5 w-3.5 text-blue-500 mr-1.5 flex-shrink-0" />
                    <h4 className="text-sm font-medium">Analysis Included</h4>
                  </div>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-gray-700 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent
                        className="bg-black text-white border-black p-4 max-w-md"
                        side="top"
                        align="end"
                      >
                        {selectedAgent === "pmf" && (
                          <div className="space-y-2">
                            <p>Response data from this agent will be viewable in:</p>
                            <ul className="space-y-1 pl-4">
                              <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>PMF Dashboard</span>
                              </li>
                              <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>Persona Dashboard</span>
                              </li>
                              <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>Chat with Data</span>
                              </li>
                            </ul>
                            <p>All responses also come with an individual summary and full transcript.</p>
                          </div>
                        )}
                        {selectedAgent === "churn" && (
                          <div className="space-y-2">
                            <p>Response data from this agent will be viewable in:</p>
                            <ul className="space-y-1 pl-4">
                              <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>Persona Dashboard</span>
                              </li>
                              <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>Chat with Data</span>
                              </li>
                            </ul>
                            <p>All responses also come with an individual summary and full transcript.</p>
                          </div>
                        )}
                        {selectedAgent === "onboard" && (
                          <div className="space-y-2">
                            <p>Response data from this agent will be viewable in:</p>
                            <ul className="space-y-1 pl-4">
                              <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>Persona Dashboard</span>
                              </li>
                              <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>Chat with Data</span>
                              </li>
                            </ul>
                            <p>All responses also come with an individual summary and full transcript.</p>
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-gray-500">
                  {selectedAgent === "pmf"
                    ? "PMF Dashboard, Persona Dashboard, Chat with Data"
                    : "Persona Dashboard, Chat with Data"}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-md p-4 border border-gray-100">
              <h4 className="text-sm font-medium mb-2">The agent will explore the following:</h4>
              <ul className="text-sm text-gray-600 space-y-1.5">
                {selectedAgent === "pmf" && (
                  <>
                    <li className="flex items-start">
                      <span className="mr-1.5">•</span>
                      <span>{`How disappointed users would be if they could no longer use ${orgName}`}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1.5">•</span>
                      <span>
                        {`Which type of users they believe get the most value from ${orgName} (and where`}
                        they fit)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1.5">•</span>
                      <span>The single biggest benefit they receive and why.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1.5">•</span>
                      <span>{`The one improvement that would make ${orgName} indispensable, and why.`}</span>
                    </li>
                  </>
                )}
                {selectedAgent === "churn" && (
                  <>
                    <li className="flex items-start">
                      <span className="mr-1.5">•</span>
                      <span>The main reason each user cancelled</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1.5">•</span>
                      <span>{`The goal they hoped ${orgName} would solve and where it fell short.`}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1.5">•</span>
                      <span>
                        {`Who they are (role, company type) and how ${orgName} fit their workflow.`}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1.5">•</span>
                      <span>The single change that would win them back, if any.</span>
                    </li>
                  </>
                )}
                {selectedAgent === "onboard" && (
                  <>
                    <li className="flex items-start">
                      <span className="mr-1.5">•</span>
                      <span>
                        {`Where new users first discovered ${orgName} and what triggered their search.`}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1.5">•</span>
                      <span>
                        {`The challenge or goal that motivated them to seek a tool like ${orgName}.`}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1.5">•</span>
                      <span>
                        {`What convinced them to choose ${orgName} over alternatives and their early`}
                        impression.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1.5">•</span>
                      <span>
                        {`Who they are (role, company type) and how they expect ${orgName} to fit into`}
                        daily work.
                      </span>
                    </li>
                  </>
                )}
              </ul>
              <div className="flex items-center mt-3 text-xs text-gray-500">
                <Info className="h-3 w-3 mr-1 text-gray-500" />
                <span>Focus will vary with each respondent's answers.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedAgent && selectedAgent !== "custom" && (
        <div className="mt-8">
          <p className="text-gray-500 text-xs text-left mb-4">
            Additional settings (capturing respondent details, incentives, webhook, etc) can be customized after
            generating your agent.
          </p>
          <div className="flex justify-end">
            <Button
              onClick={handleGenerateAgent}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-5 py-2"
            >
              {isSubmitting ? "Generating Agent..." : "Generate Agent"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 