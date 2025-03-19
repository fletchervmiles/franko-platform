"use client"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, ClipboardList, Link, MessageSquare, CheckCircle, MessageCircleReply, Database, BarChart2 } from "lucide-react"
import Image from "next/image"
import { useIsMobile } from "@/hooks/use-mobile"

// Add custom CSS class for slower pulse animation and image rotation
const customStyles = `
@keyframes slowPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
.animate-slow-pulse {
  animation: slowPulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
.fade-in {
  animation: fadeIn 0.5s ease-in forwards;
}
.fade-out {
  animation: fadeOut 0.5s ease-out forwards;
}
`;

const sections = [
  {
    id: "context-setup",
    title: "Context Setup",
    icon: <Settings className="mr-2 h-4 w-4" />,
    content: {
      title: "1. Build Your AI Agent's Context in Seconds",
      description: "Submit your URL to generate an AI knowledge base—giving your conversational agent the context is needs to understand your business.",
      image: {
        desktop: "/assets/journey/context-setup-desktop-img.png",
        mobile: "/assets/journey/context-setup-mobile-img.png"
      },
    },
  },
  {
    id: "conversation-plan",
    title: "Generate Plan",
    icon: <ClipboardList className="mr-2 h-4 w-4" />,
    content: {
      title: "Generate Plan",
      description: "Plan and structure your conversation flows for optimal engagement.",
      image: {
        desktop: "/assets/journey/conversation-form-desktop-img.png",
        mobile: "/assets/journey/conversation-form-mobile-img.png"
      },
    },
  },
  {
    id: "review-plan",
    title: "Review Plan",
    icon: <CheckCircle className="mr-2 h-4 w-4" />,
    content: {
      title: "Review Plan",
      description: "Review and refine your generated conversation plan.",
      image: {
        desktop: [
          "/assets/journey/review-plan-desktop-1.png", 
          "/assets/journey/review-plan-desktop-2.png"
        ],
        mobile: [
          "/assets/journey/review-plan-mobile-1.png", 
          "/assets/journey/review-plan-mobile-2.png"
        ]
      },
      hasRotatingImages: true,
    },
  },
  {
    id: "shareable-link",
    title: "Share",
    icon: <Link className="mr-2 h-4 w-4" />,
    content: {
      title: "Share",
      description: "Generate and manage shareable links for your conversations.",
      image: {
        desktop: "/assets/journey/shareable-link-desktop.png",
        mobile: "/assets/journey/shareable-link-mobile.png"
      },
    },
  },
  {
    id: "customer-chat",
    title: "Customer",
    icon: <MessageSquare className="mr-2 h-4 w-4" />,
    content: {
      title: "Customer",
      description: "Monitor and manage customer chat interactions in real-time.",
      image: {
        desktop: "/placeholder.svg?height=400&width=800",
        mobile: "/placeholder.svg?height=400&width=800"
      },
    },
  },
  {
    id: "response-review",
    title: "Responses",
    icon: <CheckCircle className="mr-2 h-4 w-4" />,
    content: {
      title: "Review Responses",
      description: "Review and analyze conversation responses for quality assurance.",
      image: {
        desktop: "/placeholder.svg?height=400&width=800",
        mobile: "/placeholder.svg?height=400&width=800"
      },
    },
  },
  {
    id: "response-chat",
    title: "Chat with Data",
    icon: <BarChart2 className="mr-2 h-4 w-4" />,
    content: {
      title: "Chat with Data",
      description: "Manage and optimize automated response patterns in your chats.",
      image: {
        desktop: "/placeholder.svg?height=400&width=800",
        mobile: "/placeholder.svg?height=400&width=800"
      },
    },
  },
]

