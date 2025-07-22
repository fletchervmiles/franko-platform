"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { ArrowUpRight, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function ResponsiveNavbar() {
  const [isDarkSection, setIsDarkSection] = useState(true) // Start with dark section (hero)
  const [showModal, setShowModal] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, isLoaded } = useUser()

  // Smooth scroll to try-it-yourself section
  const scrollToTryItYourself = () => {
    const tryItSection = document.querySelector('[data-section="try-it-yourself"]')
    if (tryItSection) {
      tryItSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Smooth scroll to pricing section
  const scrollToPricing = () => {
    const pricingSection = document.querySelector('[data-section="pricing"]')
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      
      // Get section elements and their positions relative to the document
      const heroSection = document.querySelector('[data-section="hero"]') as HTMLElement
      const tryItSection = document.querySelector('[data-section="try-it-yourself"]') as HTMLElement
      const pricingSection = document.querySelector('[data-section="pricing"]') as HTMLElement
      const faqSection = document.querySelector('[data-section="faq"]') as HTMLElement | null
      
      if (!heroSection || !tryItSection || !pricingSection) {
        // Fallback: assume we're in hero section if sections aren't found yet
        setIsDarkSection(true)
        return
      }
      
      // Get the absolute positions of sections from the top of the document
      const heroTop = heroSection.offsetTop
      const heroBottom = heroTop + heroSection.offsetHeight
      const tryItTop = tryItSection.offsetTop
      const tryItBottom = tryItTop + tryItSection.offsetHeight
      const pricingTop = pricingSection.offsetTop
      const pricingBottom = pricingTop + pricingSection.offsetHeight
      
      // Add some buffer for transitions (navbar height)
      const buffer = 80
      
      // Determine which section the top of the viewport (plus buffer) is currently in
      const checkPosition = scrollY + buffer
      
      let isDark = false // Default to light sections (dark text)
      
      // Check if we're in hero section (dark background -> white text)
      if (checkPosition >= heroTop && checkPosition < heroBottom) {
        isDark = true
      }
      // Check if we're in try-it-yourself section (dark background -> white text)
      else if (checkPosition >= tryItTop && checkPosition < tryItBottom) {
        isDark = true
      }
      // Check if we're in pricing section (dark background -> white text)
      else if (checkPosition >= pricingTop && checkPosition < pricingBottom) {
        isDark = true
      }
      // Check if we're in FAQ section (white background -> dark text)
      else if (faqSection) {
        const faqTop = faqSection.offsetTop
        const faqBottom = faqTop + faqSection.offsetHeight
        
        if (checkPosition >= faqTop && checkPosition < faqBottom) {
          isDark = false
        }
      }
      // All other sections (benefits, social proof, etc.) are light -> dark text
      
      setIsDarkSection(isDark)
    }
    
    // Initial check after a small delay to ensure DOM is ready
    const initialCheck = () => {
      setTimeout(handleScroll, 100)
    }
    
    initialCheck()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  const logoSrc = isDarkSection ? "/assets/text-logo-white.svg" : "/assets/text-logo-dark.svg"
  const textColor = isDarkSection ? "text-white" : "text-[#0C0A08]"
  const hoverTextColor = isDarkSection ? "hover:text-gray-300" : "hover:text-gray-600"

  return (
    <>
      {/* Frosted Glass Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center">
        {/* Frosted glass background with overlay */}
        <div className="relative w-full">
                     {/* Frosted glass layer */}
           <div 
             className="absolute inset-0"
             style={{
               background: 'rgba(255,255,255,.05)',
               backdropFilter: 'blur(16px) saturate(180%)',
               WebkitBackdropFilter: 'blur(16px) saturate(180%)',
             }}
           />

          {/* Content */}
          <div className="relative flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
            {/* Logo */}
          <Link href="/" className="flex items-center">
              <div className="h-5">
                <img
                  src={logoSrc}
                  alt="Franko"
                  className="h-5 w-auto"
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <button
                onClick={scrollToPricing}
                className={cn("text-sm font-medium transition-colors", textColor, hoverTextColor)}
              >
                Pricing
              </button>
              <button
                onClick={scrollToTryItYourself}
                className={cn("text-sm font-medium transition-colors", textColor, hoverTextColor)}
              >
                Try live demo
              </button>
              <a
                href="https://cal.com/fletcher-miles/franko.ai-demo-call"
                target="_blank"
                rel="noopener noreferrer"
                className={cn("text-sm font-medium transition-colors", textColor, hoverTextColor)}
              >
                Book a demo
              </a>
              <a
                href="https://franko.mintlify.app/chat-bubble"
                target="_blank"
                rel="noopener noreferrer"
                className={cn("text-sm font-medium transition-colors", textColor, hoverTextColor)}
              >
                Docs
              </a>
            </nav>

            {/* Auth Buttons - Desktop */}
            <div className="hidden md:flex items-center space-x-3">
              {isLoaded && user ? (
                <Link
                  href="/workspace"
                  className={cn(
                    "text-sm border px-3 py-1.5 flex items-center font-medium rounded-[5px] transition-colors",
                    isDarkSection 
                      ? "text-white border-white/30 hover:bg-[#F5FF78] hover:text-gray-900 hover:border-[#F5FF78]"
                      : "text-[#0C0A08] border-gray-300 hover:bg-[#F5FF78]"
                  )}
                >
                  Dashboard <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className={cn(
                      "text-sm border px-3 py-1.5 flex items-center font-medium rounded-[5px] transition-colors",
                      isDarkSection 
                        ? "text-white border-white/30 hover:bg-[#F5FF78] hover:text-gray-900 hover:border-[#F5FF78]"
                        : "text-[#0C0A08] border-gray-300 hover:bg-[#F5FF78]"
                    )}
                  >
                    Sign In <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                  <Link
                    href="/sign-up"
                    className={cn(
                      "text-sm px-3 py-1.5 flex items-center font-medium rounded-[5px] transition-colors",
                      isDarkSection
                        ? "text-black" 
                        : "text-black bg-[#E4F222] hover:bg-[#F5FF78]"
                    )}
                    style={isDarkSection ? { backgroundColor: '#E4F222' } : {}}
                    onMouseEnter={(e) => {
                      if (isDarkSection) {
                        e.currentTarget.style.backgroundColor = '#F5FF78'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isDarkSection) {
                        e.currentTarget.style.backgroundColor = '#E4F222'
                      }
                    }}
                  >
                    Sign Up »
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden flex items-center space-x-3">
              {/* Auth Button - Mobile */}
              {isLoaded && user ? (
                <Link
                  href="/workspace"
                  className={cn(
                    "text-sm border px-3 py-1.5 flex items-center font-medium rounded-[5px] transition-colors",
                    isDarkSection 
                      ? "text-white border-white/30 hover:bg-[#F5FF78] hover:text-gray-900 hover:border-[#F5FF78]"
                      : "text-[#0C0A08] border-gray-300 hover:bg-[#F5FF78]"
                  )}
                >
                  Dashboard <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              ) : (
                <Link
                  href="/sign-in"
                  className={cn(
                    "text-sm border px-3 py-1.5 flex items-center font-medium rounded-[5px] transition-colors",
                    isDarkSection 
                      ? "text-white border-white/30 hover:bg-[#F5FF78] hover:text-gray-900 hover:border-[#F5FF78]"
                      : "text-[#0C0A08] border-gray-300 hover:bg-[#F5FF78]"
                  )}
                >
                  Sign In <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              )}

              {/* Hamburger Menu */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="p-1.5">
                    <Menu className={cn("h-5 w-5", textColor)} />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] bg-white">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between py-4">
                      <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                        <img
                          src="/assets/text-logo-dark.svg"
                          alt="Franko"
                          className="h-5 w-auto"
                        />
                      </Link>
                    </div>
                    <nav className="flex flex-col space-y-6 mt-8">
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false)
                          scrollToPricing()
                        }}
                        className="text-lg hover:text-gray-600 transition-colors text-left"
                      >
                        Pricing
                      </button>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false)
                          scrollToTryItYourself()
                        }}
                        className="text-lg hover:text-gray-600 transition-colors text-left"
                      >
                        Try live demo
                      </button>
                      <a
                        href="https://cal.com/fletcher-miles/franko.ai-demo-call"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg hover:text-gray-600 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Book a demo
                      </a>
                      <a
                        href="https://franko.mintlify.app/chat-bubble"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg hover:text-gray-600 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Docs
                      </a>
                      {isLoaded && !user && (
                        <Link
                          href="/sign-up"
                          className="text-black hover:bg-[#F5FF78] px-4 py-2 flex items-center justify-center text-sm w-full mt-4 transition-colors rounded-[5px]"
                          style={{ backgroundColor: '#E4F222' }}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Sign Up »
                        </Link>
                      )}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
      
    </>
  )
}