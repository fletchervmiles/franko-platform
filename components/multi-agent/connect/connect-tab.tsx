"use client"

import React, { useState } from "react"
import { useSettings } from "@/lib/settings-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WidgetPreview } from "../agents/widget-preview"
import { agentsData } from "@/lib/agents-data"

export default function ConnectTab() {
  const { currentModal, settings, isSaving } = useSettings()
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

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
  (function() {
    var s = document.createElement('script');
    s.src = '${baseUrl}/embed.js';
    s.setAttribute('data-modal-slug', '${currentModal.embedSlug}');
    s.setAttribute('data-mode', 'bubble');
    s.setAttribute('data-position', 'bottom-right');
    document.head.appendChild(s);
  })();
</script>`

  const customScript = `<!-- Include the script -->
<script src="${baseUrl}/embed.js" 
        data-modal-slug="${currentModal.embedSlug}" 
        data-mode="manual"></script>

<!-- Your custom button -->
<button onclick="FrankoModal.open()">
  Get Help
</button>`

  const enabledAgents = settings.agents.enabledAgents
  const activeAgents = agentsData.filter((agent) => enabledAgents[agent.id])

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-[#FAFAFA] dark:bg-gray-800">
      {/* Full-width Header */}
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

      {/* Two-column content below the header */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column - Connection Options */}
        <div className="space-y-6">
          
          {/* Option 1: Shareable Link */}
          <Card className="p-4 bg-white">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Link className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium">Direct Link</h3>
                  <p className="text-sm text-muted-foreground mt-1">Perfect for email signatures or direct sharing. Opens in a new tab. No installation required.</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Shareable URL:</Label>
                <div className="flex gap-2">
                  <Input 
                    value={embedUrl} 
                    readOnly 
                    className="font-mono text-sm"
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
          </Card>

          {/* Option 2: Auto-Bubble Widget */}
          <Card className="p-4 border-primary/20 bg-white">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">Floating Chat Bubble</h3>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Recommended</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Best for websites where you want visitors to easily discover conversations.</p>
                </div>
              </div>
              
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
                  className="font-mono text-xs resize-none"
                  rows={8}
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Instructions:</h4>
                <p className="text-sm text-muted-foreground">
                  Paste this code before the closing &lt;/body&gt; tag on your website. The floating chat icon will appear automatically and visitors can click it to start conversations.
                </p>
              </div>
            </div>
          </Card>

          {/* Option 3: Custom Button Integration */}
          <Card className="p-4 bg-white">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Code className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium">Custom Trigger</h3>
                  <p className="text-sm text-muted-foreground mt-1">Full control over the trigger element and user experience.</p>
                </div>
              </div>
              
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
                  className="font-mono text-xs resize-none"
                  rows={8}
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Instructions:</h4>
                <p className="text-sm text-muted-foreground">
                  Add the script to your page, then call FrankoModal.open() from any element. Perfect for existing buttons, navigation items, or programmatic control.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Live Widget Preview */}
        <div className="hidden md:block">
          <WidgetPreview
            activeAgents={activeAgents}
            displayName={settings.interface.displayName}
            instructions={settings.interface.instructions}
            themeOverride={settings.interface.theme}
            primaryBrandColor={settings.interface.primaryBrandColor}
            advancedColors={settings.interface.advancedColors}
            chatIconText={settings.interface.chatIconText}
            chatIconColor={settings.interface.chatIconColor}
            alignChatBubble={settings.interface.alignChatBubble}
          />
        </div>
      </div>
    </div>
  )
}