export default function Journey() {
  const [activeTab, setActiveTab] = useState("context-setup")
  const isMobile = useIsMobile()

  // Reset to first tab when switching between mobile and desktop
  useEffect(() => {
    setActiveTab("context-setup")
  }, [isMobile])

  return (
    <>
      {!isMobile ? (
        // Desktop view with tabs
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex bg-transparent rounded-none h-12">
            {sections.map((section) => (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="flex-1 flex items-center justify-center group relative rounded-none h-12 data-[state=active]:shadow-none data-[state=active]:font-medium data-[state=active]:text-black transition-colors duration-200 ease-in-out"
              >
                <span className="relative z-10 p-2 rounded-lg group-hover:bg-gray-100 flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap">
                  {section.icon}
                  {section.title}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {sections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="mt-0">
              <DesktopPanel section={section} />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        // Mobile view with stacked cards
        <div className="flex flex-col space-y-6 min-h-[50vh]">
          {sections.map((section) => (
            <Card key={section.id} className="w-full shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-center pb-5 border-b">
                <div className="flex items-center gap-2">
                  {section.icon}
                  <CardTitle className="text-sm">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <MobilePanel section={section} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}

// Separate component for desktop view
function DesktopPanel({ section }: { section: (typeof sections)[0] }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const rotationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPaused = useRef(false)

  // Handle image rotation for sections with multiple images
  useEffect(() => {
    if (section.content.hasRotatingImages && Array.isArray(section.content.image.desktop)) {
      const startRotation = () => {
        rotationIntervalRef.current = setInterval(() => {
          if (!isPaused.current) {
            setIsTransitioning(true)
            setTimeout(() => {
              setCurrentImageIndex(prev => 
                (prev + 1) % section.content.image.desktop.length
              )
              setIsTransitioning(false)
            }, 500) // Match fade-out animation duration
          }
        }, 6000)
      }

      startRotation()
      
      return () => {
        if (rotationIntervalRef.current) {
          clearInterval(rotationIntervalRef.current)
        }
      }
    }
  }, [section.content.hasRotatingImages])

  // Handle pause on hover
  const handleMouseEnter = () => {
    isPaused.current = true
  }

  const handleMouseLeave = () => {
    isPaused.current = false
  }

  // Determine the correct image source
  const getImageSrc = () => {
    if (section.content.hasRotatingImages && Array.isArray(section.content.image.desktop)) {
      return section.content.image.desktop[currentImageIndex] as string;
    }
    return section.content.image.desktop as string;
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-xl border border-gray-200 transition-all duration-200 hover:shadow-2xl">
      {/* Add custom styles */}
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      
      <div 
        className="relative w-full bg-black grid-background03-dark rounded-lg py-16 px-12"
        style={{ 
          paddingBottom: "calc(48% + 1rem)" // Further reduced height ratio with more padding
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="animate-slow-pulse bg-gray-100 rounded-xl w-full max-w-4xl mx-auto h-full"></div>
          </div>
        )}
        
        <div className="absolute inset-x-4 inset-y-8">
          <Image
            src={getImageSrc()}
            alt={section.content.title}
            fill
            sizes="(min-width: 769px) 2880px"
            quality={100}
            priority
            unoptimized={true}
            style={{ 
              objectFit: "contain",
              borderRadius: "0.75rem" // 12px rounded corners (equivalent to rounded-xl)
            }}
            className={`rounded-xl ${!imageLoaded ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'} ${isTransitioning ? 'fade-out' : 'fade-in'}`}
            onLoadingComplete={() => setImageLoaded(true)}
          />
        </div>
      </div>
    </div>
  )
}

// Separate component for mobile view
function MobilePanel({ section }: { section: (typeof sections)[0] }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const rotationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPaused = useRef(false)

  // Handle image rotation for sections with multiple images
  useEffect(() => {
    if (section.content.hasRotatingImages && Array.isArray(section.content.image.mobile)) {
      const startRotation = () => {
        rotationIntervalRef.current = setInterval(() => {
          if (!isPaused.current) {
            setIsTransitioning(true)
            setTimeout(() => {
              setCurrentImageIndex(prev => 
                (prev + 1) % section.content.image.mobile.length
              )
              setIsTransitioning(false)
            }, 500) // Match fade-out animation duration
          }
        }, 6000)
      }

      startRotation()
      
      return () => {
        if (rotationIntervalRef.current) {
          clearInterval(rotationIntervalRef.current)
        }
      }
    }
  }, [section.content.hasRotatingImages])

  // Handle pause on tap/touch
  const handleTouchStart = () => {
    isPaused.current = true
  }

  const handleTouchEnd = () => {
    isPaused.current = false
  }

  // Determine the correct image source
  const getImageSrc = () => {
    if (section.content.hasRotatingImages && Array.isArray(section.content.image.mobile)) {
      return section.content.image.mobile[currentImageIndex] as string;
    }
    return section.content.image.mobile as string;
  }

  return (
    <div className="rounded-b-lg overflow-hidden">
      {/* Temporarily hiding the heading and description section */}
      <div 
        className="relative w-full bg-black grid-background03-dark py-8 px-4"
        style={{ 
          paddingBottom: "calc(100% + 4rem)" // Further increased vertical padding for mobile
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="animate-slow-pulse bg-gray-100 rounded-xl w-full max-w-sm mx-auto h-full"></div>
          </div>
        )}
        
        <div className="absolute inset-x-4 inset-y-8">
          <Image
            src={getImageSrc()}
            alt={section.content.title}
            fill
            sizes="(max-width: 768px) 500px"
            quality={100}
            priority
            unoptimized={true}
            style={{ 
              objectFit: "contain",
              borderRadius: "0.75rem" // 12px rounded corners (equivalent to rounded-xl)
            }}
            className={`rounded-xl ${!imageLoaded ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'} ${isTransitioning ? 'fade-out' : 'fade-in'}`}
            onLoadingComplete={() => setImageLoaded(true)}
          />
        </div>
      </div>
    </div>
  )
}
