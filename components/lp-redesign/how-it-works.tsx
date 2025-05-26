"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Container from "./container"

// Step data
const steps = [
  {
    id: 1,
    title: "Connect your data sources",
    description: "Integrate with your existing tools in just a few clicks.",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/chat-window-desktop-01-Ddb38JzEnNZJ9QvKNP8gH7sxXGRzPW.png",
  },
  {
    id: 2,
    title: "Set up your interview agent",
    description: "Customize your AI agent to match your brand voice and goals.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-bt1awLrZ89DZIu6Jrnd8bWHClXV5SX.png",
  },
  {
    id: 3,
    title: "Deploy to your users",
    description: "Share your interview link via email, chat, or embed it on your site.",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/chat-window-desktop-01-Ddb38JzEnNZJ9QvKNP8gH7sxXGRzPW.png",
  },
  {
    id: 4,
    title: "AI conducts interviews",
    description: "Your agent automatically engages users and collects insights.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-bt1awLrZ89DZIu6Jrnd8bWHClXV5SX.png",
  },
  {
    id: 5,
    title: "Analyze feedback in real-time",
    description: "Watch as your dashboards update with new user insights.",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/chat-window-desktop-01-Ddb38JzEnNZJ9QvKNP8gH7sxXGRzPW.png",
  },
  {
    id: 6,
    title: "Take action on insights",
    description: "Use the data to improve your product and grow your business.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-bt1awLrZ89DZIu6Jrnd8bWHClXV5SX.png",
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
    <section className="py-20 bg-white border-t border-b border-gray-100">
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

        {/* Carousel Section */}
        <div className="relative mt-12 max-w-6xl mx-auto">
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
          <div ref={carouselRef} className="overflow-hidden px-10 md:px-16">
            <div className="relative">
              <motion.div
                className="flex"
                animate={{
                  x: isMobile ? `calc(50% - ${currentStep * 100}% - 50%)` : `calc(50% - ${currentStep * 84}% - 42%)`,
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {steps.map((step, index) => {
                  // Calculate the position relative to the current step
                  const position = index - currentStep

                  return (
                    <motion.div
                      key={step.id}
                      className={`flex-shrink-0 ${isMobile ? "w-[100%]" : "w-[84%]"} px-2 md:px-4`}
                      animate={{
                        scale: position === 0 ? 1 : isMobile ? 0.85 : 0.9,
                        opacity: Math.abs(position) <= 1 ? 1 : 0.4,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className={`bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200 transition-all duration-300`}
                      >
                        {/* Step Indicator */}
                        <div className="p-2 md:p-4 border-b border-gray-100">
                          <div className="md:flex md:items-center md:justify-between">
                            <div className="flex flex-col md:flex-row md:items-center pt-1 md:pt-0">
                              <div className="flex items-center justify-center w-4 h-4 md:w-5 md:h-5 bg-black text-white text-[10px] md:text-xs font-medium mb-2 md:mb-0 md:mr-3 mx-auto md:mx-0">
                                {step.id}
                              </div>
                              <h3 className="text-sm md:text-base font-medium text-center md:text-left">
                                {step.title}
                              </h3>
                            </div>
                          </div>
                          <p className="text-xs md:text-sm text-gray-600 mt-1 text-center md:text-left">
                            {step.description}
                          </p>
                        </div>

                        {/* Image Container - different aspect ratio for mobile */}
                        <div className={`relative overflow-hidden ${isMobile ? "aspect-[3/4]" : "aspect-[16/9]"}`}>
                          <img
                            src={step.image || "/placeholder.svg"}
                            alt={`Step ${step.id}: ${step.title}`}
                            className="w-full h-full object-cover"
                          />
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
      </Container>
    </section>
  )
}
