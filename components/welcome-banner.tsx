"use client";

import { Info } from "lucide-react";
import { useEffect, useState } from "react";

interface WelcomeBannerProps {
  welcomeDescription?: string;
}

export function WelcomeBanner({ welcomeDescription }: WelcomeBannerProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  // Effect to detect mobile and log for debugging
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      console.log("WelcomeBanner rendered:", {
        isMobile: mobile,
        hasDescription: !!welcomeDescription,
        descriptionLength: welcomeDescription?.length || 0
      });
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [welcomeDescription]);
  
  if (!welcomeDescription) {
    console.log("WelcomeBanner not rendering - no description provided");
    return null;
  }
  
  // More visible styling for all devices, with extra emphasis on mobile
  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-gray-300 bg-white py-3 px-4 shadow-md">
      <div className="flex items-center justify-center gap-3 max-w-4xl mx-auto text-center">
        <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
        <p className={`text-sm font-medium text-gray-700 overflow-hidden ${isMobile ? 'text-ellipsis whitespace-nowrap' : 'break-words'} max-w-[calc(100vw-5rem)]`}>
          {welcomeDescription}
        </p>
      </div>
    </div>
  );
}