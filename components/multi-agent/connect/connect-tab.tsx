"use client"

import React, { useState, useEffect } from "react"
import { useSettings } from "@/lib/settings-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Copy, 
  ExternalLink, 
  Link, 
  MessageCircle, 
  Code, 
  Check,
  ShieldCheck
} from "lucide-react"

type ConnectionOption = 'direct-link' | 'floating-bubble' | 'custom-trigger'

export default function ConnectTab() {
  const { currentModal, isSaving, updateModal } = useSettings()
  const [copiedItem, setCopiedItem] = useState<string | null>(null)
  const [selectedOption, setSelectedOption] = useState<ConnectionOption>('floating-bubble')

  // Identity verification no longer requires a secret / HMAC.

  if (!currentModal) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No modal selected</p>
      </div>
    )
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com'
  const embedUrl = `${baseUrl}/embed/${currentModal.embedSlug}`

  // Calculate effective colors using the same logic as widget-preview
  const brandSettings = currentModal.brandSettings?.interface || {}
  const currentTheme = brandSettings.theme || 'light'
  const themeDefaults = {
    light: { chatIconColor: "#000000" },
    dark: { chatIconColor: "#ffffff" }
  }
  
  const effectiveChatIconColor = brandSettings.advancedColors
    ? (brandSettings.chatIconColor || themeDefaults[currentTheme].chatIconColor)
    : (brandSettings.primaryBrandColor || themeDefaults[currentTheme].chatIconColor)

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
(function(){if(!window.FrankoModal){window.FrankoModal=(...a)=>{window.FrankoModal.q=window.FrankoModal.q||[];window.FrankoModal.q.push(a)};window.FrankoModal=new Proxy(window.FrankoModal,{get:(t,p)=>p==="q"?t.q:(...a)=>t(p,...a)})}const l=()=>{const s=document.createElement("script");s.src="${baseUrl}/embed.js";s.setAttribute("data-modal-slug","${currentModal.embedSlug}");s.setAttribute("data-mode","bubble");s.setAttribute("data-position","bottom-right");s.setAttribute("data-bubble-text","${brandSettings.chatIconText || 'Feedback'}");s.setAttribute("data-bubble-color","#BFBFBF");s.onload=()=>{if(window.FrankoModal.q){window.FrankoModal.q.forEach(([m,...a])=>window.FrankoModal[m]&&window.FrankoModal[m](...a));window.FrankoModal.q=[]}};document.head.appendChild(s)};document.readyState==="complete"?l():addEventListener("load",l)})();
</script>`

  const customScript = `<script>
(function(){if(!window.FrankoModal){window.FrankoModal=(...a)=>{window.FrankoModal.q=window.FrankoModal.q||[];window.FrankoModal.q.push(a)};window.FrankoModal=new Proxy(window.FrankoModal,{get:(t,p)=>p==="q"?t.q:(...a)=>t(p,...a)})}const l=()=>{const s=document.createElement("script");s.src="${baseUrl}/embed.js";s.setAttribute("data-modal-slug","${currentModal.embedSlug}");s.setAttribute("data-mode","manual");s.onload=()=>{if(window.FrankoModal.q){window.FrankoModal.q.forEach(([m,...a])=>window.FrankoModal[m]&&window.FrankoModal[m](...a));window.FrankoModal.q=[]}};document.head.appendChild(s)};document.readyState==="complete"?l():addEventListener("load",l)})();
</script>`

  // Snippet users add *before* the embed script when using identity verification
  const identitySnippet = `<script>
