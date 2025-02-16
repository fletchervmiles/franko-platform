"use client"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarIcon, ClockIcon, UserIcon, FileTextIcon, ActivityIcon } from "lucide-react"
import InterviewStatus from "./interview-status"

interface InterviewCardProps {
  intervieweeName: string
  date: string
  duration: number
  status: "ready for review" | "reviewed"
  interviewType: string
  onClick: () => void
}

export default function InterviewCard({
  intervieweeName,
  date,
  duration,
  status,
  interviewType,
  onClick,
}: InterviewCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.toLocaleDateString("en-GB", { month: "short" })
    const year = date.toLocaleDateString("en-GB", { year: "2-digit" })
    const suffix = ["th", "st", "nd", "rd"][day % 10 > 3 ? 0 : (day % 100) - (day % 10) !== 10 ? day % 10 : 0]
    return `${day}${suffix} ${month} ${year}`
  }

  return (
    <Card className="w-full cursor-pointer transition-all hover:shadow-md" onClick={onClick}>
      <CardContent className="p-8 grid gap-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Name
            </h3>
            <span className="text-sm">{intervieweeName}</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
              <FileTextIcon className="w-4 h-4" />
              Interview Type
            </h3>
            <span className="text-sm">{interviewType}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              Duration
            </h3>
            <span className="text-sm">{duration} minutes</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Date
            </h3>
            <span className="text-sm">{formatDate(date)}</span>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
            <ActivityIcon className="w-4 h-4" />
            Status
          </h3>
          <InterviewStatus initialStatus={status} />
        </div>
      </CardContent>
    </Card>
  )
}

