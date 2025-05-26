"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { useSwipeable } from "react-swipeable"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

const tabItems = [
  {
    id: "track-pmf",
    label: "Track PMF",
    image: "/assets/lp-redesign/pmf-desktop.png",
  },
  {
    id: "benefit-fix",
    label: "#1 Benefit & Fix",
    image: "/placeholder-d9bch.png",
  },
  {
    id: "quantified-personas",
    label: "Quantified Personas",
    image: "/placeholder-gdmpa.png",
  },
  {
    id: "ask-your-data",
    label: "Ask Your Data",
    image: "/data-query-interface.png",
  },
  {
    id: "deep-dive",
    label: "Deep Dive",
    image: "/detailed-analytics-dashboard.png",
  },
]

export default function FeaturesTabs() {
  const [activeTab, setActiveTab] = useState(0)
  const tabsRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Handle tab click
  const handleTabClick = (index: number) => {
    setActiveTab(index)
    if (tabsRef.current) {
      const tabElement = tabsRef.current.children[index] as HTMLElement
      if (tabElement) {
        tabsRef.current.scrollLeft = tabElement.offsetLeft - 20
      }
    }
  }

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (activeTab < tabItems.length - 1) {
        setActiveTab(activeTab + 1)
      }
    },
    onSwipedRight: () => {
      if (activeTab > 0) {
        setActiveTab(activeTab - 1)
      }
    },
    trackMouse: false,
  })

  // Ensure active tab is visible on resize
  useEffect(() => {
    const handleResize = () => {
      if (tabsRef.current) {
        const tabElement = tabsRef.current.children[activeTab] as HTMLElement
        if (tabElement) {
          tabsRef.current.scrollLeft = tabElement.offsetLeft - 20
        }
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [activeTab])

  return (
    <section className="relative w-full overflow-hidden">
      {/* Tabs navigation - white background - hidden on mobile */}
      <div className="bg-white sticky top-0 z-10 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div ref={tabsRef} className="flex overflow-x-auto scrollbar-hide pt-3 md:pt-4">
            {tabItems.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(index)}
                className={cn(
                  "flex items-center justify-center text-xs md:text-sm font-medium whitespace-nowrap transition-colors py-4 flex-1 border-b border-l border-gray-200/50",
                  index === tabItems.length - 1 ? "border-r border-gray-200/50" : "",
                  activeTab === index
                    ? "text-black border-b-2 border-b-black pb-3"
                    : "text-gray-500 hover:text-gray-800 pb-3",
                )}
                aria-selected={activeTab === index}
              >
                <span className="w-4 h-4 mr-2 flex-shrink-0">
                  {index === 0 && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <path d="M12 20V10" />
                      <path d="M18 20V4" />
                      <path d="M6 20v-6" />
                    </svg>
                  )}
                  {index === 1 && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  )}
                  {index === 2 && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                  {index === 3 && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  )}
                  {index === 4 && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  )}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content area with background image */}
      <div
        className="relative w-full"
        style={{
          backgroundImage: "url('/assets/image-background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        {...swipeHandlers}
      >
        <div className="w-full px-0 md:max-w-7xl md:mx-auto md:px-4 md:py-16 py-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} // Fast transition
              className="flex justify-center items-center min-h-[280px] md:min-h-[550px] mx-4 md:mx-8"
            >
              <div className="relative w-full shadow-lg">
                {/* This new div creates the subtle padded border effect */}
                <div className="bg-black/[.30] p-3">
                  <div className="relative w-full aspect-[16/9] overflow-hidden">
                    <Image
                      src={tabItems[activeTab].image}
                      alt={`Feature: ${tabItems[activeTab].label}`}
                      layout="fill"
                      objectFit="cover"
                      priority={activeTab === 0} // Prioritize loading the first tab image
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
