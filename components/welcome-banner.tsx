"use client";

import { Info } from "lucide-react";

interface WelcomeBannerProps {
  welcomeDescription?: string;
}

export function WelcomeBanner({ welcomeDescription }: WelcomeBannerProps) {
  if (!welcomeDescription) return null;
  
  return (
    <div 
      className="fixed top-0 left-0 right-0 z-20 border-b border-gray-200 bg-[#F9F8F6] py-2 px-4" 
      style={{ backgroundColor: "#F9F8F6", opacity: 1 }}
    >
      <div className="flex items-center justify-center gap-2 max-w-4xl mx-auto text-center">
        <Info className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <p className="text-sm text-gray-400 overflow-hidden text-ellipsis">{welcomeDescription}</p>
      </div>
    </div>
  );
}