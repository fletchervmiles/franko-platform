'use client'

import React, { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckIcon } from 'lucide-react'

export default function InterviewStatus() {
  const [status, setStatus] = useState<'ready for review' | 'reviewed'>('ready for review')
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)

  const handleStatusChange = async (newStatus: 'ready for review' | 'reviewed') => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setStatus(newStatus)
    setIsSaving(false)
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={handleStatusChange} disabled={isSaving}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ready for review">Ready for review</SelectItem>
          <SelectItem value="reviewed">Reviewed</SelectItem>
        </SelectContent>
      </Select>
      <span className={`w-2 h-2 rounded-full ${
        status === 'reviewed' ? 'bg-green-500' : 'bg-yellow-500'
      }`}></span>
      {isSaving && (
        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></span>
      )}
      {showSaved && (
        <span className="text-green-500 flex items-center gap-1 animate-fade-in-out">
          <CheckIcon className="w-4 h-4" />
          Saved
        </span>
      )}
    </div>
  )
}