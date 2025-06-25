"use client"

import React, { useState, useEffect } from "react"
import { useSettings } from "@/lib/settings-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Copy, 
  ExternalLink, 
  Link, 
  MessageCircle, 
  Code, 
  Check
} from "lucide-react"

export default function ConnectTab() {
  const { currentModal, isSaving } = useSettings()
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  // Identity verification state
  const [verificationSecret, setVerificationSecret] = useState<string | null>(null)
  const [isSecretLoading, setIsSecretLoading] = useState(false)

  // Fetch secret on mount
  useEffect(() => {
    async function fetchSecret() {
      setIsSecretLoading(true)
      try {
        const res = await fetch('/api/verification-secret')
        const data = await res.json()
        if (res.ok) {
          setVerificationSecret(data.verificationSecret)
        }
      } catch (err) {
        console.error('Failed to fetch verification secret', err)
      } finally {
        setIsSecretLoading(false)
      }
    }
    fetchSecret()
  }, [])

  const regenerateSecret = async () => {
    setIsSecretLoading(true)
    try {
      const res = await fetch('/api/verification-secret', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setVerificationSecret(data.verificationSecret)
        copyToClipboard(data.verificationSecret, 'verification-secret')
      }
    } catch (err) {
      console.error('Failed to regenerate secret', err)
    } finally {
      setIsSecretLoading(false)
    }
  }

  if (!currentModal) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No modal selected</p>
      </div>
    )
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com'
  const embedUrl = `${baseUrl}/embed/${currentModal.embedSlug}`

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(itemId)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const bubbleScript = `<script>
  // Optional: Pass user identity for personalized feedback
  window.FrankoUser = {
    user_id: "user-123",
    user_hash: "hash-generated-on-server", 
    user_metadata: {
      name: "John Doe",
      email: "john@example.com",
      company: "Acme Inc"
    }
  };
</script>

<script>
  (function() {
    var s = document.createElement('script');
    s.src = '${baseUrl}/embed.js';
    s.setAttribute('data-modal-slug', '${currentModal.embedSlug}');
    s.setAttribute('data-mode', 'bubble');
    s.setAttribute('data-position', 'bottom-right');
    document.head.appendChild(s);
  })();
</script>`

  const customScript = `<!-- Optional: Pass user identity -->
<script>
  window.FrankoUser = {
    user_id: "user-123",
    user_hash: "hash-generated-on-server",
    user_metadata: {
      name: "John Doe", 
      email: "john@example.com"
    }
  };
</script>

<!-- Include the script -->
<script src="${baseUrl}/embed.js" 
        data-modal-slug="${currentModal.embedSlug}" 
        data-mode="manual"></script>

<!-- Your custom button -->
<button onclick="FrankoModal.open()">
  Get Help
</button>`

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-[#FAFAFA] dark:bg-gray-800">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold mb-2 text-gray-900">Connect Your Chat Modal</h2>
            <p className="text-sm text-slate-600">
              Choose how visitors will access your chat modal and get the embed code for your website.
            </p>
          </div>
          {isSaving && (
            <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Saving...
            </div>
          )}
        </div>
      </div>

      {/* Connection Options */}
      <div className="space-y-6 max-w-4xl">
        
        {/* Direct Link */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
                         <CardTitle className="text-lg font-semibold flex items-center">
               <div className="h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
                 <Link className="h-4 w-4 text-blue-600" />
               </div>
               Direct Link
             </CardTitle>
            <CardDescription>
              Perfect for email signatures or direct sharing. Opens in a new tab. No installation required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Shareable URL:</Label>
                <div className="flex gap-2">
                  <Input 
                    value={embedUrl} 
                    readOnly 
                    className="font-mono text-sm bg-gray-50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(embedUrl, 'direct-link')}
                  >
                    {copiedItem === 'direct-link' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(embedUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Floating Chat Bubble */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center">
              <div className="h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
                <MessageCircle className="h-4 w-4 text-blue-600" />
              </div>
              Floating Chat Bubble
              <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">Recommended</Badge>
            </CardTitle>
            <CardDescription>
              Best for websites where you want visitors to easily discover conversations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Embed Code:</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(bubbleScript, 'bubble-script')}
                  >
                    {copiedItem === 'bubble-script' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Textarea 
                  value={bubbleScript}
                  readOnly 
                  className="font-mono text-xs resize-none bg-gray-50"
                  rows={8}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Instructions:</h4>
                <p className="text-sm text-gray-700">
                  Paste this code before the closing &lt;/body&gt; tag on your website. The floating chat icon will appear automatically and visitors can click it to start conversations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Trigger */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center">
              <div className="h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
                <Code className="h-4 w-4 text-blue-600" />
              </div>
              Custom Trigger
            </CardTitle>
            <CardDescription>
              Full control over the trigger element and user experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Integration Code:</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(customScript, 'custom-script')}
                  >
                    {copiedItem === 'custom-script' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Textarea 
                  value={customScript}
                  readOnly 
                  className="font-mono text-xs resize-none bg-gray-50"
                  rows={8}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Instructions:</h4>
                <p className="text-sm text-gray-700">
                  Add the script to your page, then call FrankoModal.open() from any element. Perfect for existing buttons, navigation items, or programmatic control.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Identity Verification */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center">
              Identity verification (optional)
            </CardTitle>
            <CardDescription>
              Pass your signed-in user's ID to Franko for personalised feedback.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label className="text-sm font-medium">Secret key (server-side)</Label>
              <div className="flex gap-2">
                <Input value={verificationSecret || ''} readOnly placeholder={isSecretLoading ? 'Loading…' : ''} className="font-mono text-sm bg-gray-50" />
                <Button variant="outline" size="sm" disabled={!verificationSecret} onClick={() => verificationSecret && copyToClipboard(verificationSecret, 'verification-secret')}>
                  {copiedItem === 'verification-secret' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" disabled={isSecretLoading} onClick={regenerateSecret}>
                  Regenerate
                </Button>
              </div>

              <p className="text-xs text-gray-500">Use this secret to generate an HMAC of your user_id on your server. Include <code>user_id</code>, <code>user_hash</code>, and optional <code>user_metadata</code> in <code>window.FrankoUser</code> before the embed script.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 