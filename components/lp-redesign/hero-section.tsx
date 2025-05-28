"use client"

import Link from "next/link"
import Container from "@/components/lp-redesign/container"
import { ArrowUpRight } from "lucide-react"
import { useState } from "react"
import EarlyAccessModal from "./early-access-modal"

export default function HeroSection() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="pt-24 pb-16 md:pt-44 md:pb-24 grid-background03">
      <Container>
        <div>
          <div className="max-w-5xl mb-10">
            {/* Main heading - large, bold, left-aligned */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-normal mb-6 leading-tight">
              Measure & Grow
              <br />
              Your Product-Market Fit
            </h1>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start">
            <div className="max-w-2xl">
              {/* Subtitle as a single paragraph */}
              <h2 className="text-base md:text-lg text-gray-700 mb-6 lg:mb-0 leading-snug">
                AI agents interview your users and stream insights into live dashboards. SaaS founders get a continuous
                feedback loop to spot high-value customer segments, reduce churn, and accelerate growth.
              </h2>
            </div>

            <div className="mt-6 md:mt-0 flex flex-row items-center gap-4">
              {/* CTA button styled like in the image */}
              <a
                href="https://cal.com/fletcher-miles/franko.ai-demo-call"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-black text-white hover:bg-black/90 px-4 py-3 text-sm font-medium transition-colors"
              >
                Book a demo »
              </a>

              {/* Build your agent button */}
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center justify-center border border-gray-300 bg-white hover:bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 transition-colors"
              >
                Build your agent <ArrowUpRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </Container>

      <EarlyAccessModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
