"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface EarlyAccessModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function EarlyAccessModal({ isOpen, onClose }: EarlyAccessModalProps) {
  const [copied, setCopied] = useState(false)
  const email = "fletcher@franko.ai"

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <div className="p-8">
          {/* Header with custom close button */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-medium text-black mb-2">Early Access Program</h2>
              <div className="inline-flex items-center px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
                <span className="text-xs font-medium text-blue-700">Limited Availability</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            ></button>
          </div>

          {/* Main content */}
          <div className="space-y-4 mb-8">
            <p className="text-gray-700 leading-relaxed">
              We're currently working with a small group of design partners.
            </p>

            <p className="text-gray-700 leading-relaxed">
              If you're interested in being one of the first to transform your customer feedback loop, please book a
              call.
            </p>

            <p className="text-gray-700 leading-relaxed">
              Want to explore the product on your own? That's totally fine too. Send me an email and I'll give you
              access, no call required.
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <a
              href="https://cal.com/fletcher-miles/franko.ai-demo-call"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-black text-white hover:bg-black/90 px-6 py-3 text-sm font-medium transition-colors flex items-center justify-center"
              onClick={onClose}
            >
              Book a demo »
            </a>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">or copy email</span>
              </div>
            </div>

            <button
              onClick={handleCopyEmail}
              className="w-full bg-gray-50 text-gray-700 hover:bg-gray-100 px-4 py-2 text-sm font-mono transition-colors flex items-center justify-center"
            >
              {copied ? <span className="text-green-600">Copied!</span> : <span>{email}</span>}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
