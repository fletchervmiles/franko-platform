"use client"
import { ResponseCard } from "./response-card"

interface Response {
  name: string
  email: string
  completionRate: number
  completionDate: string
  summary: string
  transcript: string
}

interface ResponseCardListProps {
  responses: Response[]
}

export function ResponseCardList({ responses }: ResponseCardListProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Interview Responses</h3>
      <div className="rounded-[6px] border bg-white shadow-sm overflow-hidden">
        {responses.map((response, index) => (
          <ResponseCard key={index} {...response} isLast={index === responses.length - 1} />
        ))}
      </div>
    </div>
  )
}

