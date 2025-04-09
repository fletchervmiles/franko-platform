"use client"

import * as React from "react"
import { Copy, Check, Link as LinkIcon } from "lucide-react"
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
    const baseUrl = "https://franko.ai"
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
    <Card className="rounded-[6px] border shadow-sm overflow-hidden bg-[#FAFAFA]">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="w-full md:max-w-[70%]">
            <h2 className="text-2xl font-semibold mb-2 flex items-center">
              Shareable Conversation Link
              <StatusDot />
            </h2>
            <p className="text-sm text-gray-500">
              Share this secure link to invite your participants and customers to your conversation.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-md border border-gray-100 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
              <LinkIcon className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500">This link will remain active until you delete the conversation or run out of credits.</p>
          </div>
          
          <div className="relative">
            <Input 
              value={shareableUrl} 
              readOnly 
              className="bg-gray-50 pr-20 font-mono text-sm" 
            />
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 text-xs px-3 bg-white"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

