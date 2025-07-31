"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

/**
 * ProcessingSteps Component
 *
 * A loading animation component that shows sequential steps being processed.
 *
 * DEPENDENCIES:
 * - framer-motion: For smooth animations (npm install framer-motion)
 * - lucide-react: For the Check icon (npm install lucide-react)
 * - Tailwind CSS: For styling
 *
 * REQUIRED CSS (add to your globals.css):
 *
 * .text-shimmer {
 *   position: relative;
 *   display: inline-block;
 * }
 *
 * .text-shimmer::after {
 *   content: attr(data-text);
 *   position: absolute;
 *   left: 0;
 *   top: 0;
 *   width: 100%;
 *   height: 100%;
 *   background: linear-gradient(
 *     90deg,
 *     rgba(255, 255, 255, 0) 0%,
 *     rgba(255, 255, 255, 0.8) 50%,
 *     rgba(255, 255, 255, 0) 100%
 *   );
 *   -webkit-background-clip: text;
 *   background-clip: text;
 *   color: transparent;
 *   animation: text-shine 2s linear infinite;
 *   background-size: 200% 100%;
 * }
 *
 * @keyframes text-shine {
 *   0% {
 *     background-position: -200% center;
 *   }
 *   100% {
 *     background-position: 200% center;
 *   }
 * }
 *
 * .loading-dots {
 *   animation: loading-dots 1.5s infinite;
 * }
 *
 * @keyframes loading-dots {
 *   0%, 20% {
 *     content: '';
 *   }
 *   40% {
 *     content: '.';
 *   }
 *   60% {
 *     content: '..';
 *   }
 *   80%, 100% {
 *     content: '...';
 *   }
 * }
 *
 * CUSTOMIZATION:
 * - Update the `allSteps` array to change the step names
 * - Modify timing in useEffect (2000ms for processing, 500ms for transitions, 3000ms for reset)
 * - Change colors by updating the hex values (#1A1919, #E4F222, etc.)
 * - Adjust card width by changing max-w-lg class
 *
 * COLORS USED:
 * - Card background: #1A1919
 * - Title: white
 * - Subtitle/bottom text: white/60 (60% opacity)
 * - Processing spinner/completed icon: #E4F222
 * - Step item background: white/10 (10% opacity)
 * - Step item border: white/15 (15% opacity)
 * - Step text: white/60 (60% opacity)
 */

type StepStatus = "waiting" | "processing" | "completed" | "failed"

interface Step {
  name: string
  status: StepStatus
}

interface ProcessingStepsProps {
  steps?: Step[] | string[]  // Can be step objects or string array for dynamic simulation
  currentStep?: string
  progress?: number
  title?: string
  subtitle?: string
  completionMessage?: string
  isComplete?: boolean
  onComplete?: () => void
}

