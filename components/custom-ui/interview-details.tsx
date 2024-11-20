'use client'

import React from 'react'
import { CalendarIcon, ClockIcon, UserIcon, FileTextIcon, MailIcon, PhoneIcon } from 'lucide-react'

export default function InterviewDetails() {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const suffix = ['th', 'st', 'nd', 'rd'][(day > 3 && day < 21) || day % 10 > 3 ? 0 : day % 10]
    
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: '2-digit'
    }).replace(/\d+/, day + suffix)
  }

  return (
    <div className="w-full bg-white relative">
      <h2 className="text-sm font-semibold px-6 pt-4">Interview Details</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 p-6 pt-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <UserIcon className="w-4 h-4" />
            <span>Name</span>
          </div>
          <span className="text-sm">John Doe</span>
        </div>
        
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <MailIcon className="w-4 h-4" />
            <span>Email</span>
          </div>
          <span className="text-sm break-all">john.doe@example.com</span>
        </div>
        
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <PhoneIcon className="w-4 h-4" />
            <span>Phone</span>
          </div>
          <span className="text-sm">+1 (555) 123-4567</span>
        </div>

        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <FileTextIcon className="w-4 h-4" />
            <span>Interview Type</span>
          </div>
          <span className="text-sm">Customer Feedback</span>
        </div>
        
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <CalendarIcon className="w-4 h-4" />
            <span>Date</span>
          </div>
          <span className="text-sm">15th Jun 23</span>
        </div>
        
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <ClockIcon className="w-4 h-4" />
            <span>Duration</span>
          </div>
          <span className="text-sm">45 minutes</span>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border"></div>
    </div>
  )
}