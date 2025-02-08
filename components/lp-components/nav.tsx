'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MenuIcon, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const navigation = [
  { name: 'How it Works', href: '#how-it-works' },
  { name: 'Demo', href: '#demo' },
  { name: 'Pricing', href: '#pricing' },
]

export default function Nav() {
  const [isScrolled, setIsScrolled] = useState(false)

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
        <nav className="flex items-center justify-between py-4 sm:py-5" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="sr-only">Franko</span>
              <Image
                className="h-6 w-auto sm:h-8"
                src="/assets/text-logo-bigger.svg"
                alt="Franko"
                width={646}
                height={138}
                priority
                style={{
                  objectFit: 'contain',
                  maxWidth: '180px'
                }}
              />
            </Link>
          </div>
          <div className="flex items-center gap-4 lg:hidden">
            <Link
              href="/demo/dashboard"
              className="flex items-center justify-center rounded-md border border-yellow-500 px-3 py-1.5 text-sm font-medium text-yellow-600 hover:bg-yellow-50 transition-colors duration-200"
            >
              Open Demo Dashboard
            </Link>
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
                          className="h-6 w-auto sm:h-8"
                          src="/assets/text-logo-bigger.svg"
                          alt="Franko"
                          width={646}
                          height={138}
                          style={{
                            objectFit: 'contain',
                            maxWidth: '180px'
                          }}
                        />
                      </Link>
                      <SheetTrigger asChild>
                        <button
                          type="button"
                          className="-m-2.5 rounded-md p-2.5 text-gray-700"
                        >
                          <span className="sr-only">Close menu</span>
                          <X className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </SheetTrigger>
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
                            <Link
                              href="/login"
                              className="flex w-full items-center justify-center rounded-md border border-black px-3 py-2 text-base font-medium text-black hover:bg-gray-100 transition-colors duration-200"
                            >
                              Log In
                            </Link>
                          </SheetTrigger>
                          <SheetTrigger asChild>
                            <Link
                              href="/sign-up"
                              className="flex w-full items-center justify-center rounded-md bg-black px-3 py-2 text-base font-medium text-white shadow-sm hover:bg-gray-800 transition-all duration-200 ease-in-out"
                            >
                              Sign Up
                            </Link>
                          </SheetTrigger>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="hidden lg:flex lg:gap-x-8">
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
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-x-4">
            <Link
              href="/demo/dashboard"
              className="flex items-center justify-center rounded-md border border-yellow-500 px-4 py-2 text-sm font-medium text-yellow-600 hover:bg-yellow-50 transition-colors duration-200"
            >
              Open Demo Dashboard
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center rounded-md border border-black px-4 py-2 text-sm font-medium text-black hover:bg-gray-100 transition-colors duration-200"
            >
              Log In
            </Link>
            <Link
              href="/sign-up"
              className="flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 transition-all duration-200 ease-in-out"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}

