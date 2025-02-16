"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StatusChangeProps {
  initialStatus: "new responses" | "reviewed"
}

export default function InterviewStatus({ initialStatus }: StatusChangeProps) {
  const [status, setStatus] = useState<"new responses" | "reviewed">(initialStatus)
  const [isSaving, setIsSaving] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleStatusChange = async (newStatus: "new responses" | "reviewed") => {
    setIsSaving(true)
    // Simulating an API call
    setTimeout(() => {
      setStatus(newStatus)
      setIsSaving(false)
    }, 1000)
  }

  const statusColor = status === "new responses" ? "bg-yellow-500" : "bg-green-500"

  if (!isMounted) {
    return null // or a loading placeholder
  }

  return (
    <div className="flex items-center gap-2 w-full md:w-auto">
      <Select value={status} onValueChange={handleStatusChange} disabled={isSaving}>
        <SelectTrigger className="w-full md:w-[150px]">
          <SelectValue>{status === "new responses" ? "New Responses" : "Reviewed"}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new responses">New Responses</SelectItem>
          <SelectItem value="reviewed">Reviewed</SelectItem>
        </SelectContent>
      </Select>
      <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
      {isSaving && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></span>}
    </div>
  )
}

