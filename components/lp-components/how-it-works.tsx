'use client'

import { useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import type { HTMLMotionProps } from 'framer-motion'

// Dynamically import Framer Motion components
const MotionDiv = dynamic<HTMLMotionProps<"div">>(
  () => import('framer-motion').then((mod) => mod.motion.div),
  { ssr: true }
)

const AnimatePresence = dynamic(
  () => import('framer-motion').then((mod) => mod.AnimatePresence),
  { ssr: true }
)

// Loading fallback component
const LoadingFallback = () => (
  <div className="animate-pulse bg-gray-200 rounded-lg h-full w-full" />
)

const steps = [
  {
    id: '1',
    number: '01',
    title: 'Submit Your Interview Details',
    description: 'The interview will focus on churn, but you can center it on your company as a whole or a specific product. These details enrich the AI agent with your business context.',
    mobileImage: '/assets/image01-mob.png',
    desktopImage: '/assets/image01-desk.png'
  },
  {
    id: '2',
    number: '02',
    title: 'Get Your Shareable Link',
    description: 'Your unique link is live! Share it with customers to start churn-focused interviews tailored to your business context.',
    mobileImage: '/assets/image02-mob.png',
    desktopImage: '/assets/image02-desk.png'
  },
  {
    id: '3',
    number: '03',
    title: 'A Simple Page for Your Customers',
    description: 'Your customers can fill out the form to receive a call instantly. When sharing the link, remember to offer an incentive, like a voucher or credit.',
    mobileImage: '/assets/image03-mob.png',
    desktopImage: '/assets/image03-desk.png'
  },
  {
    id: '4',
    number: '04',
    title: 'Ready for Review',
    description: 'Find all your interviews here—ready for your review.',
    mobileImage: '/assets/image04-mob.png',
    desktopImage: '/assets/image04-desk.png'
  },
  {
    id: '5',
    number: '05',
    title: 'Access Interview Assets',
    description: 'Listen to the audio, read the transcript, see the interview details.',
    mobileImage: '/assets/image05-mob.png',
    desktopImage: '/assets/image05-desk.png'
  },
  {
    id: '6',
    number: '06',
    title: 'Deep Dive into Call Analysis',
    description: 'Review cancellation reasons, desired benefits, feedback, win-back opportunities, and action steps.',
    mobileImage: '/assets/image06-mob.png',
    desktopImage: '/assets/image06-desk.png'
  }
]

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState('1')
  const [isAnimating, setIsAnimating] = useState(false)

  const handleStepChange = (stepId: string) => {
    if (isAnimating) return
    setIsAnimating(true)
    setActiveStep(stepId)
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            How It Works
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Get started in minutes and start understanding why your customers churn
          </p>
        </div>

        <div className="mt-16 sm:mt-20 lg:mt-24">
          <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:items-center lg:gap-x-8">
            {/* Steps */}
            <div className="lg:col-span-4">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className="relative"
                  onClick={() => handleStepChange(step.id)}
                >
                  <div className={`cursor-pointer rounded-2xl px-4 py-3 ${activeStep === step.id ? 'bg-gray-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-x-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${activeStep === step.id ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                          {step.number}
                        </span>
                        <span className={`text-sm font-semibold ${activeStep === step.id ? 'text-gray-900' : 'text-gray-600'}`}>
                          {step.title}
                        </span>
                      </div>
                      <ChevronRight 
                        className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${activeStep === step.id ? 'transform rotate-90' : ''}`}
                      />
                    </div>
                    {activeStep === step.id && (
                      <MotionDiv
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        onAnimationComplete={() => setIsAnimating(false)}
                        className="mt-2 pr-8"
                      >
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </MotionDiv>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Image */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="sync">
                {steps.map((step) => (
                  activeStep === step.id && (
                    <MotionDiv
                      key={step.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ 
                        duration: 0.2,
                        type: "spring",
                        stiffness: 260,
                        damping: 20
                      }}
                      onAnimationComplete={() => setIsAnimating(false)}
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
                          loading={step.id === '1' ? 'eager' : 'lazy'}
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
                          loading={step.id === '1' ? 'eager' : 'lazy'}
                        />
                      </div>
                    </MotionDiv>
                  )
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  )
}

