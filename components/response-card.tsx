"use client"

import React, { useState, useCallback, useMemo } from "react"
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
  customerWords: number // This now comes from user_words in DB, not calculated
  completionRate: number
  agentName?: string // Added for global responses view
  modalName?: string | null // Added for global responses view
}

// Interface for the JSON summary structure
interface JsonSummary {
  execSummary: string
  storyArc: Array<{
    label: string
    insight: string
    quote: string
    signal: "high" | "medium" | "low"
  }>
  sentiment: {
    value: "positive" | "neutral" | "negative" | null
    snippet: string | null
  }
  featureSignals: string[] | null
  evaluation: {
    strength: "high" | "medium" | "low"
    comment: string
  }
}

// Function to convert JSON summary to markdown
function convertJsonSummaryToMarkdown(summary: JsonSummary): string {
  let markdown = `### Snapshot\n${summary.execSummary}\n\n---\n\n`;
  
  // Add story arc items
  summary.storyArc.forEach(item => {
    markdown += `**${item.label}**\n${item.insight}\n*"${item.quote}"*\n\n`;
  });
  
  // Add sentiment
  const sentimentValue = summary.sentiment.value ? 
    summary.sentiment.value.charAt(0).toUpperCase() + summary.sentiment.value.slice(1) : 
    'Unknown';
  markdown += `**Sentiment**\n${sentimentValue}\n\n`;
  
  // Add evaluation
  const strengthValue = summary.evaluation.strength.charAt(0).toUpperCase() + summary.evaluation.strength.slice(1);
  markdown += `**Evaluation**\n${strengthValue} strength - ${summary.evaluation.comment}`;
  
  return markdown;
}

// Memoized ReactMarkdown component with custom styling
const MarkdownRenderer = React.memo(function MarkdownRenderer({ content }: { content: string }) {
  return (
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
      {content}
    </ReactMarkdown>
  );
});

// Memoized card header component
const CardHeader = React.memo(function CardHeader({
  name,
  agentName,
  customerWords,
  formattedDate,
  isOpen,
  toggleOpen
}: {
  name: string;
  agentName?: string;
  customerWords: number;
  formattedDate: string;
  isOpen: boolean;
  toggleOpen: () => void;
}) {
  return (
    <div
      className={`grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center p-6 hover:bg-gray-100 cursor-pointer ${isOpen ? "bg-gray-100" : ""}`}
      onClick={toggleOpen}
    >
      {/* Name Column */}
      <div className="flex items-center space-x-2 min-w-0">
        <User className="h-5 w-5 text-[#314842] hidden sm:inline-block flex-shrink-0" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold truncate">{name}</h3>
        </div>
      </div>

      {/* Agent Type Column */}
      <div className="text-sm text-gray-600 truncate">
        {agentName || "—"}
      </div>

      {/* Words Column */}
      <div className="text-center">
        <span className="bg-[#F5FF78] px-1.5 py-0.5 rounded text-gray-800 text-sm whitespace-nowrap">
          +{customerWords.toLocaleString()} Words
        </span>
      </div>

      {/* Date Column */}
      <div className="text-sm text-gray-900 text-right">
        {formattedDate}
      </div>

      {/* Expand Button */}
      <Button variant="ghost" size="sm" className="p-0 text-[#E4F222]">
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
    </div>
  );
});

