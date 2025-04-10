"use client"

import { useState, useEffect, useRef } from "react"
import { Settings, ClipboardList, Link as LinkIcon, MessageSquare, CheckCircle, BarChart2, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useIsMobile } from "@/hooks/use-mobile"
import { motion } from "framer-motion"

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
.nav-arrow-container {
  position: absolute; bottom: 16px;
  left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 12px;
  z-index: 20; padding: 6px 10px;
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  border-radius: 9999px;
  width: fit-content;
}
.nav-arrow-button {
  background: none; border: none; padding: 4px; display: flex;
  align-items: center; justify-content: center; cursor: pointer;
  color: #D1D5DB;
  transition: color 0.2s ease;
}
.nav-arrow-button:hover {
  color: #ffffff;
}
.nav-arrow-button:disabled {
  color: #6B7280;
  cursor: not-allowed;
}
`;

const sections = [
  {
    id: "context-setup",
    title: "Set up your context",
    icon: <Settings className="h-5 w-5" />,
    content: {
      title: "01. Set up your context",
      description: "Provide your website URL to create an AI-ready knowledge base to guide context for your customer conversations.",
      image: {
        desktop: "/assets/journey-images/context-setup-desktop-01.png",
        mobile: "/assets/journey-images/context-setup-mobile-01.png"
      },
      hasRotatingImages: false,
    },
  },
  {
    id: "conversation-plan",
    title: "Generate your plan",
    icon: <ClipboardList className="h-5 w-5" />,
    content: {
      title: "02. Generate your conversation plan",
      description: "Briefly describe your learning objectives to generate a structured conversation plan. Set number of questions, and other options like incentives and email collection.",
      image: {
        desktop: [
          "/assets/journey-images/conversation-plan-form-desktop-01.png",
          "/assets/journey-images/conversation-plan-form-desktop-02.png"
        ],
        mobile: [
          "/assets/journey-images/conversation-plan-form-mobile-01.png",
          "/assets/journey-images/conversation-plan-form-mobile-02.png"
        ]
      },
      hasRotatingImages: true,
    },
  },
  {
    id: "review-plan",
    title: "Review and edit",
    icon: <CheckCircle className="h-5 w-5" />,
    content: {
      title: "03. Review and edit",
      description: "Review and edit conversation objectives, desired outcomes and agent guidance to ensure the agent meet your needs.",
      image: {
        desktop: [
          "/assets/journey-images/conversation-plan-generated-desktop-01.png",
          "/assets/journey-images/conversation-plan-generated-desktop-02.png",
          "/assets/journey-images/shareable-link-desktop-01.png"
        ],
        mobile: [
          "/assets/journey-images/conversation-plan-generated-mobile-01.png",
          "/assets/journey-images/conversation-plan-generated-mobile-02.png",
          "/assets/journey-images/shareable-link-mobile-01.png"
        ]
      },
      hasRotatingImages: true,
    },
  },
  {
    id: "share-customers",
    title: "Share With Customers",
    icon: <LinkIcon className="h-5 w-5" />,
    content: {
      title: "04. Share With Customers",
      description: "Send a secure link to a guided conversation—convenient, clickable, available whenever your customer is ready, no scheduling required.",
      image: {
        desktop: [
          "/assets/journey-images/welcome-form-desktop-01.png",
          "/assets/journey-images/chat-window-desktop-01.png"
        ],
        mobile: [
          "/assets/journey-images/welcome-form-mobile-01.png",
          "/assets/journey-images/chat-window-mobile-01.png"
        ]
      },
      hasRotatingImages: true,
    },
  },
  {
    id: "gather-responses",
    title: "Gather Responses",
    icon: <MessageSquare className="h-5 w-5" />,
    content: {
      title: "05. Gather Responses",
      description: "Get notified when feedback rolls in: transcripts, summaries, 1000s of customer words collected without any manual intervention.",
      image: {
        desktop: [
          "/assets/journey-images/response-dashboard-desktop-01.png",
          "/assets/journey-images/response-dashboard-desktop-02.png"
        ],
        mobile: [
          "/assets/journey-images/response-dashboard-mobile-01.png",
          "/assets/journey-images/response-dashboard-mobile-02.png"
        ]
      },
      hasRotatingImages: true,
    },
  },
  {
    id: "chat-with-data",
    title: "Chat With Your Data",
    icon: <BarChart2 className="h-5 w-5" />,
    content: {
      title: "06. Chat With Your Data",
      description: "Seamlessly interact with your aggregated semi-structured data—like conversing with hundreds of customers at once—turning your responses into proprietary customer intelligence.",
      image: {
        desktop: [
          "/assets/journey/response-chat-desktop-1.png",
          "/assets/journey/response-chat-desktop-2.png",
          "/assets/journey/response-chat-desktop-3.png"
        ],
        mobile: [
            "/assets/journey/response-chat-mobile-1.png",
            "/assets/journey/response-chat-mobile-2.png",
            "/assets/journey/response-chat-mobile-3.png"
        ]
      },
      hasRotatingImages: true,
    },
  },
]

// Define variants for mobile cards
const mobileCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

export default function Journey() {
  const [activeSectionId, setActiveSectionId] = useState(sections[0].id)
  const isMobile = useIsMobile()
  const activeSection = sections.find(s => s.id === activeSectionId) || sections[0]

  // Reset to first section when switching between mobile and desktop
  useEffect(() => {
    setActiveSectionId(sections[0].id)
  }, [isMobile])

  if (isMobile === null) {
    // Avoid rendering mismatch during SSR/hydration for mobile detection
    return <div className="min-h-[70vh]"></div>
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      {isMobile ? (
        // Mobile layout
        <div className="flex flex-col space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={mobileCardVariants}
              transition={{ delay: index * 0.1 }}
            >
              <MobileStepCard section={section} />
            </motion.div>
          ))}
        </div>
      ) : (
        // Desktop layout
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start min-h-[60vh]">
          {/* Left column: Step list */}
          <div className="md:col-span-1 space-y-2 sticky top-24">
            {sections.map((section, index) => {
              const isActive = activeSectionId === section.id;
              const numberPrefix = `${String(index + 1).padStart(2, '0')}. `;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`w-full text-left px-4 py-4 rounded-lg group ${
                    isActive
                      ? 'bg-white border border-gray-200 shadow-sm cursor-default'
                      : 'text-gray-400 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                  disabled={isActive}
                >
                  <div className={`font-semibold text-base mb-1 ${isActive ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>
                    <span className={isActive
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent"
                      : ""
                    }>
                      {numberPrefix}
                    </span>
                    {section.title}
                  </div>
                  {isActive && (
                    <p className="text-sm text-gray-600 leading-relaxed pl-8">
                      {section.content.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right column: Content display */}
          <div className="md:col-span-2 sticky top-24">
            <ContentDisplay key={activeSection.id} section={activeSection} isMobile={false} />
                </div>
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
        
        {/* Navigation dots for all sections with multiple images */}
        {hasMultipleImages && (
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
            {Array.from({ length: (section.content.image.mobile as string[]).length }).map((_, index) => (
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

// Separate component for mobile step card
function MobileStepCard({ section }: { section: (typeof sections)[0] }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
       {/* Image Display */}
       <ContentDisplay key={section.id} section={section} isMobile={true} />

       {/* Text Content */}
       <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
               {section.content.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
               {section.content.description}
            </p>
       </div>
    </div>
  );
}

// Separate component for content display
function ContentDisplay({ section, isMobile }: { section: (typeof sections)[0], isMobile: boolean }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const imageSet = isMobile ? section.content.image.mobile : section.content.image.desktop;
  const hasMultipleImages = section.content.hasRotatingImages && Array.isArray(imageSet) && imageSet.length > 1;
  const totalImages = hasMultipleImages ? (imageSet as string[]).length : 1;

  const handlePrev = () => {
    if (currentImageIndex > 0) {
        setImageLoaded(false);
        setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentImageIndex < totalImages - 1) {
        setImageLoaded(false);
        setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const getImageSrc = () => {
    if (hasMultipleImages) {
      return (imageSet as string[])[currentImageIndex];
    }
    return imageSet as string;
  };

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!hasMultipleImages || !isMobile) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !hasMultipleImages || !isMobile) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || !hasMultipleImages || !isMobile) return;
    const distance = touchStart - touchEnd;
    const swipeThreshold = 50;

    if (distance > swipeThreshold) {
      handleNext();
    } else if (distance < -swipeThreshold) {
      handlePrev();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  useEffect(() => {
    setImageLoaded(false);
  }, [currentImageIndex, section.id]);

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden ${
        isMobile
          ? 'bg-gray-50 p-3'
          : 'bg-gray-100 shadow-lg border border-gray-200 p-4 md:p-6'
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full h-auto">
        {!imageLoaded && (
          <div className={`absolute inset-0 bg-gray-200 animate-pulse rounded-lg ${isMobile ? 'aspect-[4/3]' : 'aspect-video'}`}></div>
        )}
        <Image
          ref={imageRef}
          key={getImageSrc()}
          src={getImageSrc()}
          alt={section.content.title}
          fill={false}
          width={isMobile ? 800 : 1200}
          height={isMobile ? 600 : 675}
          sizes="(max-width: 767px) 90vw, (min-width: 768px) 45vw, 800px"
          quality={100}
          priority={section.id === sections[0].id && currentImageIndex === 0}
          unoptimized={true}
          style={{
            objectFit: "contain",
            maxWidth: "100%",
            height: "auto",
            borderRadius: "0.5rem"
          }}
          className={`transition-opacity duration-300 ease-in-out ${imageLoaded ? 'opacity-100' : 'opacity-0'} block`}
          onLoad={() => {
             requestAnimationFrame(() => setImageLoaded(true));
          }}
          onError={() => {
            console.error(`Failed to load image: ${getImageSrc()}`);
             requestAnimationFrame(() => setImageLoaded(true));
          }}
        />
      </div>

      {/* Navigation Arrows */}
      {hasMultipleImages && (
        <div className="nav-arrow-container" style={{ bottom: isMobile ? '12px' : '24px' }}>
          <button
            className="nav-arrow-button"
            onClick={handlePrev}
            disabled={currentImageIndex === 0}
            aria-label="Previous image"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="nav-arrow-button"
            onClick={handleNext}
            disabled={currentImageIndex === totalImages - 1}
            aria-label="Next image"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