export default function ProcessingSteps({ 
  steps, 
  currentStep, 
  progress, 
  title = "Creating your account",
  subtitle = "We're doing this prep so you don't have to. Here's what's happening:",
  completionMessage = "Your interview agents will be trained and ready to go!",
  isComplete: externalComplete = false,
  onComplete
}: ProcessingStepsProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [internalComplete, setInternalComplete] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [dots, setDots] = useState("")



  const defaultSteps = [
    "Researching your company",
    "Creating a context report for your agents",
    "Retrieving some brand basics",
    "Training agents on your context",
  ]

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return ""
        return prev + "."
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  // If we have real-time progress data, create steps based on that
  const createStepsFromProgress = (): Step[] => {
    if (progress === undefined || !currentStep) return []
    
    const allSteps = [
      "Researching your company",
      "Creating a context report for your agents", 
      "Retrieving some brand basics",
      "Training your interview agents",
    ]
    
    // Determine current step index based on progress
    let currentStepIndex = 0
    if (progress >= 85) currentStepIndex = 3      // Training agents
    else if (progress >= 60) currentStepIndex = 2 // Retrieving brand basics
    else if (progress >= 30) currentStepIndex = 1 // Creating context report
    else currentStepIndex = 0                     // Researching company
    
    return allSteps.map((stepName, index) => ({
      name: stepName,
      status: index < currentStepIndex ? "completed" : 
              index === currentStepIndex ? "processing" : 
              "waiting"
    }))
  }

  // Determine which steps to use for simulation
  const getStepsForSimulation = (): string[] => {
    if (steps && Array.isArray(steps) && steps.length > 0 && typeof steps[0] === 'string') {
      return steps as string[]
    }
    return defaultSteps
  }

  const stepsForSimulation = getStepsForSimulation()

  // Use passed steps if they're Step objects, real-time progress if available, otherwise animated steps
  const visibleSteps: Step[] = (steps && Array.isArray(steps) && steps.length > 0 && typeof steps[0] === 'object') ? steps as Step[] :
    (progress !== undefined && currentStep ? createStepsFromProgress() : 
     // Use dynamic steps (either custom or default) with smart simulation
     stepsForSimulation.map((name, index) => ({
       name,
       status: index < activeStep ? "completed" : 
               index === activeStep ? (internalComplete ? "completed" : "processing") : 
               "waiting",
     })))

  // Smart progress simulation
  useEffect(() => {
    // Only run simulation if using dynamic steps (not static step objects or real-time data)
    const hasStaticSteps = steps && Array.isArray(steps) && steps.length > 0 && typeof steps[0] === 'object'
    const hasRealTimeData = progress !== undefined && currentStep
    

    
    if (hasStaticSteps || hasRealTimeData) return;

    // If external operation is complete and we haven't shown success yet
    if (externalComplete && !showSuccess) {
      console.log('🎯 External completion detected, showing success in 800ms')
      // Quickly complete all remaining steps
      const timer = setTimeout(() => {
        console.log('🏁 Setting final step complete')
        setActiveStep(stepsForSimulation.length - 1);
        setInternalComplete(true);
        
        // After a brief pause, show success
        setTimeout(() => {
          console.log('✅ Showing success modal now!')
          setShowSuccess(true);
          // Don't call onComplete here - let the Continue button handle it
        }, 500);
      }, 300);
      return () => clearTimeout(timer);
    }

    // Don't advance past the final step until external operation completes
    if (activeStep === stepsForSimulation.length - 1 && !externalComplete) {
      // Keep processing the final step but don't complete it
      if (!internalComplete) {
        const timer = setTimeout(() => {
          // Don't set internalComplete - keep showing processing spinner
        }, 2000);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Normal step progression
    if (internalComplete && activeStep < stepsForSimulation.length - 1) {
      const timer = setTimeout(() => {
        setInternalComplete(false);
        setActiveStep((prev) => prev + 1);
      }, 500); // Time to pause on completed step before showing next
      return () => clearTimeout(timer);
    }

    if (!internalComplete && activeStep < stepsForSimulation.length) {
      const timer = setTimeout(() => {
        setInternalComplete(true);
      }, 2000); // Time each step takes to "process"
      return () => clearTimeout(timer);
    }
  }, [activeStep, internalComplete, externalComplete, showSuccess, steps, progress, currentStep, stepsForSimulation, onComplete]);

  // Success state
  if (showSuccess) {
    return (
      <div className="w-full max-w-lg mx-auto bg-[#1A1919] rounded-lg shadow-xl p-6 sm:p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#E4F222] rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-[#1A1919]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            All done!
          </h1>
          <p className="text-sm sm:text-base text-white/60 mb-6">
            {completionMessage}
          </p>
          {onComplete && (
            <button
              onClick={() => {
                console.log('🎬 User clicked Continue button')
                setShowSuccess(false)
                onComplete()
              }}
              className="px-4 py-2 bg-[#E4F222] text-[#1A1919] rounded-md font-medium hover:bg-[#F5FF78] transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-[#1A1919] rounded-lg shadow-xl p-6 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-white mb-2">
        {title}
        {!showSuccess && <span className="inline-block w-6 text-left">{dots}</span>}
      </h1>
      <p className="text-sm sm:text-base text-center text-white/60 mb-6 sm:mb-8">
        {subtitle}
      </p>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {visibleSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="py-1"
            >
              <div className="flex items-center px-3 py-3.5 rounded-md transition-colors duration-300 bg-white/10 border border-white/15 text-white/60">
                {/* Status icon */}
                <div className="mr-3 w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {step.status === "processing" && (
                    <div className="w-4 h-4 border-2 border-t-[#E4F222] border-white/20 rounded-full animate-spin"></div>
                  )}
                  {step.status === "completed" && (
                    <div className="w-5 h-5 bg-[#E4F222] rounded-full flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-[#1A1919]" />
                    </div>
                  )}
                  {step.status === "waiting" && <div className="w-3 h-3 bg-white/30 rounded-full"></div>}
                </div>

                {/* Step name */}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{step.name}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <p className="text-xs sm:text-sm text-center text-white/60 mt-6 sm:mt-8">
        This usually takes 3-4 minutes.
      </p>
    </div>
  )
}
