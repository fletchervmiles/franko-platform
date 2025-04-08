"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Bell, Calendar, BarChart3, AlertCircle, UserX, Clock, Zap } from "lucide-react"

// --- Data (No changes needed) ---
const timelineData = [
  {
    id: "signup",
    title: "Sign-up & Free Trial",
    context: "Right after sign-up, identify the user's core problem and how they found you. This builds momentum and addresses friction early.",
    objectives: [
      "Spot who they are (persona) and the core problem they want solved.",
      "Discover how they found you and what convinced them to try.",
    ],
    timeIndicator: "Day 1",
    icon: <Bell className="w-3.5 h-3.5" />,
    isTimeBased: true,
  },
  {
    id: "pmf",
    title: "Early Product-Market Fit",
    context: "About a month in, check if the product meets expectations and delivers real value. Confirming fit minimizes churn.",
    objectives: [
      "Check how disappointed they'd be without your product (true 'need').",
      "See if real value matches their initial expectations.",
      "Gather suggestions for improvement.",
    ],
    timeIndicator: "~30 Days",
    icon: <Calendar className="w-3.5 h-3.5" />,
    isTimeBased: true,
  },
  {
    id: "feature-pref",
    title: "Feature Preference Discovery",
    context: "After ~2-3 months, identify which features drive engagement versus cause friction. This insight helps refine pricing and boost satisfaction.",
    objectives: [
      "Identify which features drive engagement and which go ignored.",
      "Uncover confusion or friction around usage.",
      "Gauge willingness to pay or upgrade based on perceived value.",
    ],
    timeIndicator: "~60–90 Days",
    icon: <BarChart3 className="w-3.5 h-3.5" />,
    isTimeBased: true,
  },
  {
    id: "inactivity",
    title: "Inactivity & Lapsed-Usage Trigger",
    context: "When a user goes dormant, determine if they're stuck or solved their problem elsewhere. Highlighting helpful resources can lure them back and reduce silent churn.",
    objectives: [
      "Determine if they solved their problem elsewhere or got stuck.",
      "Highlight helpful features or resources to lure them back.",
    ],
    timeIndicator: "As Needed",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    isTimeBased: false,
  },
  {
    id: "churn",
    title: "Churn & Win-Back Attempt",
    context: "Upon cancellation, ask why they're leaving (pricing, fit, features?) and explore options. This helps fix issues and potentially recapture revenue.",
    objectives: [
      "Ask why they're leaving—pricing, product fit, or a missing feature?",
      "Explore what might bring them back or whether another plan suits them better.",
    ],
    timeIndicator: "Upon Cancellation",
    icon: <UserX className="w-3.5 h-3.5" />,
    isTimeBased: false,
  },
];


