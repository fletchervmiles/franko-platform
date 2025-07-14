"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ArrowUpRight } from "lucide-react"
import EarlyAccessModal from "./early-access-modal"

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Change from 20 to a larger value (approximately the hero section height)
      const isScrolled = window.scrollY > 300
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Check initial scroll position
    return () => window.removeEventListener("scroll", handleScroll)
  }, [scrolled])

  return (
    <header
      className={cn(
        "flex justify-center transition-all duration-150 ease-in-out",
        scrolled ? "fixed top-0 left-0 right-0 z-50 pt-6" : "absolute top-0 left-0 right-0 z-50 py-4",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between transition-all duration-150 ease-in-out px-6 w-full",
          scrolled ? "bg-white shadow-sm max-w-7xl w-[90%] py-3" : "max-w-7xl mx-auto",
        )}
      >
        <Link href="/" className="flex items-center">
          {scrolled ? (
            <div className="w-8 h-8 flex items-center justify-center">
              <img
                src="/favicon/icon1.png"
                alt="Franko Logo"
                className="h-6 w-6"
              />
            </div>
          ) : (
            <div className="h-6">
              <img
                src="/assets/text-logo-white.svg"
                alt="Franko"
                className="h-6 w-auto"
              />
            </div>
          )}
        </Link>

        {/* Center the navigation items */}
        <nav className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 space-x-8">
          <Link href="/pricing" className={cn(
            "text-base hover:text-gray-300 transition-colors font-medium",
            scrolled ? "text-gray-900 hover:text-gray-600" : "text-white"
          )}>
            Pricing
          </Link>
          <Link href="/faqs" className={cn(
            "text-base hover:text-gray-300 transition-colors font-medium",
            scrolled ? "text-gray-900 hover:text-gray-600" : "text-white"
          )}>
            FAQs
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {scrolled ? (
            <button
              onClick={() => setShowModal(true)}
              className="text-base text-gray-900 border border-gray-300 px-4 py-2 flex items-center font-medium rounded-[5px] hover:bg-[#F5FF78] transition-colors"
            >
              Login <ArrowUpRight className="ml-1 h-4 w-4" />
            </button>
          ) : (
            <button 
              onClick={() => setShowModal(true)}
              className="text-base text-white border border-white/30 bg-transparent hover:bg-[#F5FF78] hover:text-gray-900 hover:border-[#F5FF78] transition-colors flex items-center font-medium px-4 py-2 rounded-[5px]"
              style={{ height: "38px" }}
            >
              Login <ArrowUpRight className="ml-1 h-4 w-4" />
            </button>
          )}

          {scrolled ? (
            <a
              href="https://cal.com/fletcher-miles/franko.ai-demo-call"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black text-white hover:bg-[#F5FF78] hover:text-gray-900 px-4 py-2 flex items-center text-sm font-medium rounded-[5px] transition-colors"
              style={{ height: "38px" }}
            >
              Book a demo »
            </a>
          ) : (
            <a
              href="https://cal.com/fletcher-miles/franko.ai-demo-call"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black px-4 py-2 flex items-center text-sm font-medium transition-colors rounded-[5px]"
              style={{ 
                backgroundColor: '#E4F222',
                height: "38px" 
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F5FF78'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#E4F222'
              }}
            >
              Book a demo »
            </a>
          )}
        </div>
      </div>
      
      <EarlyAccessModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </header>
  )
}
