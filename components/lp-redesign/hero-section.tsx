"use client"

import Link from "next/link"
import Container from "@/components/lp-redesign/container"
import { ArrowRight, ChevronRight } from "lucide-react"
import { useState } from "react"
import EarlyAccessModal from "./early-access-modal"

export default function HeroSection() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="pt-20 pb-16 md:pt-32 md:pb-24 bg-[linear-gradient(180deg,_#040d21_0%,_#061a3a_25%,_#092256_40%,_#1a4a8a_55%,_#2d6bc7_70%,_#4a8bff_80%,_#7ba8ff_87%,_#b8d4ff_93%,_#ffffff_100%)]">
      <Container>
        <div className="text-center">
          {/* Main heading */}
          <div className="max-w-5xl mb-6 mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-normal leading-tight text-white">
              AI user interviews,
              <br />
              inside your product.
            </h1>
          </div>

          {/* Subheading */}
          <div className="max-w-2xl mb-8 mx-auto">
            <h2 className="text-base md:text-lg leading-snug" style={{ color: '#FFFFFF99' }}>
              Franko makes it easy for your users to share meaningful feedback.
            </h2>
          </div>

          {/* Single CTA button */}
          <div className="mb-16">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-black transition-colors rounded-[5px]"
              style={{ 
                backgroundColor: '#E4F222',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F5FF78'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#E4F222'
              }}
            >
              Build your agents in 1 click <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>

          {/* Comparison section */}
          <div className="flex flex-col items-center justify-center px-4 lg:px-0">
            {/* Desktop layout - side by side */}
            <div className="hidden lg:flex flex-row items-center justify-center gap-1.5">
              {/* Left side - Feels like a chore */}
              <div className="flex flex-col items-center text-center max-w-sm">
                <h3 className="text-lg font-semibold mb-2 text-white">
                  Feels like a chore
                </h3>
                <p className="text-sm mb-6 leading-relaxed" style={{ color: '#FFFFFF99' }}>
                  Asking for Feedback feels needy and gets low responses
                </p>
                <div className="w-full max-w-xs">
                  <img
                    src="/assets/email-request.svg"
                    alt="Email request feels like a chore"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* Chevron separator */}
              <div className="flex items-center justify-center">
                <ChevronRight className="h-8 w-8 text-white/60" />
              </div>

              {/* Right side - Feels like magic */}
              <div className="flex flex-col items-center text-center max-w-md">
                <h3 className="text-lg font-semibold mb-2 text-white">
                  Feels like magic
                </h3>
                <p className="text-sm mb-6 leading-relaxed" style={{ color: '#FFFFFF99' }}>
                  Users initiate feedback chats → receive responses throughout your day
                </p>
                <div className="w-full max-w-sm">
                  <img
                    src="/assets/feedback-cards-02.svg"
                    alt="Feedback cards feel like magic"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>

            {/* Mobile layout - overlapping with floating badges */}
            <div className="lg:hidden relative flex flex-col items-center text-center max-w-4xl">
              {/* Back layer - Feels like a chore */}
              <div className="absolute top-0 left-0 z-10">
                <div className="w-full max-w-xs">
                  <img
                    src="/assets/email-request.svg"
                    alt="Email request feels like a chore"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* Floating badge for "Feels like a chore" */}
              <div className="absolute top-2 left-2 z-20 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 max-w-xs">
                <h3 className="text-sm font-semibold text-white">
                  Feedback feels like a chore
                </h3>
              </div>

              {/* Front layer - Feels like magic */}
              <div className="relative z-10 ml-20 mt-64">
                <div className="w-full max-w-md">
                  <img
                    src="/assets/feedback-cards-01.svg"
                    alt="Feedback cards feel like magic"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* Floating badge for "Feels like magic" */}
              <div className="absolute top-60 right-2 z-20 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 max-w-xs">
                <h3 className="text-sm font-semibold text-white">
                  Feedback feels like magic
                </h3>
              </div>
            </div>
          </div>
        </div>
      </Container>

      <EarlyAccessModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
