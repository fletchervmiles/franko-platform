"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function MobileNavbar({ scrolled }: { scrolled: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden flex items-center">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[400px] pr-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between py-4">
              <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
                <Image
                  src="/assets/text-logo-big.png"
                  alt="Franko"
                  width={100}
                  height={24}
                  className="h-6 w-auto"
                />
              </Link>
            </div>
            <nav className="flex flex-col space-y-6 mt-8">
              <Link
                href="/pricing"
                className="text-lg hover:text-gray-600 transition-colors"
                onClick={() => setOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/faqs"
                className="text-lg hover:text-gray-600 transition-colors"
                onClick={() => setOpen(false)}
              >
                FAQs
              </Link>
              <Link
                href="/login"
                className={`text-lg transition-colors flex items-center self-start ${
                  scrolled ? "border border-gray-300 px-4 py-2" : ""
                }`}
                onClick={() => setOpen(false)}
              >
                Login <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
              <a
                href="https://cal.com/fletcher-miles/franko.ai-demo-call"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black text-white hover:bg-black px-4 py-2 flex items-center justify-center text-sm w-full mt-4"
                onClick={() => setOpen(false)}
              >
                Book a demo »
              </a>
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
