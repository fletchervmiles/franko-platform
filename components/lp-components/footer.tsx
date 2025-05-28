"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { useState } from "react"
import EarlyAccessModal from "../lp-redesign/early-access-modal"

export default function Footer() {
  const [showModal, setShowModal] = useState(false)

  return (

    <footer className="w-full bg-white text-gray-900 py-16 border-t border-gray-200">
              <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium leading-tight mb-8">
              Start measuring and growing your product-market fit.
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://cal.com/fletcher-miles/franko.ai-demo-call"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-black text-white hover:bg-black/90 px-4 py-3 text-sm font-medium transition-colors"
              >
                Book a demo »
              </a>
              
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center justify-center border border-gray-300 bg-white hover:bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 transition-colors"
              >
                Build your agent <ArrowUpRight className="ml-1 h-4 w-4" />
              </button>
            </div>
            
            <div className="flex items-center justify-center text-sm text-gray-600 mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              No credit card required
            </div>
          </div>

                  
          <div className="pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-y-4 sm:gap-y-0 text-sm text-gray-600">
              <div className="flex items-center gap-1 mb-4 sm:mb-0">
                <span>©{new Date().getFullYear()}</span>
                <span>-</span>
                <Link href="https://franko.ai" className="hover:underline hover:text-gray-900">
                  Service provided by Franko.ai
                </Link>
              </div>
              
              <nav className="flex items-center gap-6 mb-4 sm:mb-0">
                <Link href="/pricing" className="hover:underline hover:text-gray-900">
                  Pricing
                </Link>
                <Link href="/faqs" className="hover:underline hover:text-gray-900">
                  FAQs
                </Link>
              </nav>
              
              <nav className="flex items-center gap-4">
                <Link href="/privacy" className="hover:underline hover:text-gray-900">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:underline hover:text-gray-900">
                  T&Cs
                </Link>
                <a href="mailto:fletcher@franko.ai" className="hover:underline hover:text-gray-900">
                  Contact
                </a>
              </nav>
        </div>
        
        <div className="pt-8 border-t border-gray-800 mt-16 sm:mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-y-4 sm:gap-y-0 text-sm text-gray-300 pb-4">
            <div className="flex items-center gap-1 mb-4 sm:mb-0">
              <span>©{new Date().getFullYear()}</span>
              <span>-</span>
              <Link href="https://franko.ai" className="hover:underline">
                Service provided by Franko.ai
              </Link>
            </div>
          </div>
      </div>
      
      <EarlyAccessModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </footer>
  )
}

