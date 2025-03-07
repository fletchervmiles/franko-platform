"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, Copy, Check, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

export default function ThankYouPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const [chatInstanceData, setChatInstanceData] = useState<{
    incentive_status?: boolean;
    incentive_code?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Trigger confetti when the component mounts and isn't loading
  useEffect(() => {
    if (!isLoading) {
      // Simple confetti effect
      confetti({
        particleCount: 150,  // Number of confetti particles
        spread: 70,          // How spread out the confetti is
        origin: { y: 0.6 },  // Start slightly below the top
        colors: ['#5F9EA0', '#FF69B4', '#FFFACD', '#FFD700', '#87CEFA'], // Pastel colors
      });
    }
  }, [isLoading]);

  // Fetch chat instance data
  useEffect(() => {
    async function fetchInstanceData() {
      try {
        const response = await fetch(`/api/chat-instances/${id}`);
        if (response.ok) {
          const data = await response.json();
          setChatInstanceData(data);
          console.log("Fetched chat instance data for thank you page:", {
            incentive_status: data.incentive_status,
            incentive_code: data.incentive_code,
            raw_data: data
          });
        } else {
          console.error("Failed to fetch chat instance data");
          setChatInstanceData({});
        }
      } catch (error) {
        console.error("Error fetching chat instance:", error);
        setChatInstanceData({});
      } finally {
        setIsLoading(false);
      }
    }

    fetchInstanceData();
  }, [id]);

  // Handle copy to clipboard
  const copyToClipboard = () => {
    if (chatInstanceData?.incentive_code) {
      navigator.clipboard.writeText(chatInstanceData.incentive_code);
      setCopied(true);
      
      // Trigger a small confetti burst when copying
      confetti({
        particleCount: 80,
        spread: 50,
        origin: { x: 0.8, y: 0.6 }, // Near the copy button
        colors: ['#FFD700', '#FFA500', '#FF6347'], // Gold, orange, tomato
      });
      
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 bg-white shadow-lg">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Thank you!</h1>
            <p className="text-gray-600">
              Your time is greatly appreciated!
            </p>
          </div>

          {chatInstanceData?.incentive_status && chatInstanceData?.incentive_code && (
            <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-2">
                <code className="bg-white px-3 py-2 rounded border border-gray-200 flex-1 text-center">
                  {chatInstanceData.incentive_code}
                </code>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyToClipboard}
                  className="flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          <div className="text-center text-sm text-gray-400 mt-8">
            powered by franko.ai
          </div>
        </div>
      </Card>
    </div>
  );
}