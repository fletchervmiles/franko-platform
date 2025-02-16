"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, User, FileText, Mail, BarChart } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"

interface ResponseCardProps {
  name: string
  email: string
  summary: string
  transcript: string
  isLast: boolean
  completionDate: string
  customerWords: number
  completionRate: number
}

export function ResponseCard({
  name,
  email,
  summary,
  transcript,
  isLast,
  completionDate,
  customerWords,
  completionRate,
}: ResponseCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullSummary, setIsFullSummary] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const formattedDate = format(new Date(completionDate), "MMM d, yyyy")

  const summaryPreview = summary.split("\n").slice(0, 3).join("\n")

  const highlightSearchTerm = (text: string) => {
    if (!searchTerm) return text
    const parts = text.split(new RegExp(`(${searchTerm})`, "gi"))
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200">
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  return (
    <div className={`${!isLast ? "border-b" : ""}`}>
      <div
        className={`flex items-center p-6 hover:bg-gray-100 cursor-pointer ${isOpen ? "bg-gray-100" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between flex-1 gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <User className="h-5 w-5 text-blue-600 hidden sm:inline-block" />
            <h3 className="text-sm font-semibold truncate">{name}</h3>
          </div>
          <div className="flex-shrink-0 text-center">
            <span className="bg-green-50 px-1.5 py-0.5 rounded text-green-600 text-sm">
              +{customerWords.toLocaleString()} Words
            </span>
          </div>
          <div className="flex-shrink-0">
            <span className="text-sm text-gray-900">{formattedDate}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="p-0 text-blue-600 ml-4">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      {isOpen && (
        <div className="p-6 bg-white space-y-4">
          <div className="block sm:hidden mb-4">
            <h3 className="text-lg font-semibold">{name}</h3>
          </div>
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
            <div className="space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{email}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Completion Rate:</span>
              <Progress value={completionRate} className="w-20" />
              <span className="text-sm font-medium">{completionRate}%</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center text-gray-900">
              <FileText className="w-4 h-4 mr-1 text-blue-600" />
              <span>Summary</span>
            </h4>
            <div className="text-sm bg-white border border-gray-200 p-4 rounded prose max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2 text-black" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-lg font-semibold mb-2 text-black" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-sm font-extrabold mb-1 text-black" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-2 text-gray-900" {...props} />,
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc pl-4 mb-2 marker:text-black text-gray-800" {...props} />
                  ),
                  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-bold text-black">{props.children}</strong>,
                  em: ({ node, ...props }) => <em className="italic text-gray-800" {...props} />,
                }}
              >
                {isFullSummary ? summary : summaryPreview}
              </ReactMarkdown>
              {summary.split("\n").length > 3 && (
                <Button
                  variant="link"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsFullSummary(!isFullSummary)
                  }}
                  className="mt-2 p-0 h-auto font-normal text-blue-600"
                >
                  {isFullSummary ? "Read less" : "Read more"}
                </Button>
              )}
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                View Transcript
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Conversation Transcript</DialogTitle>
                <DialogDescription>Full transcript of the conversation with {name}</DialogDescription>
              </DialogHeader>
              <Input
                type="search"
                placeholder="Search transcript..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="my-4"
              />
              <div className="space-y-4">
                {transcript.split("\n\n").map((block, index) => {
                  const [speaker, ...content] = block.split(": ")
                  return (
                    <div key={index} className={`p-3 rounded ${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
                      <strong className="text-blue-600">{speaker}:</strong>
                      <p>{highlightSearchTerm(content.join(": "))}</p>
                    </div>
                  )
                })}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}

