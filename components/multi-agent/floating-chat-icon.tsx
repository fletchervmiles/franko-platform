import React from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { pickTextColor } from "@/lib/color-utils";

interface FloatingChatIconProps {
  text?: string;
  backgroundColor: string;
  position?: "left" | "right";
  onClick?: () => void;
}

export function FloatingChatIcon({
  text = "Feedback",
  backgroundColor,
  position = "right",
  onClick,
}: FloatingChatIconProps) {
  const textColor = pickTextColor(backgroundColor);

  const baseClasses =
    "fixed bottom-8 z-50 px-3 py-2 rounded-full shadow-md flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105 hover:opacity-100 opacity-95";

  const sideClasses = position === "left" ? "left-8" : "right-8";

  return (
    <div
      onClick={onClick}
      className={cn(baseClasses, sideClasses)}
      style={{ backgroundColor, color: textColor }}
    >
      <Send className="h-3 w-3" />
      <span className="text-xs font-medium">{text}</span>
    </div>
  );
} 