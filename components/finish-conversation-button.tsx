/**
 * Finish Conversation Button
 * 
 * A button component that triggers the conversation finalization process.
 * Shows loading state during the process and handles navigation after completion.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface FinishConversationButtonProps {
  chatInstanceId: string;
  chatResponseId: string;
  onFinishStart?: () => void;
  onFinishComplete?: () => void;
  className?: string;
  isAutoFinish?: boolean;
  countdown?: number;
}

export function FinishConversationButton({
  chatInstanceId,
  chatResponseId,
  onFinishStart,
  onFinishComplete,
  className = '',
  isAutoFinish = false,
  countdown = 0
}: FinishConversationButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // This function should be named handleClick to avoid name conflicts
  const handleClick = async () => {
    try {
      // Show minimal loading state just for button click feedback
      setIsLoading(true);
      
      if (onFinishStart) {
        onFinishStart();
      }
      
      // Immediately redirect the user without waiting
      router.push(`/chat/external/${chatInstanceId}/finish`);
      
      // Fire and forget - trigger finalization in the background
      fetch('/api/external-chat/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatResponseId })
      }).then(() => {
        if (onFinishComplete) {
          onFinishComplete();
        }
      }).catch(error => {
        console.error('Background finalization error:', error);
      });
    } catch (error) {
      console.error('Error during redirection:', error);
      setError(error instanceof Error ? error.message : 'Failed to finish conversation');
      setIsLoading(false);
    }
  };
  
  // Render button with optional countdown
  return (
    <div className="flex flex-col items-center">
      {isAutoFinish && countdown > 0 && (
        <p className="mb-2 text-sm text-gray-500">
          Finishing conversation in {countdown} seconds...
        </p>
      )}
      
      <Button 
        onClick={handleClick} 
        disabled={isLoading}
        variant="ghost"
        size="sm"
        className={className || "flex items-center gap-2"}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isLoading ? 'Finishing...' : 'Finish Chat'}
      </Button>
      
      {error && (
        <p className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
} 