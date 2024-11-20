'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'

const placeholderTranscript = `**Amelia:** Hi there! I'm Amelia. How can I help you today? **[00:00]**

**User:** I've been having some issues with my subscription. **[00:05]**

**Amelia:** I'm sorry to hear that. Could you tell me more about what specific issues you're experiencing? **[00:10]**

**User:** Well, the main thing is that I can't seem to access my account settings. **[00:15]**

**Amelia:** Thank you for letting me know. I'll help you get that sorted out right away. Could you confirm if you're trying to access this through the website or the mobile app? **[00:20]**

**Amelia:** Hi there! I'm Amelia. How can I help you today? **[00:00]**

**User:** I've been having some issues with my subscription. **[00:05]**

**Amelia:** I'm sorry to hear that. Could you tell me more about what specific issues you're experiencing? **[00:10]**

**User:** Well, the main thing is that I can't seem to access my account settings. **[00:15]**

**Amelia:** Thank you for letting me know. I'll help you get that sorted out right away. Could you confirm if you're trying to access this through the website or the mobile app? **[00:20]**
**Amelia:** Hi there! I'm Amelia. How can I help you today? **[00:00]**

**User:** I've been having some issues with my subscription. **[00:05]**

**Amelia:** I'm sorry to hear that. Could you tell me more about what specific issues you're experiencing? **[00:10]**

**User:** Well, the main thing is that I can't seem to access my account settings. **[00:15]**

**Amelia:** Thank you for letting me know. I'll help you get that sorted out right away. Could you confirm if you're trying to access this through the website or the mobile app? **[00:20]**
**Amelia:** Hi there! I'm Amelia. How can I help you today? **[00:00]**

**User:** I've been having some issues with my subscription. **[00:05]**

**Amelia:** I'm sorry to hear that. Could you tell me more about what specific issues you're experiencing? **[00:10]**

**User:** Well, the main thing is that I can't seem to access my account settings. **[00:15]**

**Amelia:** Thank you for letting me know. I'll help you get that sorted out right away. Could you confirm if you're trying to access this through the website or the mobile app? **[00:20]**`

export default function FullTranscript({ transcript }: { transcript: string }) {
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
              {placeholderTranscript}
            </ReactMarkdown>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border"></div>
    </div>
  )
}