// Memoized transcript block component
const TranscriptBlock = React.memo(function TranscriptBlock({
  block,
  index,
  searchTerm
}: {
  block: string;
  index: number;
  searchTerm: string;
}) {
  // Split the block into speaker and content
  const [speaker, ...content] = block.split(": ");
  
  // Function to highlight search terms
  const highlightSearchTerm = useCallback((text: string) => {
    if (!searchTerm) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, [searchTerm]);
  
  const highlightedContent = useMemo(() => 
    highlightSearchTerm(content.join(": ")), 
    [content, highlightSearchTerm]
  );

  return (
    <div className={`p-3 rounded ${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
      <strong className="text-[#E4F222]">{speaker}:</strong>
      <p>{highlightedContent}</p>
    </div>
  );
});

export const ResponseCard = React.memo(function ResponseCard({
  name,
  email,
  summary,
  transcript,
  isLast,
  completionDate,
  customerWords,
  completionRate,
  agentName,
  modalName,
}: ResponseCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullSummary, setIsFullSummary] = useState(false)

  const formattedDate = useMemo(() => 
    format(new Date(completionDate), "MMM d, yyyy"),
    [completionDate]
  );

  // Detect if summary is JSON or markdown and convert to displayable format
  const summaryData = useMemo(() => {
    if (!summary) return null;
    
    console.log('Raw summary:', summary);
    
    // Strip markdown code fences if present
    let cleanedSummary = summary.trim();
    if (cleanedSummary.startsWith('```json\n') && cleanedSummary.endsWith('\n```')) {
      cleanedSummary = cleanedSummary.slice(8, -4); // Remove ```json\n and \n```
    } else if (cleanedSummary.startsWith('```\n') && cleanedSummary.endsWith('\n```')) {
      cleanedSummary = cleanedSummary.slice(4, -4); // Remove ```\n and \n```
    }
    
    try {
      const parsed = JSON.parse(cleanedSummary) as JsonSummary;
      console.log('Parsed JSON:', parsed);
      
      // Basic validation that it's our expected JSON structure
      if (parsed.execSummary && parsed.storyArc && parsed.evaluation) {
        console.log('Valid JSON summary detected, converting to markdown');
        const markdownContent = convertJsonSummaryToMarkdown(parsed);
        console.log('Converted markdown:', markdownContent);
        return { type: 'json-converted', data: markdownContent };
      } else {
        console.log('JSON structure validation failed - missing required fields');
      }
    } catch (e) {
      console.log('JSON parse failed, treating as markdown:', e);
      // Not JSON, treat as markdown
    }
    
    console.log('Treating as markdown summary');
    return { type: 'markdown', data: summary };
  }, [summary]);

  const summaryPreview = useMemo(() => {
    if (summaryData?.type === 'markdown') {
      return (summaryData.data as string).split("\n").slice(0, 3).join("\n");
    } else if (summaryData?.type === 'json-converted') {
      // For JSON-converted, show just the snapshot part for preview
      const lines = (summaryData.data as string).split("\n");
      const dashIndex = lines.findIndex(line => line.trim() === '---');
      return lines.slice(0, dashIndex > 0 ? dashIndex : 3).join("\n");
    }
    return null;
  }, [summaryData]);

  const toggleOpen = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const toggleFullSummary = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullSummary(!isFullSummary);
  }, [isFullSummary]);

  const transcriptBlocks = useMemo(() => 
    transcript.split("\n\n"),
    [transcript]
  );

  return (
    <div className={`${!isLast ? "border-b" : ""}`}>
      <CardHeader 
        name={name}
        agentName={agentName}
        customerWords={customerWords}
        formattedDate={formattedDate}
        isOpen={isOpen}
        toggleOpen={toggleOpen}
      />
      
      {isOpen && (
        <div className="p-6 bg-white space-y-4">
          <div className="block sm:hidden mb-4">
            <h3 className="text-lg font-semibold">{name}</h3>
          </div>
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{email}</span>
              </div>
              {agentName && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Agent: {agentName}</span>
                </div>
              )}
              {modalName && (
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Modal: {modalName}</span>
                </div>
              )}
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
              <FileText className="w-4 h-4 mr-1 text-[#E4F222]" />
              <span>Summary</span>
            </h4>
            <div className="text-sm bg-white border border-gray-200 p-4 rounded prose max-w-none">
              {summaryData?.data ? (
                <>
                  <MarkdownRenderer content={isFullSummary ? summaryData.data as string : summaryPreview || ''} />
                  
                  {(summaryData.data as string).split("\n").length > 3 && (
                    <Button
                      variant="link"
                      onClick={toggleFullSummary}
                      className="mt-2 p-0 h-auto font-normal text-[#E4F222]"
                    >
                      {isFullSummary ? "Read less" : "Read more"}
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-gray-500 italic">No summary available</p>
              )}
            </div>
          </div>

          <Dialog>
            <DialogTrigger>
              <Button variant="outline" className="w-full">
                <FileText className="w-4 h-4 mr-2 text-[#E4F222]" />
                <span>View Transcript</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
              <DialogHeader>
                <DialogTitle>Conversation Transcript</DialogTitle>
                <DialogDescription>Full transcript of the conversation with {name}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                                  {transcriptBlocks.map((block, index) => (
                    <TranscriptBlock 
                      key={index} 
                      block={block} 
                      index={index} 
                      searchTerm="" 
                    />
                  ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
});