window.FrankoUser = {
  user_id: "USER_ID",
  user_metadata: {
    name: "John Doe",
    email: "john@example.com"
  }
}
</script>`

  const options = [
    {
      id: 'direct-link' as ConnectionOption,
      title: 'Direct Link',
      description: 'Perfect for email signatures and email sequences or direct sharing.',
      icon: Link,
    },
    {
      id: 'floating-bubble' as ConnectionOption,
      title: 'Embed a Chat Bubble',
      description: 'Embed modal as a floating chat bubble on your website.',
      icon: MessageCircle,
      recommended: true,
    },
    {
      id: 'custom-trigger' as ConnectionOption,
      title: 'Custom Trigger',
      description: 'Create your own button (i.e. Feedback) that opens the modal.',
      icon: Code,
    },
  ]

  const renderDirectLinkContent = () => (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Instructions:</Label>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Shareable Link:</Label>
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

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div>
          <Label className="text-sm font-medium">Ask for name & email</Label>
          <p className="text-xs text-gray-500">Require users to provide their details before starting a chat. Helpful for identifying and contacting users who give feedback.
          </p>
        </div>
        <Switch 
          checked={currentModal.askNameEmailOnDirectLink || false}
          onCheckedChange={(checked) => updateModal({ askNameEmailOnDirectLink: checked })}
          className="data-[state=checked]:bg-[#E4F222] scale-75"
        />
      </div>
    </div>
  )

  const renderFloatingBubbleContent = () => (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Instructions:</Label>
      <p className="text-sm text-gray-700">
        Paste this script immediately before the closing <code>&lt;/body&gt;</code> tag on pages where you want the chat bubble. It docks to the bottom-left or bottom-right (configured under the Interface tab). Modal opens when clicked.
      </p>

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

      <p className="text-xs text-gray-500">
        <a href="https://franko.mintlify.app/chat-bubble" target="_blank" className="underline">See docs</a>
      </p>
    </div>
  )

  const renderCustomTriggerContent = () => (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Instructions:</Label>
      <p className="text-sm text-gray-700">
        Paste this script just before the closing <code>&lt;/body&gt;</code> tag. To trigger the modal from your own buttons or links (like custom feedback buttons or nav items), call <code>FrankoModal.open('${currentModal.embedSlug}')</code> from the element.
      </p>

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

      <p className="text-xs text-gray-500">
        <a href="https://franko.mintlify.app/custom-trigger" target="_blank" className="underline">See docs</a>
      </p>
    </div>
  )

  const renderIdentityVerification = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-gray-600" />
        <Label className="text-sm font-medium">Identity verification (optional)</Label>
      </div>
      <p className="text-xs text-gray-600">
        Link feedback to signed-in users in your dashboard. Add the optional snippet before your embed code to see who's giving feedback. If the snippet is missing, users appear as "Anonymous".
      </p>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Identity snippet (optional):</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(identitySnippet, 'identity-snippet')}
          >
            {copiedItem === 'identity-snippet' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <Textarea
          value={identitySnippet}
          readOnly
          className="font-mono text-xs resize-none bg-gray-50"
          rows={7}
        />

        <p className="text-xs text-gray-500">
          Need more detail? <a href="https://franko.mintlify.app/identity-verification" target="_blank" className="underline">Identity Verification guide&nbsp;↗</a>
        </p>
      </div>
    </div>
  )

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-[#FAFAFA] dark:bg-gray-800">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold mb-2 text-gray-900">Connect Your Modal</h2>
          </div>
          {isSaving && (
            <div className="flex items-center gap-2 text-[#1C1617] text-sm font-medium">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#E4F222] border-t-transparent"></div>
              Saving...
            </div>
          )}
        </div>
      </div>

      {/* Option Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {options.map((option) => {
          const IconComponent = option.icon
          const isSelected = selectedOption === option.id
          return (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all border ${
                isSelected
                  ? 'border-[#E4F222] bg-[#FAFFD9]'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => setSelectedOption(option.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-[#F5FF78] rounded-full flex items-center justify-center mr-3">
                      <IconComponent className="h-3 w-3 text-[#1C1617]" />
                    </div>
                    <CardTitle className="text-base font-medium">{option.title}</CardTitle>
                  </div>
                  {option.recommended && (
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                      Recommended
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm">
                  {option.description}
                </CardDescription>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      {/* Content Area */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          {selectedOption === 'direct-link' && renderDirectLinkContent()}
          {selectedOption === 'floating-bubble' && renderFloatingBubbleContent()}
          {selectedOption === 'custom-trigger' && renderCustomTriggerContent()}
        </CardContent>
      </Card>

      {/* Identity Verification (separate card) */}
      {(selectedOption === 'floating-bubble' || selectedOption === 'custom-trigger') && (
        <Card className="border shadow-sm mt-6">
          <CardContent className="p-6">
            {renderIdentityVerification()}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 