'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { ChevronRightIcon } from '@heroicons/react/20/solid'

const steps = [
  {
    id: '1',
    number: '01',
    title: 'Submit Your Interview Details',
    description: 'The interview will focus on churn, but you can center it on your company as a whole or a specific product. These details enrich the AI agent with your business context.',
    image: '/placeholder.svg?height=600&width=800'
  },
  {
    id: '2',
    number: '02',
    title: 'Get Your Shareable Link',
    description: 'Your unique link is live! Share it with customers to start churn-focused interviews tailored to your business context.',
    image: '/placeholder.svg?height=600&width=800'
  },
  {
    id: '3',
    number: '03',
    title: 'A Simple Page for Your Customers',
    description: 'Your customers can fill out the form to receive a call instantly. When sharing the link, remember to offer an incentive, like a voucher or credit.',
    image: '/placeholder.svg?height=600&width=800'
  },
  {
    id: '4',
    number: '04',
    title: 'Ready for Review',
    description: 'Find all your interviews here—ready for your review.',
    image: '/placeholder.svg?height=600&width=800'
  },
  {
    id: '5',
    number: '05',
    title: 'Deep Dive into Call Analysis',
    description: 'Review cancellation reasons, desired benefits, feedback, win-back opportunities, and action steps—plus listen to the call or read the interview transcript.',
    image: '/placeholder.svg?height=600&width=800'
  }
]

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState<string | null>(steps[0].id)

  const toggleStep = (id: string) => {
    setActiveStep(prevStep => prevStep === id ? null : id)
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="bg-black text-white rounded-3xl overflow-hidden relative">
        <div className="absolute inset-0 grid-background03-dark"></div>
        <div className="relative z-10 p-8 lg:p-12">
          <div className="flex justify-center mb-12">
            <span className="inline-flex items-center rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white border border-gray-800 shadow-[0_0_15px_rgba(255,255,255,0.08)]">
              How It Works
            </span>
          </div>
          <div className="lg:grid lg:grid-cols-2 lg:gap-12">
            <div className="space-y-4">
              {steps.map((step) => (
                <div key={step.id} className="border-b border-gray-700 pb-4">
                  <button
                    onClick={() => toggleStep(step.id)}
                    className="w-full text-left focus:outline-none"
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex-grow flex items-start">
                        <div className="w-full pr-4">
                          <div className="flex items-center justify-between w-full">
                            <span className="text-lg font-semibold text-gray-400">
                              {step.number}
                            </span>
                            <ChevronRightIcon 
                              className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${activeStep === step.id ? 'transform rotate-90' : ''}`}
                            />
                          </div>
                          <h3 className="text-xl font-semibold text-white mt-2">
                            {step.title}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {activeStep === step.id && (
                      <motion.div
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                          open: { opacity: 1, height: "auto" },
                          collapsed: { opacity: 0, height: 0 }
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="w-full mt-4"
                      >
                        <p className="text-gray-300 leading-relaxed">
                          {step.description}
                        </p>
                        <div className="mt-4 lg:hidden w-full">
                          <Image
                            src={step.image}
                            alt={step.title}
                            width={800}
                            height={600}
                            className="rounded-lg object-cover w-full"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
            <div className="hidden lg:block relative h-[600px] bg-gray-800 rounded-2xl overflow-hidden">
              <AnimatePresence mode="wait">
                {steps.map((step) => (
                  activeStep === step.id && (
                    <motion.div
                      key={step.id}
                      className="absolute inset-0"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 800px"
                      />
                    </motion.div>
                  )
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