// --- Main Timeline Component ---
export default function Timeline() {
  const totalItems = timelineData.length;

  return (
    <div className="relative w-full max-w-5xl mx-auto px-4">
      {/* Vertical Line - Hidden on mobile */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#333333] -translate-x-1/2 hidden md:block"></div>
      {/* Simple vertical spacing for all screen sizes */}
      <div className="space-y-10">
        {timelineData.map((item, index) => (
          <TimelineItem
            key={item.id}
            index={index}
            totalItems={totalItems}
            {...item}
          />
        ))}
      </div>
    </div>
  );
}

// --- Timeline Item Component ---
interface TimelineItemProps {
  index: number;
  totalItems: number;
  id: string;
  title: string;
  context: string;
  objectives: string[];
  timeIndicator: string;
  icon: React.ReactNode;
  isTimeBased: boolean;
}

function TimelineItem({ index, totalItems, title, context, objectives, timeIndicator, icon, isTimeBased }: TimelineItemProps) {
  const isLast = index === totalItems - 1;
  const isOddDesktop = index % 2 !== 0;
  const delay = (index + 1) * 0.1;

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay }
    }
  };

  const TimeIcon = isTimeBased ? Clock : Zap;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={variants}
      // Base relative positioning, desktop grid applied conditionally
      className={`relative ${!isLast ? 'pb-10' : ''}`} // Remove specific desktop padding bottom here
    >
      {/* A: Mobile Layout (Visible only on mobile) */}
      <div className="md:hidden">
         <ItemContent
            title={title}
            context={context}
            icon={icon}
            objectives={objectives}
            align="left" // Mobile always aligns left
            timeIndicator={timeIndicator}
            isTimeBased={isTimeBased}
          />
      </div>

      {/* B: Desktop Layout (Hidden on mobile, uses grid) */}
      <div className={`hidden md:grid md:grid-cols-[1fr_auto_1fr] md:gap-x-8 items-start ${!isLast ? 'md:pb-16' : ''}`}>
          {/* 1. Desktop Time Indicator */}
          <div className="flex flex-col items-center justify-start pt-1 h-full z-10 col-start-2 row-start-1">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#222222] border border-blue-500/30 rounded-full text-xs text-white whitespace-nowrap shadow-sm">
              <TimeIcon className="w-3 h-3 text-blue-400" />
              <span>{timeIndicator}</span>
            </div>
          </div>

          {/* 2. Desktop Content Block (Left or Right) */}
          {/* Position the container div based on isOddDesktop */}
          <div className={`
              w-full
              row-start-1
              ${isOddDesktop ? 'col-start-3' : 'col-start-1'}
          `}>
            {/* Render ItemContent, passing the desktop alignment */}
            <ItemContent
              title={title}
              context={context}
              icon={icon}
              objectives={objectives}
              align={isOddDesktop ? 'left' : 'right'} // Controls internal alignment for desktop
              timeIndicator={timeIndicator}
              isTimeBased={isTimeBased}
              isMobile={false} // Pass flag to disable mobile indicator rendering
            />
          </div>
      </div>
    </motion.div>
  );
}

// --- Reusable Item Content Sub-component ---
interface ItemContentProps {
  title: string;
  context: string;
  icon: React.ReactNode;
  objectives: string[];
  align: "left" | "right";
  timeIndicator: string;
  isTimeBased: boolean;
  isMobile?: boolean; // Optional flag to control mobile indicator rendering
}

function ItemContent({ title, context, icon, objectives, align, timeIndicator, isTimeBased, isMobile = true }: ItemContentProps) {
  const isDesktopAlignRight = align === "right";
  const TimeIcon = isTimeBased ? Clock : Zap;

  return (
    <div className={`w-full flex flex-col items-start group ${isDesktopAlignRight ? 'md:items-end' : ''}`}>
       {/* Mobile Time Indicator - Render conditionally based on isMobile flag */}
       {isMobile && (
         <div className="flex md:hidden items-center gap-1.5 mb-3 px-3 py-1 bg-[#222222] border border-blue-500/30 rounded-full text-xs text-white whitespace-nowrap shadow-sm self-start">
            <TimeIcon className="w-3 h-3 text-blue-400" />
            <span>{timeIndicator}</span>
         </div>
       )}

       {/* Title and Icon Row */}
      <div className={`flex items-center gap-2 mb-3 flex-row ${isDesktopAlignRight ? 'md:flex-row-reverse' : ''}`}>
        <div className="p-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full text-white shadow-sm">
          {icon}
        </div>
        <h3 className={`text-lg font-medium text-white text-left ${isDesktopAlignRight ? 'md:text-right' : ''}`}>{title}</h3>
      </div>

      {/* Combined Context Text */}
      <div className={`mb-4 text-sm text-left ${isDesktopAlignRight ? 'md:text-right' : ''}`}>
         <p className="text-[#BDBDBD] leading-relaxed">{context}</p>
      </div>

      {/* Objectives Box */}
      <div className={`border border-[#222222] rounded-lg p-4 bg-[#0F0F0F] w-full max-w-md mr-auto transition-colors duration-200 ease-in-out md:group-hover:bg-[#1A1A1A] ${isDesktopAlignRight ? 'md:ml-auto md:mr-0' : ''}`}>
        <h4 className="text-xs uppercase tracking-widest font-medium text-[#999999] mb-3">
          Conversation Objectives
        </h4>
        <ul className="text-[#CCCCCC] text-sm space-y-2.5">
          {objectives.map((item, i) => (
            <li key={i} className="flex items-baseline gap-2 leading-relaxed">
              <span className="block w-1.5 h-1.5 rounded-full bg-white mt-1.5 flex-shrink-0"></span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
