"use client"

import * as React from "react"
import { Copy, Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ShareableLinkProps {
  guideName: string;
}

const StatusDot = () => <span className="inline-block w-2 h-2 rounded-full ml-2 bg-green-500" />

export function ShareableLink({ guideName }: ShareableLinkProps) {
  const [copied, setCopied] = React.useState(false)
  const [shareableUrl, setShareableUrl] = React.useState("")

  React.useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    setShareableUrl(`${baseUrl}/chat/external/${guideName}`)
  }, [guideName])

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

  return (
    <Card className="w-full bg-white transition-all duration-300 ease-in-out">
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-2 flex items-center">
          External Interview Link
          <StatusDot />
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Share this link with participants to start the interview. The link is unique and secure.
        </p>
        <div className="relative">
          <Input value={shareableUrl} readOnly className="bg-gray-100/50 pr-20" />
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 text-xs px-3"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}

