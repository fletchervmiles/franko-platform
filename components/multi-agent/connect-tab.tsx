"use client"

import { useState } from "react"
import { useSettings } from "@/lib/settings-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check, ExternalLink, Code, Settings, Link, MessageCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export function ConnectTab() {
  const { currentModal } = useSettings()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  if (!currentModal) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 bg-[#FAFAFA] dark:bg-gray-800">
        <div className="text-center py-8">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Modal Selected</h3>
          <p className="text-muted-foreground">
            Please select or create a modal to view embed code.
          </p>
        </div>
      </div>
    )
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(type)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const embedUrl = `${window.location.origin}/embed/${currentModal.embedSlug}`
  
  const autoEmbedCode = `<!-- Franko Chat Widget - Auto Bubble -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/embed.js';
    script.setAttribute('data-slug', '${currentModal.embedSlug}');
    script.setAttribute('data-mode', 'bubble');
    document.head.appendChild(script);
  })();
</script>`

  const manualEmbedCode = `<!-- Franko Chat Widget - Manual Trigger -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/embed.js';
    script.setAttribute('data-slug', '${currentModal.embedSlug}');
    script.setAttribute('data-mode', 'manual');
    document.head.appendChild(script);
  })();
</script>

<!-- Add this button anywhere on your page -->
<button onclick="FrankoChat.open()">Give Feedback</button>`

  const reactEmbedCode = `// React Component Example
import { useEffect } from 'react';

export function FeedbackWidget() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '${window.location.origin}/embed.js';
    script.setAttribute('data-slug', '${currentModal.embedSlug}');
    script.setAttribute('data-mode', 'bubble');
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
      const existingScript = document.querySelector('script[data-slug="${currentModal.embedSlug}"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return null; // Widget is injected via script
}`

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-[#FAFAFA] dark:bg-gray-800">
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2 text-gray-900">Connect Your Widget</h2>
        <p className="text-sm text-slate-600">
          Add your chat widget to any website with these embed codes.
        </p>
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
                    {copiedCode === 'direct-link' ? (
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

        {/* Auto Bubble */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center">
              <div className="h-8 w-8 bg-green-50 rounded-full flex items-center justify-center mr-3">
                <MessageCircle className="h-4 w-4 text-green-600" />
              </div>
              Floating Chat Bubble
              <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">Recommended</Badge>
            </CardTitle>
            <CardDescription>
              Automatically shows a floating chat bubble in the bottom-right corner of your website. Visitors can click it to start a conversation.
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
                    onClick={() => copyToClipboard(autoEmbedCode, 'auto')}
                  >
                    {copiedCode === 'auto' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Textarea 
                  value={autoEmbedCode}
                  readOnly 
                  className="font-mono text-xs resize-none bg-gray-50"
                  rows={8}
                />
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="text-sm font-medium text-green-900 mb-2">Instructions:</h4>
                <p className="text-sm text-green-800">
                  Add this code to your website's &lt;head&gt; section or before the closing &lt;/body&gt; tag. The floating chat icon will appear automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Trigger */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center">
              <div className="h-8 w-8 bg-purple-50 rounded-full flex items-center justify-center mr-3">
                <Code className="h-4 w-4 text-purple-600" />
              </div>
              Custom Trigger
            </CardTitle>
            <CardDescription>
              Add custom buttons or links anywhere on your site to open the chat widget. Perfect for "Feedback" buttons in your navigation or footer.
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
                    onClick={() => copyToClipboard(manualEmbedCode, 'manual')}
                  >
                    {copiedCode === 'manual' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Textarea 
                  value={manualEmbedCode}
                  readOnly 
                  className="font-mono text-xs resize-none bg-gray-50"
                  rows={10}
                />
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="text-sm font-medium text-purple-900 mb-2">Instructions:</h4>
                <p className="text-sm text-purple-800">
                  Add the script to your page, then call FrankoChat.open() from any element. Perfect for existing buttons, navigation items, or programmatic control.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 