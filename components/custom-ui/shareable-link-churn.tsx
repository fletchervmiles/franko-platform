"use client"

import * as React from "react"
import { Copy, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SelectProfile } from "@/db/schema"

interface ShareableLinkChurnProps {
  profile: SelectProfile
}

export default function ShareableLinkChurn({ profile }: ShareableLinkChurnProps) {
  const [copied, setCopied] = React.useState(false)
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.franko.ai'
  const shareableUrl = profile?.userId 
    ? `${baseUrl}/start-interview?clientId=${profile.userId}&company=${encodeURIComponent(profile.companyName || '')}`
    : ''

  const handleCopy = async () => {
    if (!shareableUrl) return

    try {
      await navigator.clipboard.writeText(shareableUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  if (!profile) {
    return (
      <Card className="w-full bg-white transition-all duration-300 ease-in-out p-2">
        <CardContent>
          <div>Loading shareable link...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-white transition-all duration-300 ease-in-out p-2">
      <CardHeader className="pb-6">
        <CardTitle className="text-lg font-semibold">Shareable Link</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Customer Churn Use Case</h3>
              <p className="text-sm text-muted-foreground">
                Share this link with your customers who have churned. Upon submitting the form, 
                they'll immediately receive a call from our AI interviewer.
              </p>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Input 
                  value={shareableUrl}
                  readOnly
                  className="bg-gray-100/50"
                />
              </div>
              <div className="space-x-2">
                <Button 
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  disabled={!shareableUrl}
                  className="transition-all duration-300 ease-in-out h-8 text-xs px-3"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-0.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-0.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
