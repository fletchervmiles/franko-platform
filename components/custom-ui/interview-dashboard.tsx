'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import InterviewCard from './interview-card'
import { getInterviewsByUserId } from '@/db/queries/interviews-queries'
import { Database } from '@/lib/supabase/database.types'

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
            dateCompleted: interview.dateCompleted?.toISOString(),
            updatedAt: interview.updatedAt.toISOString(),
            createdAt: interview.createdAt.toISOString(),
            interviewStartTime: interview.interviewStartTime?.toISOString(),
            interviewEndTime: interview.interviewEndTime?.toISOString()
          }))
          .sort((a, b) => {
            // Sort by dateCompleted in descending order (most recent first)
            const dateA = a.dateCompleted ? new Date(a.dateCompleted).getTime() : 0
            const dateB = b.dateCompleted ? new Date(b.dateCompleted).getTime() : 0
            return dateB - dateA
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
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-6">Your Customer Interviews</h2>
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
    </div>
  )
}