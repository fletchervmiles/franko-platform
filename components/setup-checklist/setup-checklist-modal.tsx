"use client"

import { useRef, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Loader2 } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChecklistItem } from "./checklist-item"
import { useSetupChecklist } from "@/contexts/setup-checklist-context"
import { toast } from "sonner"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { logger } from "@/lib/logger"

export function SetupChecklistModal() {
  const {
    progress,
    isCompleted,
    completedCount,
    totalSteps,
    isVisible,
    isCollapsed,
    setIsCollapsed,
    steps,
    isLoading,
    error,
    refetchStatus,
  } = useSetupChecklist()

  const modalRef = useRef<HTMLDivElement>(null)
  const [expandedItemsCount, setExpandedItemsCount] = useState(0)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [wasForceCompleted, setWasForceCompleted] = useState(false)
  const prevIsCompletedRef = useRef<boolean>(isCompleted);

  const handleExpand = () => {
    setExpandedItemsCount((prev) => prev + 1)
  }

  const handleCollapse = () => {
    setExpandedItemsCount((prev) => Math.max(0, prev - 1))
  }

  // Effect for completion toast with localStorage persistence
  useEffect(() => {
    // Check for a genuine transition to completed state (not on mount)
    if (isCompleted && !prevIsCompletedRef.current && !wasForceCompleted) {
      // Check localStorage to see if we've ever shown this toast
      const toastShown = localStorage.getItem('franko_completion_toast_shown');
      
      // Only show if we haven't shown it before
      if (!toastShown) {
        toast.success("Congratulations! Your agent is ready to send to customers!", {
          duration: 3000,
        });
        
        // Mark as shown in localStorage so it never appears again
        localStorage.setItem('franko_completion_toast_shown', 'true');
      }
    }
    
    // Save previous state for transition detection
    prevIsCompletedRef.current = isCompleted;
  }, [isCompleted, wasForceCompleted]);

  const progressPercentage = Math.round((completedCount / totalSteps) * 100)

  // Handler for the "Yes, Finish" action
  const handleForceFinish = async () => {
    setIsFinishing(true);
    try {
      const response = await fetch('/api/onboarding/force-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to finish onboarding');
      }

      logger.info('Onboarding force-completed successfully via modal.');
      setShowFinishConfirm(false); // Close dialog
      setWasForceCompleted(true); // Mark as force completed before refetch
      
      // Mark in localStorage so success toast never shows
      localStorage.setItem('franko_completion_toast_shown', 'true');
      
      // Show only the "marked as complete" toast
      toast.info("Onboarding checklist marked as complete.");
      
      refetchStatus(); // Refetch to update state (will cause modal to disappear)

    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      logger.error("Error force-finishing onboarding:", message);
      toast.error(`Error: ${message}`);
      setShowFinishConfirm(false); // Close dialog even on error
    } finally {
      setIsFinishing(false);
    }
  };

  // If collapsed or not visible or completed, render nothing (button handles collapsed state)
  if (isCollapsed || !isVisible || isCompleted) {
    return null;
  }

  // Render the full expanded modal
  return (
    <div className="fixed bottom-6 right-6 z-50" ref={modalRef}>
      <AnimatePresence mode="wait">
        <motion.div
          key="expanded"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.3 },
          }}
          exit={{ opacity: 0, y: 20 }}
          className="flex flex-col"
          style={{ width: expandedItemsCount > 0 ? "400px" : "320px" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <motion.div
            animate={{
              height: expandedItemsCount > 0 ? "auto" : "auto",
              width: expandedItemsCount > 0 ? "400px" : "320px",
              transition: { duration: 0.3, ease: "easeInOut" },
            }}
          >
            <Card className="shadow-lg border rounded-xl overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Progress</h3>
                  <span className="text-sm text-gray-500">{progressPercentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2">
                  <motion.div
                    className="h-full bg-blue-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </CardHeader>
              <motion.div
                className="max-h-[60vh] overflow-y-auto"
                animate={{
                  maxHeight: expandedItemsCount > 0 ? "60vh" : "40vh",
                  transition: { duration: 0.3 },
                }}
              >
                <CardContent className="px-4 py-2">
                  {isLoading ? (
                    <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
                  ) : error ? (
                    <div className="p-4 text-center text-sm text-red-600">Error loading status: {error}</div>
                  ) : (
                    <div>
                      {steps.map((step) => (
                        <ChecklistItem
                          key={step.key}
                          label={step.label}
                          completed={progress[step.key]}
                          instructions={step.instructions}
                          onExpand={handleExpand}
                          onCollapse={handleCollapse}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </motion.div>
              <CardFooter className="px-4 py-3 flex justify-end gap-2 border-t">
                {!isCompleted && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFinishConfirm(true)}
                    className="text-sm"
                    disabled={isFinishing}
                  >
                    Finish
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCollapsed(true)}
                  className="text-sm"
                  disabled={isFinishing}
                >
                  Collapse
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      </AnimatePresence>
      <AlertDialog open={showFinishConfirm} onOpenChange={setShowFinishConfirm}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Finish Onboarding Early?</AlertDialogTitle>
            <AlertDialogDescription>
              You haven't completed all the setup steps. Finishing now will hide this checklist permanently. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isFinishing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleForceFinish}
              disabled={isFinishing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isFinishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Yes, Finish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
