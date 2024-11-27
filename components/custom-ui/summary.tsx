'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { type LucideIcon, ChevronDown, ChevronUp } from 'lucide-react'

interface SummaryCardProps {
  title: string;
  content: string | null;
  icon: LucideIcon;
  isDefaultOpen?: boolean;
}

export default function SummaryCard({ title, content, icon: Icon, isDefaultOpen = false }: SummaryCardProps) {
  const [isOpen, setIsOpen] = useState(isDefaultOpen)

  return (
    <div className="w-full bg-white relative border-b">
      <div 
        className="flex items-center justify-between gap-2 px-6 py-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-black">{title}</h2>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-blue-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-blue-600" />
        )}
      </div>
      {isOpen && (
        <div className="p-6 pt-2">
          <div className="rounded-lg bg-gray-50 p-4">
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
      )}
    </div>
  )
}