"use client"

import Link from "next/link"
import { SignupForm } from "../lp-redesign/sign-up-button"

export default function Footer() {
  return (

    <footer className="w-full bg-[#1A1919] text-white py-16 border-t border-gray-800">
              <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium leading-tight mb-8">
              Ready to hear from your customers daily?
            </h2>

            <div className="flex justify-center mt-8">
              <SignupForm />
            </div>
            
            <div className="flex items-center justify-center text-sm text-gray-400 mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              No credit card required
            </div>
          </div>
                  
          <div className="pt-8 border-t border-gray-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-y-4 sm:gap-y-0 text-sm text-gray-400">
              <div className="flex items-center gap-1 mb-4 sm:mb-0">
                <span>©2025</span>
                <span>-</span>
                <Link href="https://franko.ai" className="hover:underline hover:text-white">
                  Service provided by Franko.ai
                </Link>
              </div>
              
              <nav className="flex items-center gap-6 mb-4 sm:mb-0">
                <Link href="#" onClick={(e)=>{e.preventDefault(); const el=document.querySelector('[data-section="pricing"]'); el&&el.scrollIntoView({behavior:'smooth'});}} className="hover:underline hover:text-white">
                  Pricing
                </Link>
                <Link href="#" onClick={(e)=>{e.preventDefault(); const el=document.querySelector('[data-section="try-it-yourself"]'); el&&el.scrollIntoView({behavior:'smooth'});}} className="hover:underline hover:text-white">
                  Try live demo
                </Link>
                <a href="https://cal.com/fletcher-miles/franko.ai-demo-call" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-white">
                  Book a demo
                </a>
                <a href="https://franko.mintlify.app/chat-bubble" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-white">
                  Docs
                </a>
              </nav>
              
              <nav className="flex items-center gap-4">
                <Link href="/privacy" className="hover:underline hover:text-white">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:underline hover:text-white">
                  T&Cs
                </Link>
                <a href="mailto:fletcher@franko.ai" className="hover:underline hover:text-white">
                  Contact
                </a>
              </nav>
            </div>
          </div>
      </div>
    </footer>
  )
} 