"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { RefreshCw, Globe, Bot, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface AgentTrainingCenterProps {
  userId: string
  profile: any
  onRegenerateContext: () => void
  onRegenerateAgents: () => void
  isRegeneratingContext: boolean
  isRegeneratingAgents: boolean
  chatInstancesCount: number
  modalCount: number
  agentsWithPlans: number
  hasUrl: boolean
  hasContext: boolean
}

export function AgentTrainingCenter({ 
  userId, 
  profile, 
  onRegenerateContext, 
  onRegenerateAgents,
  isRegeneratingContext,
  isRegeneratingAgents,
  chatInstancesCount,
  modalCount,
  agentsWithPlans,
  hasUrl,
  hasContext
}: AgentTrainingCenterProps) {
  
  const getTrainingStatus = () => {
    if (!hasContext) return { 
      status: 'no-context', 
      color: 'gray', 
      message: 'Add company context first',
      icon: '⚪' 
    }
    
    if (chatInstancesCount === 0) return { 
      status: 'no-agents', 
      color: 'gray', 
      message: 'No agents created yet',
      icon: '⚪' 
    }

    // Smart logic: Check timestamps first, then fall back to conversation plans
    const lastTrained = profile?.agentLastTrainedAt
    const lastUpdate = profile?.updatedAt
    
    // If we have timestamp tracking
    if (lastTrained) {
      if (lastUpdate && new Date(lastUpdate) > new Date(lastTrained)) {
        return { 
          status: 'stale', 
          color: 'yellow', 
          message: 'Agents need retraining',
          icon: '⚠️' 
        }
      }
      
      return { 
        status: 'synced', 
        color: 'green', 
        message: 'Agents up to date',
        icon: '✅' 
      }
    }
    
    // Fallback: If no timestamp but agents have conversation plans, consider them trained
    if (agentsWithPlans > 0) {
      return { 
        status: 'trained-no-timestamp', 
        color: 'green', 
        message: 'Agents are trained',
        icon: '✅' 
      }
    }
    
    // No timestamp and no conversation plans
    return { 
      status: 'never', 
      color: 'yellow', 
      message: 'Agents not yet trained',
      icon: '🔄' 
    }
  }

  const status = getTrainingStatus()
  const canRegenerateContext = hasUrl && !isRegeneratingContext && !isRegeneratingAgents
  const canRegenerateAgents = hasContext && chatInstancesCount > 0 && !isRegeneratingContext && !isRegeneratingAgents

  const getImpactMessage = () => {
    if (chatInstancesCount === 0) return "No agents to update"
    
    return `This will update ${chatInstancesCount} agents across ${modalCount} modal${modalCount !== 1 ? 's' : ''}. Your existing share links and modals will continue working without any changes.`
  }

  return (
    <Card className="rounded-[6px] border bg-[#FAFAFA] shadow-sm mb-6">
      <CardHeader className="pb-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-[#F5FF78] flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 text-[#1C1617]" />
                </div>
                Agent Training Center
              </h2>
              <p className="text-sm text-gray-500">
                Your AI agents learn from your company context below. Use these controls to update their knowledge.
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Section */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{status.icon}</span>
              <span className="font-medium text-sm">{status.message}</span>
            </div>
            {chatInstancesCount > 0 && (
              <p className="text-xs text-gray-500">
                {chatInstancesCount} agents across {modalCount} modal{modalCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <TooltipProvider delayDuration={0}>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-left">
              {/* Retrain Agents - Primary/More Prominent */}
              <Tooltip>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <TooltipTrigger asChild>
                      <Button
                        disabled={!canRegenerateAgents}
                        size="sm"
                        className="bg-[#E4F222] hover:bg-[#F5FF78] text-black h-9 px-4"
                      >
                        {isRegeneratingAgents ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Retraining Agents...
                          </>
                        ) : (
                          <>
                            <Bot className="mr-2 h-3 w-3" />
                            Retrain Agents
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Retrain agents with current context?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will update agent conversation plans using your current knowledge base. No website content will be re-extracted.
                        <br/><br/>
                        <strong>Your existing modals and share links will continue working normally.</strong>
                        <br/><br/>
                        {getImpactMessage()}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onRegenerateAgents}>
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <TooltipContent side="top" align="center" className="bg-black text-white border-black max-w-xs p-2 rounded">
                  <p className="text-xs">Update your agents with any changes you've made to the AI knowledge base below. Your context stays the same - only agent plans are refreshed.</p>
                </TooltipContent>
              </Tooltip>

              {/* Regenerate Context - Secondary/Less Prominent */}
              <Tooltip>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={!canRegenerateContext}
                        size="sm"
                        className="h-9 px-4"
                      >
                        {isRegeneratingContext ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Regenerating Context...
                          </>
                        ) : (
                          <>
                            <Globe className="mr-2 h-3 w-3" />
                            Regenerate Context
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Re-extract context from website & retrain agents?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will re-extract information from your website, update your AI knowledge base, and retrain all agents.
                        <br/><br/>
                        <strong>Your existing modals and share links will continue working normally.</strong>
                        <br/><br/>
                        {getImpactMessage()}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onRegenerateContext}>
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <TooltipContent side="top" align="center" className="bg-black text-white border-black max-w-xs p-2 rounded">
                  <p className="text-xs">Start fresh by re-crawling your website, updating your knowledge base, and retraining agents. Use this if you want to change your source URL or get the latest website content.</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          {/* Helper text for disabled states */}
          {!hasUrl && (
            <p className="text-xs text-gray-500 text-center">
              Add your website URL below to enable context regeneration
            </p>
          )}
          {!hasContext && hasUrl && (
            <p className="text-xs text-gray-500 text-center">
              Extract or add context first to enable agent training
            </p>
          )}
          {chatInstancesCount === 0 && hasContext && (
            <p className="text-xs text-gray-500 text-center">
              Create your first modal to enable agent training
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}