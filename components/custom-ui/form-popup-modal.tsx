'use client'

import { useState, useEffect } from 'react'
import { Phone, CheckCircle, HelpCircle } from 'lucide-react'
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Link from 'next/link'

export default function CallProcessingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<'processing' | 'complete'>('processing')
  const [dots, setDots] = useState('.')

  useEffect(() => {
    if (isOpen) {
      const dotsInterval = setInterval(() => {
        setDots(prev => prev.length < 3 ? prev + '.' : '.')
      }, 500)

      const timer = setTimeout(() => {
        setStatus('complete')
      }, 15000)

      return () => {
        clearInterval(dotsInterval)
        clearTimeout(timer)
      }
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <div className="flex flex-col items-center justify-center p-6 text-center">
          {status === 'processing' ? (
            <>
              <div className="animate-pulse mb-4">
                <Phone className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Please wait a moment to receive your call</h2>
              <p className="text-sm text-muted-foreground">
                We're processing your request{dots}
              </p>
            </>
          ) : (
            <>
              <div className="mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Enjoy your call :)</h2>
              <p className="text-sm text-muted-foreground mb-4">
                You can now close this modal.
              </p>
              <p className="text-sm text-muted-foreground">
                Didn't receive your call? Please refresh your page and try again.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Alternatively, contact support.
              </p>
              <Link href="/support" className="mt-4 inline-flex items-center text-primary hover:underline">
                Contact Support
                <HelpCircle className="h-4 w-4 ml-1" />
              </Link>
              <Button onClick={onClose} className="mt-4">
                Close
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}