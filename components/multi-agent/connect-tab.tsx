"use client"

import { useState } from "react"
import { useSettings } from "@/lib/settings-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check, ExternalLink, Code, Settings } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold mb-2 text-gray-900">Connect Your Widget</h2>
            <p className="text-sm text-slate-600">
              Add your chat widget to any website with these embed codes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {currentModal.embedSlug}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(embedUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Test Widget
            </Button>
          </div>
        </div>
      </div>

      {/* Widget Status */}
      <Alert className="mb-6">
        <Code className="h-4 w-4" />
        <AlertDescription>
          <strong>Widget URL:</strong> <code className="bg-muted px-1 py-0.5 rounded text-sm ml-1">{embedUrl}</code>
        </AlertDescription>
      </Alert>

      {/* Embed Options */}
      <Tabs defaultValue="auto" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="auto">Auto Bubble</TabsTrigger>
          <TabsTrigger value="manual">Manual Trigger</TabsTrigger>
          <TabsTrigger value="react">React/Next.js</TabsTrigger>
        </TabsList>

        <TabsContent value="auto" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                Auto Bubble Mode
              </CardTitle>
              <CardDescription>
                Automatically shows a floating chat bubble in the bottom-right corner of your website.
                Visitors can click it to start a conversation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{autoEmbedCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(autoEmbedCode, 'auto')}
                  >
                    {copiedCode === 'auto' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add this code to your website's <code>&lt;head&gt;</code> section or before the closing <code>&lt;/body&gt;</code> tag.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                Manual Trigger Mode
              </CardTitle>
              <CardDescription>
                Add custom buttons or links anywhere on your site to open the chat widget.
                Perfect for "Feedback" buttons in your navigation or footer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{manualEmbedCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(manualEmbedCode, 'manual')}
                  >
                    {copiedCode === 'manual' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Custom Trigger Examples:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• <code>onclick="FrankoChat.open()"</code> - Open widget</li>
                    <li>• <code>onclick="FrankoChat.close()"</code> - Close widget</li>
                    <li>• <code>onclick="FrankoChat.toggle()"</code> - Toggle widget</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="react" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                React/Next.js Integration
              </CardTitle>
              <CardDescription>
                For React applications, use this component-based approach for better integration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{reactEmbedCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(reactEmbedCode, 'react')}
                  >
                    {copiedCode === 'react' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Usage:</h4>
                  <pre className="text-sm text-muted-foreground">
{`// In your app or layout component
import { FeedbackWidget } from './components/FeedbackWidget';

export default function App() {
  return (
    <div>
      {/* Your app content */}
      <FeedbackWidget />
    </div>
  );
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 