'use client'

import Image from 'next/image'
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

interface StepImageProps {
  step: Step
}

export default function StepImage({ step }: StepImageProps) {
  return (
    <MotionDiv
      key={step.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      <div className="relative hidden lg:block">
        <Image
          src={step.desktopImage}
          alt={step.title}
          width={800}
          height={450}
          className="rounded-2xl shadow-xl"
          priority={step.id === '1'}
        />
      </div>
      <div className="relative lg:hidden">
        <Image
          src={step.mobileImage}
          alt={step.title}
          width={400}
          height={300}
          className="rounded-2xl shadow-xl"
          priority={step.id === '1'}
        />
      </div>
    </MotionDiv>
  )
} 