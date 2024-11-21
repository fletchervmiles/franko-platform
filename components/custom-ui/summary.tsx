'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import { LucideIcon } from 'lucide-react'

interface SummaryCardProps {
  title: string;
  content: string | null;
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
          <div className="text-sm space-y-4 markdown-content">
            <ReactMarkdown
              components={{
                strong: ({ children }) => <span className="font-semibold text-primary">{children}</span>,
                ul: ({ children }) => <ul className="list-disc pl-4 space-y-2">{children}</ul>,
                li: ({ children, ...props }) => {
                  const isTaskItem = props.className?.includes('task-list-item')
                  return (
                    <li className={isTaskItem ? 'list-none' : 'ml-2'}>
                      {children}
                    </li>
                  )
                },
                p: ({ children }) => <p className="mb-3">{children}</p>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-gray-200 pl-4 italic text-gray-600">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {content || 'Analysis not available yet'}
            </ReactMarkdown>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border"></div>
    </div>
  )
}