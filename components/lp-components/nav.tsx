'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MenuIcon, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import EarlyAccessModal from '../lp-redesign/early-access-modal'

const navigation = [
  { name: 'Pricing', href: '/pricing' },
  { name: 'FAQs', href: '/faqs' },
]

export default function Nav() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, onClose?: () => void) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      const element = document.getElementById(href.substring(1))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        onClose?.()
      }
    }
  }

  return (
    <header className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${isScrolled ? 'border-b border-gray-200' : ''}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between py-2 sm:py-3" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1 p-1">
              <span className="sr-only">Franko</span>
              <Image
                className="h-4 w-auto sm:h-5"
                src="/assets/text-logo-bigger.svg"
                alt="Franko"
                width={646}
                height={138}
                priority
                style={{
                  objectFit: 'contain',
                  maxWidth: '130px'
                }}
              />
            </Link>
          </div>
          <div className="flex items-center gap-4 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
                >
                  <span className="sr-only">Open main menu</span>
                  <MenuIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-sm p-0">
                <div className="flex h-full flex-col bg-white">
                  <div className="px-6 py-6">
                    <div className="flex items-center justify-between">
                      <Link href="/" className="-m-1.5 p-1.5">
                        <span className="sr-only">Franko</span>
                        <Image
                          className="h-5 w-auto sm:h-6"
                          src="/assets/text-logo-bigger.svg"
                          alt="Franko"
                          width={646}
                          height={138}
                          style={{
                            objectFit: 'contain',
                            maxWidth: '150px'
                          }}
                        />
                      </Link>
                    </div>
                    <div className="mt-6 flow-root">
                      <div className="-my-6 divide-y divide-gray-500/10">
                        <div className="space-y-2 py-6">
                          {navigation.map((item) => (
                            <SheetTrigger asChild key={item.name}>
                              <Link
                                href={item.href}
                                onClick={(e) => handleNavClick(e, item.href)}
                                className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                              >
                                {item.name}
                              </Link>
                            </SheetTrigger>
                          ))}
                        </div>
                        <div className="py-6 space-y-2">
                          <SheetTrigger asChild>
                            <button
                              onClick={() => setShowModal(true)}
                              className="flex w-full items-center justify-center rounded-md border border-black px-3 py-2 text-base font-medium text-black hover:bg-gray-100 transition-colors duration-200"
                            >
                              Log In
                            </button>
                          </SheetTrigger>
                          <SheetTrigger asChild>
                            <button
                              onClick={() => setShowModal(true)}
                              className="flex w-full items-center justify-center rounded-md bg-black px-3 py-2 text-base font-medium text-white shadow-sm hover:bg-gray-800 transition-all duration-200 ease-in-out"
                            >
                              Try for Free
                            </button>
                          </SheetTrigger>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="hidden lg:flex lg:gap-x-6">
            {navigation.map((item) => (
              <Link 
                key={item.name} 
                href={item.href} 
                onClick={(e) => handleNavClick(e, item.href)}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-x-3">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center rounded-md border border-black px-3 py-1.5 text-sm font-medium text-black hover:bg-gray-100 transition-colors duration-200"
            >
              Log In
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 transition-all duration-200 ease-in-out"
            >
              Try for Free
            </button>
          </div>
        </nav>
      </div>
      
      <EarlyAccessModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </header>
  )
}

