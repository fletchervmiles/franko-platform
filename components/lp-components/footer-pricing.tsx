"use client"

import Link from "next/link"

export default function Footer() {
  return (
    <footer className="w-full bg-black text-white grid-background03-dark py-12 min-h-[40vh] flex flex-col justify-between">
      <div className="container mx-auto px-4 flex-1 flex flex-col">
      <div className="max-w-4xl mx-auto text-center my-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal leading-tight sm:leading-loose mb-12">
            Start turning conversations into proprietary customer intelligence.
          </h2>
        </div>
        
        <div className="pt-6 border-t border-gray-800 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-300 pb-4">
            <div className="flex items-center gap-1 mb-4 sm:mb-0">
              <span>©{new Date().getFullYear()}</span>
              <span>-</span>
              <Link href="https://franko.ai" className="hover:underline">
                Service provided by Franko.ai
              </Link>
            </div>
            
            <nav className="flex items-center gap-6 mb-4 sm:mb-0">
              <Link href="/pricing" className="hover:underline">
                Pricing
              </Link>
              <Link href="/faqs" className="hover:underline">
                FAQs
              </Link>
            </nav>
            
            <nav className="flex items-center gap-4">
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:underline">
                T&Cs
              </Link>
              <a href="mailto:fletcher@franko.ai" className="hover:underline">
                Contact
              </a>
            </nav>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .shimmer-bg {
          animation: shimmer 8s infinite linear;
          background-size: 1000px 100%;
        }
      `}</style>
    </footer>
  )
}

