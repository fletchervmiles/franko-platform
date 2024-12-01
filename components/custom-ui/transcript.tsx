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
    // Add a marker at the start
    text = '###' + text.trim();
    
    // First, handle the timestamps to create proper breaks between messages
    text = text.replace(/\[(\d{2}:\d{2})\]/g, '**[$1]**\n\n');
    
    // Handle speaker names
    text = text.replace(/([A-Za-z]+):/g, '**$1:**');
    
    // Remove our marker
    return text.replace('###', '').trim();
  };

  return (
    <div className="w-full bg-white relative">
      <h2 className="text-sm font-semibold px-6 pt-4 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-[#f5a623]" />
        Full Transcript
      </h2>
      <div className="p-6 pt-4">
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="text-sm space-y-4">
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
                    return <span className="font-bold text-primary block mt-4">{text}</span>;
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