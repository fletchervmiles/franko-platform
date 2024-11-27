'use client'

import React from 'react'
import { CalendarIcon, ClockIcon, UserIcon, FileTextIcon, MailIcon, PhoneIcon, Info } from 'lucide-react'
import { Database } from '@/lib/supabase/database.types'

type Interview = Database['public']['Tables']['interviews']['Row']

interface InterviewDetailsProps {
  interview: {
    intervieweeFirstName: string;
    intervieweeLastName: string;
    intervieweeEmail: string;
    intervieweeNumber: string | null;
    useCase: string;
    dateCompleted: string | null;
    totalInterviewMinutes: number | null;
    status: string;
  }
}

export default function InterviewDetails({ interview }: InterviewDetailsProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not completed'
    const date = new Date(dateString)
    const day = date.getDate()
    const suffix = ['th', 'st', 'nd', 'rd'][(day > 3 && day < 21) || day % 10 > 3 ? 0 : day % 10]
    
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: '2-digit'
    }).replace(/\d+/, day + suffix)
  }

  const statusColor = interview.status?.toLowerCase() === 'reviewed' 
    ? 'bg-green-500' 
    : 'bg-yellow-500'

  return (
    <div className="w-full bg-white relative">
      <h2 className="text-sm font-semibold px-6 pt-4 flex items-center gap-2">
        <Info className="h-4 w-4 text-[#f5a623]" />
        Interview Details
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 p-6 pt-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <UserIcon className="w-4 h-4" />
            <span>Name</span>
          </div>
          <span className="text-sm">{`${interview.intervieweeFirstName || ''} ${interview.intervieweeLastName || ''}`}</span>
        </div>
        
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <MailIcon className="w-4 h-4" />
            <span>Email</span>
          </div>
          <span className="text-sm break-all">{interview.intervieweeEmail || 'Not provided'}</span>
        </div>
        
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <PhoneIcon className="w-4 h-4" />
            <span>Phone</span>
          </div>
          <span className="text-sm">{interview.intervieweeNumber || 'Not provided'}</span>
        </div>

        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <FileTextIcon className="w-4 h-4" />
            <span>Interview Type</span>
          </div>
          <span className="text-sm">{interview.useCase || 'Not specified'}</span>
        </div>
        
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <CalendarIcon className="w-4 h-4" />
            <span>Date</span>
          </div>
          <span className="text-sm">{formatDate(interview.dateCompleted)}</span>
        </div>
        
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <ClockIcon className="w-4 h-4" />
            <span>Duration</span>
          </div>
          <span className="text-sm">{`${interview.totalInterviewMinutes || 0} minutes`}</span>
        </div>

        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Status</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
            <span className="text-sm capitalize">{interview.status || 'ready for review'}</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border"></div>
    </div>
  )
}