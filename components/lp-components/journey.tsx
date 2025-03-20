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
  animation: fadeIn 0.15s ease-in forwards;
}
.fade-out {
  animation: fadeOut 0.15s ease-out forwards;
}
.nav-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #D1D5DB;
  margin: 0 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  z-index: 30;
}
.nav-dot.active {
  background-color: #6366F1;
  transform: scale(1.2);
}
.nav-dots-container {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 20;
  padding: 8px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  width: fit-content;
  margin: 0 auto;
}
.mobile-nav-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #D1D5DB;
  margin: 0 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  z-index: 50;
}
.mobile-nav-dot.active {
  background-color: #6366F1;
  transform: scale(1.2);
}
.mobile-nav-dots-container {
  position: absolute;
  bottom: 20px; 
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 100;
  padding: 8px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  width: fit-content;
  margin: 0 auto;
}
.mobile-nav-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #D1D5DB;
  margin: 0 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  z-index: 105;
}
.mobile-nav-dot.active {
  background-color: #6366F1;
  transform: scale(1.2);
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
  
  // Determine if we have multiple images
  const hasMultipleImages = section.content.hasRotatingImages && 
    Array.isArray(section.content.image.desktop) && 
    section.content.image.desktop.length > 1;
  
  // Handle navigation dot click
  const handleDotClick = (index: number) => {
    if (index === currentImageIndex) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex(index);
      setIsTransitioning(false);
    }, 150); // Faster transition duration
  };

  // Determine the correct image source
  const getImageSrc = () => {
    if (hasMultipleImages) {
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
        
        {/* Navigation dots for multiple images */}
        {hasMultipleImages && (
          <div className="nav-dots-container">
            {(section.content.image.desktop as string[]).map((_, index) => (
              <div 
                key={index}
                className={`nav-dot ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => handleDotClick(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Separate component for mobile view
function MobilePanel({ section }: { section: (typeof sections)[0] }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [showDots, setShowDots] = useState(true)
  
  // Determine if we have multiple images
  const hasMultipleImages = section.content.hasRotatingImages && 
    Array.isArray(section.content.image.mobile) && 
    section.content.image.mobile.length > 1;
    
  // Debug logging for review plan section
  useEffect(() => {
    if (section.id === "review-plan") {
      console.log("Mobile review-plan:", {
        hasRotatingImages: section.content.hasRotatingImages,
        isArray: Array.isArray(section.content.image.mobile),
        imageCount: Array.isArray(section.content.image.mobile) ? section.content.image.mobile.length : 0,
        hasMultipleImages
      });
    }
  }, [section, hasMultipleImages]);

  // Handle navigation dot click
  const handleDotClick = (index: number) => {
    if (index === currentImageIndex) return;
    
    setIsTransitioning(true);
    setSwipeOffset(0); // Reset any swipe offset
    setTimeout(() => {
      setCurrentImageIndex(index);
      setIsTransitioning(false);
    }, 150); // Faster transition duration
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!hasMultipleImages) return;
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(null); // Reset touchEnd
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !hasMultipleImages) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    // Calculate swipe distance
    const distance = touchStart - currentTouch;
    
    // If at the first image and swiping right (negative distance) or
    // at the last image and swiping left (positive distance), reduce the effect
    const imageCount = (section.content.image.mobile as string[]).length;
    let restrictedDistance = distance;
    
    if ((currentImageIndex === 0 && distance < 0) || 
        (currentImageIndex === imageCount - 1 && distance > 0)) {
      // Reduce the effect by 70% when trying to swipe beyond bounds
      restrictedDistance = distance * 0.3;
    }
    
    // Cap the max swipe offset to prevent excessive movement
    const maxOffset = 100;
    const cappedOffset = Math.max(Math.min(restrictedDistance, maxOffset), -maxOffset);
    
    // Set the swipe offset for visual feedback
    setSwipeOffset(-cappedOffset);
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || !hasMultipleImages) {
      // Reset offset if touch cancelled
      setSwipeOffset(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const swipeThreshold = 40; // Lower threshold to make swipe more sensitive
    const isLeftSwipe = distance > swipeThreshold;
    const isRightSwipe = distance < -swipeThreshold;
    const imageCount = (section.content.image.mobile as string[]).length;
    
    if (isLeftSwipe && currentImageIndex < imageCount - 1) {
      handleDotClick(currentImageIndex + 1);
    } else if (isRightSwipe && currentImageIndex > 0) {
      handleDotClick(currentImageIndex - 1);
    } else {
      // If no navigation occurs, animate back to center
      setSwipeOffset(0);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  }

  // Determine the correct image source
  const getImageSrc = () => {
    if (hasMultipleImages) {
      return section.content.image.mobile[currentImageIndex] as string;
    }
    return section.content.image.mobile as string;
  }

  // Special handling for review-plan section
  const isReviewPlan = section.id === "review-plan";

  return (
    <div className="rounded-b-lg overflow-hidden">
      <div 
        className="relative w-full bg-black grid-background03-dark py-8 px-4"
        style={{ 
          paddingBottom: "calc(100% + 4rem)", // Further increased vertical padding for mobile
          position: "relative",
          overflow: "visible" // Make sure nothing gets clipped
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
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
              borderRadius: "0.75rem", // 12px rounded corners (equivalent to rounded-xl)
              transform: hasMultipleImages ? `translateX(${swipeOffset}px)` : 'none',
              transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none'
            }}
            className={`rounded-xl ${!imageLoaded ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'} ${isTransitioning ? 'fade-out' : 'fade-in'}`}
            onLoadingComplete={() => setImageLoaded(true)}
          />
        </div>
        
        {/* Direct dot buttons for review-plan section */}
        {isReviewPlan && (
          <div 
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '0',
              right: '0',
              display: 'flex',
              justifyContent: 'center',
              zIndex: 50,
              padding: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '20px',
              width: 'fit-content',
              margin: '0 auto'
            }}
          >
            {[0, 1].map((index) => (
              <div 
                key={index}
                onClick={() => handleDotClick(index)}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: index === currentImageIndex ? '#6366F1' : '#D1D5DB',
                  margin: '0 4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: index === currentImageIndex ? 'scale(1.2)' : 'scale(1)'
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
