'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'

interface TranscriptProps {
  conversationHistory: string | null;
}

export default function FullTranscript({ conversationHistory }: TranscriptProps) {
  if (!conversationHistory) {
    return (
      <div className="w-full bg-white relative">
        <h2 className="text-sm font-semibold px-6 pt-4">Full Transcript</h2>
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

  return (
    <div className="w-full bg-white relative">
      <h2 className="text-sm font-semibold px-6 pt-4">Full Transcript</h2>
      <div className="p-6 pt-4">
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="text-sm space-y-4">
            <ReactMarkdown
              components={{
                strong: ({ children }) => {
                  if (Array.isArray(children) && typeof children[0] === 'string' && children[0].includes('[')) {
                    return <span className="text-muted-foreground text-xs">{children}</span>
                  }
                  return <strong>{children}</strong>
                }
              }}
            >
              {conversationHistory}
            </ReactMarkdown>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border"></div>
    </div>
  )
}