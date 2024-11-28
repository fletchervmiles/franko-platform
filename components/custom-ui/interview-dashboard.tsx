'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import InterviewCard from './interview-card'
import { getInterviewsByUserId } from '@/db/queries/interviews-queries'
import { Database } from '@/lib/supabase/database.types'
import { Info } from 'lucide-react'

type Interview = Database['public']['Tables']['interviews']['Row']

export default function InterviewDashboard() {
  const { user } = useUser()
  const router = useRouter()
  const [interviews, setInterviews] = useState<Interview[]>([])

  useEffect(() => {
    async function fetchInterviews() {
      if (user?.id) {
        const data = await getInterviewsByUserId(user.id)
        const formattedData = data
          .map(interview => ({
            ...interview,
            status: interview.status?.toLowerCase() || 'ready for review',
            dateCompleted: interview.dateCompleted?.toISOString(),
            updatedAt: interview.updatedAt.toISOString(),
            createdAt: interview.createdAt.toISOString(),
            interviewStartTime: interview.interviewStartTime?.toISOString(),
            interviewEndTime: interview.interviewEndTime?.toISOString()
          }))
          .sort((a, b) => {
            const timeA = a.interviewEndTime ? new Date(a.interviewEndTime).getTime() : 0
            const timeB = b.interviewEndTime ? new Date(b.interviewEndTime).getTime() : 0
            return timeB - timeA
          })
        setInterviews(formattedData)
      }
    }

    fetchInterviews()
  }, [user?.id])

  const handleInterviewClick = (interviewId: string) => {
    router.push(`/interview/${interviewId}`)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="w-full p-4">
      <h2 className="text-xl font-semibold mb-6">Your Customer Interviews</h2>
      {interviews.length === 0 ? (
        <div className="rounded-lg border border-gray-200 p-6 bg-white max-w-2xl">
          <div className="flex mb-4">
            <Info className="h-8 w-8 text-[#f5a623]" />
          </div>
          <p className="text-sm text-gray-600 mb-2">No interviews to display yet.</p>
          <p className="text-sm text-gray-600">
            Please go to the setup page to find your unique shareable link. Share it with your customers 
            so they can start completing interviews. Once an interview is completed, 
            the transcript and analysis will appear on your dashboard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          {interviews.map((interview) => (
            <InterviewCard
              key={interview.id}
              intervieweeName={`${interview.intervieweeFirstName} ${interview.intervieweeLastName}`}
              date={formatDate(interview.dateCompleted as string)}
              duration={interview.totalInterviewMinutes}
              status={interview.status as 'ready for review' | 'reviewed'}
              interviewType={interview.useCase}
              onClick={() => handleInterviewClick(interview.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}