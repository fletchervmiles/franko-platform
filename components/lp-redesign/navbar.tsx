"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ArrowUpRight } from "lucide-react"

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

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
        "flex justify-center transition-all duration-150 ease-in-out py-4",
        scrolled ? "fixed top-0 left-0 right-0 z-50 pt-6" : "relative",
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
            <div className="w-8 h-8">
              <Image
                src="/assets/franko-logo-icon.png"
                alt="Franko Logo"
                width={32}
                height={32}
                priority
              />
            </div>
          ) : (
            <div className="h-6">
              <Image
                src="/assets/text-logo-bigger.svg"
                alt="Franko"
                width={100}
                height={24}
                priority
                className="h-6 w-auto"
              />
            </div>
          )}
        </Link>

        {/* Center the navigation items */}
        <nav className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 space-x-8">
          <Link href="/pricing" className="text-base text-gray-900 hover:text-gray-600 transition-colors font-medium">
            Pricing
          </Link>
          <Link href="/faqs" className="text-base text-gray-900 hover:text-gray-600 transition-colors font-medium">
            FAQs
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {scrolled ? (
            <Link
              href="/login"
              className="text-base text-gray-900 border border-gray-300 px-4 py-2 flex items-center font-medium"
            >
              Login <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          ) : (
            <Link href="/login" className="text-base text-gray-900 transition-colors flex items-center font-medium">
              Login <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          )}

          {scrolled && (
            <a
              href="/book-call"
              className="bg-black text-white hover:bg-black px-4 py-2 flex items-center text-sm font-medium"
              style={{ height: "38px" }}
            >
              Book a call »
            </a>
          )}
        </div>
      </div>
    </header>
  )
}
