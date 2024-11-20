'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import { LucideIcon } from 'lucide-react'

interface SummaryCardProps {
  title: string;
  content: string;
  icon: LucideIcon;
}

export default function SummaryCard({ title, content, icon: Icon }: SummaryCardProps) {
  return (
    <div className="w-full bg-white relative">
      <div className="flex items-center gap-2 px-6 pt-4">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      </div>
      <div className="p-6 pt-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="text-sm space-y-4">
            <ReactMarkdown
              components={{
                strong: ({ children }) => <span className="font-semibold text-primary">{children}</span>,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border"></div>
    </div>
  )
}