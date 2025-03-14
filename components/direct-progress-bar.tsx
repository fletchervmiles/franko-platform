/**
 * Direct Progress Bar Component
 * 
 * This client component displays progress by directly parsing the AI responses:
 * 1. Extracts objective data attached to messages or from JSON in content
 * 2. Maps objective statuses to progress bar states
 * 3. Updates automatically when new messages are received
 * 4. Maintains state across responses with parsing errors
 * 
 * This component provides visual feedback without requiring API calls or database lookups.
 */

"use client"

import { ProgressBar, type Step } from "./progress-bar"
import { useState, useEffect, useMemo } from "react"
import { Message } from "ai"
import React from "react"

// Extended interface to include objectives that might be attached by our API
interface ExtendedMessage extends Message {
  objectives?: Record<string, { status: string, count?: number, target?: number, guidance?: string }> | null;
}

interface DirectProgressBarProps {
  messages: Message[] | ExtendedMessage[]  // Accept either type for backward compatibility
}

export const DirectProgressBar = React.memo(function DirectProgressBar({ 
  messages 
}: DirectProgressBarProps) {
  // State to track parsed objectives
  const [objectives, setObjectives] = useState<Record<string, { status: string, count?: number, target?: number, guidance?: string }> | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Effect to parse objectives from messages
  useEffect(() => {
    if (messages.length === 0) return;
    
    // Only process assistant messages
    const assistantMessages = messages.filter(m => m.role === 'assistant') as ExtendedMessage[];
    if (assistantMessages.length === 0) return;
    
    // Get the latest assistant message
    const lastMessage = assistantMessages[assistantMessages.length - 1];
    
    setIsUpdating(true);
    try {
      // First, check if objectives are directly attached to the message (Option 1)
      if (lastMessage.objectives) {
        console.log('Using objectives directly from message:', lastMessage.objectives);
        setObjectives(lastMessage.objectives);
      } 
      // If not, try parsing from the content (Option 2) 
      else {
        const content = lastMessage.content.toString();
        
        // Try different parsing strategies
        
        // Strategy 1: Look for JSON block
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.currentObjectives) {
            console.log('Parsed objectives from content JSON block:', parsed.currentObjectives);
            setObjectives(parsed.currentObjectives);
          }
        } 
        // Strategy 2: Try parsing the entire content as JSON
        else {
          try {
            const parsed = JSON.parse(content);
            if (parsed.currentObjectives) {
              console.log('Parsed objectives from entire content:', parsed.currentObjectives);
              setObjectives(parsed.currentObjectives);
            }
          } catch (e) {
            // Not valid JSON, ignore
            console.log('Content is not valid JSON, could not parse objectives');
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse objectives:', error);
      // Don't update state on error - maintain previous state
    } finally {
      // Add small delay for better UX
      setTimeout(() => setIsUpdating(false), 300);
    }
  }, [messages]);

  // Convert objectives to steps for the progress bar
  const steps = useMemo(() => {
    if (!objectives) return [];
    
    console.log('Converting objectives to steps:', objectives);
    
    return Object.entries(objectives)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, obj]) => {
        console.log(`Objective ${key} status:`, obj.status);
        return {
          label: "", // No label as requested
          status: obj.status === "done" ? "completed" 
                : obj.status === "current" ? "in-review"
                : "pending"
        };
      }) as Step[];
  }, [objectives]);

  // Only render if we have steps
  if (steps.length === 0) {
    console.log('No steps to render, hiding progress bar');
    return null;
  }
  
  console.log('Rendering progress bar with steps:', steps);
  return (
    <ProgressBar
      steps={steps}
      className="max-w-none"
      isUpdating={isUpdating}
    />
  );
}); 