'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import { MessageSquare } from 'lucide-react'

interface TranscriptProps {
  conversationHistory: string | null;
}

export default function FullTranscript({ conversationHistory }: TranscriptProps) {
  if (!conversationHistory) {
    return (
      <div className="w-full bg-white relative">
        <h2 className="text-sm font-semibold px-6 pt-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#f5a623]" />
          Full Transcript
        </h2>
        <div className="p-6 pt-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="text-sm text-muted-foreground">
              Transcript not available yet
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-border"></div>
      </div>
    )
  }

  // Function to format the transcript text
  const formatTranscript = (text: string) => {
    // First, clean up any potential leading/trailing whitespace
    text = text.trim();
    
    // Add line breaks after timestamps
    text = text.replace(/\*\*\[\d{2}:\d{2}\]\*\*/g, match => `${match}\n\n`);
    
    // Split into lines and process
    const lines = text.split('\n');
    
    // Process each line
    const formattedLines = lines.map(line => {
      line = line.trim();
      
      // Format speaker names
      return line.replace(/([A-Za-z]+):/, '**$1:**');
    });
    
    // Join lines with proper spacing
    return formattedLines.reduce<string>((acc: string, line: string, index: number): string => {
      // First line
      if (index === 0) return line;
      
      // If this line starts with a speaker name
      if (line.match(/^\*\*[A-Za-z]+:\*\*/)) {
        return `${acc}\n\n${line}`;
      }
      
      // If previous line had a speaker name, add single line break
      if (acc.match(/\*\*[A-Za-z]+:\*\*$/)) {
        return `${acc}\n${line}`;
      }
      
      // Otherwise just add a space
      return `${acc} ${line}`;
    }, '');
  };

  return (
    <div className="w-full bg-white relative">
      <h2 className="text-sm font-semibold px-6 pt-4 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-[#f5a623]" />
        Full Transcript
      </h2>
      <div className="p-6 pt-4">
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="text-sm">
            <ReactMarkdown
              components={{
                strong: ({ children }) => {
                  if (!Array.isArray(children) || typeof children[0] !== 'string') {
                    return <strong>{children}</strong>;
                  }

                  const text = children[0].trim();
                  
                  // Handle timestamps
                  if (text.match(/^\[\d{2}:\d{2}\]$/)) {
                    return <span className="text-muted-foreground text-xs ml-2">{text}</span>;
                  }
                  
                  // Handle speaker names
                  if (text.endsWith(':')) {
                    return <span className="font-bold text-primary">{text}</span>;
                  }

                  return <strong>{children}</strong>;
                },
                p: ({ children }) => {
                  return <p className="leading-relaxed mb-2">{children}</p>;
                }
              }}
            >
              {formatTranscript(conversationHistory)}
            </ReactMarkdown>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border"></div>
    </div>
  );
}