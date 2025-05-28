"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Container from "./container"

// Step data
const steps = [
  {
    id: 1,
    title: "Set your context",
    description: "Enter your URL to generate an agent knowledge base and persona descriptions; add branding assets.",
    image: "/assets/lp-redesign/optimized/context.png",
  },
  {
    id: 2,
    title: "Generate an agent",
    description: "Select a ready-made agent template, or build your own. Once generated, edit configuration details as needed.",
    image: "/assets/lp-redesign/optimized/generate-agent.png",
  },
  {
    id: 3,
    title: "Get shareable link",
    description: "Copy the secure chat link and share it in an email sequence, DM, or anywhere you reach customers.",
    image: "/assets/lp-redesign/optimized/shareable-link.png",
  },
  {
    id: "3.1",
    title: "Example Invite",
    description: "Paste the link into an email like the one below and hit send to start collecting feedback.",
    image: "/assets/lp-redesign/optimized/email-example.png",
  },
  {
    id: "4.1",
    title: "Users join the chat",
    description: "A quick opt-in screen (name + email) and they're in.",
    image: "/assets/lp-redesign/optimized/chat-modal.png",
  },
  {
    id: "4.2",
    title: "Guided Interview",
    description: "The agent guides them through a short exploratory conversation. No scheduling required.",
    image: "/assets/lp-redesign/optimized/chat-img-01.png",
  },
  {
    id: "4.3",
    title: "Wrap & Capture",
    description: "The agent concludes the conversation. Transcript, summaries, notifications, and dashboard updates happen automatically.",
    image: "/assets/lp-redesign/optimized/chat-img-02.png",
  },
]

export default function HowItWorks() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  const nextStep = () => {
    setCurrentStep((prev) => (prev === steps.length - 1 ? 0 : prev + 1))
  }

  const prevStep = () => {
    setCurrentStep((prev) => (prev === 0 ? steps.length - 1 : prev - 1))
  }

  const goToStep = (index: number) => {
    setCurrentStep(index)
  }

  return (
    <section className="py-20 bg-white border-t border-b border-gray-100 overflow-hidden">
      <Container>
        {/* Section Header */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          {/* "How It Works" bubble */}
          <div className="inline-flex items-center justify-center px-6 py-2 mb-8 bg-white border border-gray-200 shadow-sm">
            <span className="text-black font-medium text-sm flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              How It Works
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-normal mb-6 leading-tight text-black">
            Launch your always-on feedback loop in five minutes.
          </h1>

          {/* Subheading */}
          <h2 className="text-lg md:text-xl text-gray-700 leading-relaxed">
            Three quick setup steps → then Franko interviews users, updates persona/pmf dashboards, and surfaces
            insights for you → no calls, no code.
          </h2>
        </div>

        {/* Desktop Carousel */}
        <div className="hidden md:block relative mt-12 max-w-6xl mx-auto">
          {/* Navigation Arrows */}
          <button
            onClick={prevStep}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
            aria-label="Previous step"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={nextStep}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
            aria-label="Next step"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Carousel Container */}
          <div ref={carouselRef} className="overflow-hidden px-16">
            <div className="relative">
              <motion.div
                className="flex"
                animate={{
                  x: `calc(50% - ${currentStep * 84}% - 42%)`,
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {steps.map((step, index) => {
                  // Calculate the position relative to the current step
                  const position = index - currentStep

                  return (
                    <motion.div
                      key={step.id}
                      className="flex-shrink-0 w-[84%] px-4"
                      animate={{
                        scale: position === 0 ? 1 : 0.9,
                        opacity: Math.abs(position) <= 1 ? 1 : 0.4,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200 transition-all duration-300">
                        {/* Image Container */}
                        <div className="relative overflow-hidden aspect-[16/9]">
                          <Image
                            src={step.image || "/placeholder.svg"}
                            alt={`Step ${step.id}: ${step.title}`}
                            fill
                            className="object-cover"
                            quality={100}
                            priority={index <= 2}
                            unoptimized={true}
                            sizes="84vw"
                          />
                        </div>

                        {/* Step Indicator */}
                        <div className="p-4 border-t border-gray-300 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="flex items-center justify-center w-5 h-5 bg-black text-white text-xs font-medium mb-2">
                              {step.id}
                            </div>
                            <h3 className="text-base font-medium mb-1">{step.title}</h3>
                            <p className="text-sm text-gray-600">{step.description}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center mt-8 space-x-2">
            {steps.map((step, index) => (
              <button
                key={`indicator-${step.id}`}
                onClick={() => goToStep(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  currentStep === index ? "bg-gray-800 w-6" : "bg-gray-300"
                }`}
                aria-label={`Go to step ${step.id}`}
                aria-current={currentStep === index ? "step" : undefined}
              />
            ))}
          </div>
        </div>

        {/* Mobile Single Card Display */}
        <div className="md:hidden mt-12">
          <div className="px-4">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md mx-auto"
            >
              <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200">
                {/* Image Container - bigger aspect ratio for mobile */}
                <div className="relative overflow-hidden aspect-[4/3]">
                  <Image
                    src={steps[currentStep].image || "/placeholder.svg"}
                    alt={`Step ${steps[currentStep].id}: ${steps[currentStep].title}`}
                    fill
                    className="object-cover"
                    quality={100}
                    priority={currentStep <= 2}
                    unoptimized={true}
                    sizes="100vw"
                  />
                </div>

                {/* Step Indicator - bigger text on mobile */}
                <div className="p-6 border-t border-gray-300 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center w-6 h-6 bg-black text-white text-sm font-medium mb-3">
                      {steps[currentStep].id}
                    </div>
                    <h3 className="text-lg font-medium mb-2">{steps[currentStep].title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{steps[currentStep].description}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Mobile Navigation Controls */}
          <div className="flex justify-center items-center mt-6 space-x-4">
            <button
              onClick={prevStep}
              className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Previous step"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            
            {/* Step indicators */}
            <div className="flex items-center space-x-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    currentStep === index ? "bg-gray-800 w-6" : "bg-gray-300"
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextStep}
              className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Next step"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </Container>
    </section>
  )
}
