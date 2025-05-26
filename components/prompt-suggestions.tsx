"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface PromptSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export function PromptSuggestions({ suggestions, onSuggestionClick }: PromptSuggestionsProps) {
  return (
    <div className="py-8 mx-auto max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {suggestions.map((suggestion, index) => (
          <Card 
            key={index} 
            className={cn(
              "cursor-pointer hover:shadow-lg transition-shadow duration-200 ease-in-out bg-[#fafafa]"
            )}
            onClick={() => onSuggestionClick(suggestion)}
          >
            <CardContent className="p-4">
              <p className="text-sm text-foreground">{suggestion}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 