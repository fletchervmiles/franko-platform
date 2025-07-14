"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import Navbar from "./navbar"
import MobileNavbar from "./mobile-navbar"

export default function ResponsiveNavbar() {
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
    <>
      <div className="md:block hidden">
        <Navbar />
      </div>
      <header
        className={`md:hidden flex justify-center transition-all duration-300 ease-in-out ${
          scrolled ? "fixed top-0 left-0 right-0 z-50 pt-6 bg-white" : "absolute top-0 left-0 right-0 z-50 py-4"
        }`}
      >
        <div
          className={`flex items-center justify-between px-4 py-3 ${
            scrolled ? "bg-white border border-gray-200 rounded-md shadow-sm w-[90%]" : "container mx-auto"
          }`}
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
                  src="/assets/logo-white-text.svg"
                  alt="Franko"
                  className="h-6 w-auto"
                />
              </div>
            )}
          </Link>
          <MobileNavbar scrolled={scrolled} />
        </div>
      </header>
    </>
  )
}