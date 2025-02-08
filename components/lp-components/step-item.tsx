'use client'

import { ChevronRight } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { HTMLMotionProps } from 'framer-motion'

const MotionDiv = dynamic<HTMLMotionProps<"div">>(
  () => import('framer-motion').then((mod) => mod.motion.div),
  { 
    ssr: true,
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-full w-full" />
  }
)

interface Step {
  id: string
  number: string
  title: string
  description: string
  mobileImage: string
  desktopImage: string
}

interface StepItemProps {
  step: Step
  isActive: boolean
  onClick: () => void
}

export default function StepItem({ step, isActive, onClick }: StepItemProps) {
  return (
    <div className="relative" onClick={onClick}>
      <div className={`cursor-pointer rounded-2xl px-4 py-3 ${isActive ? 'bg-gray-50' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-3">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isActive ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
              {step.number}
            </span>
            <span className={`text-sm font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
              {step.title}
            </span>
          </div>
          <ChevronRight 
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isActive ? 'transform rotate-90' : ''}`}
          />
        </div>
        {isActive && (
          <MotionDiv
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 pr-8"
          >
            <p className="text-sm text-gray-600">{step.description}</p>
          </MotionDiv>
        )}
      </div>
    </div>
  )
} 