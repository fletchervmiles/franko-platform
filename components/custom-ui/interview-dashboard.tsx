'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import InterviewCard from './interview-card'
import { getInterviewsByUserId } from '@/db/queries/interviews-queries'
import { Database } from '@/lib/supabase/database.types'
import { Info } from 'lucide-react'

type Interview = Database['public']['Tables']['interviews']['Row']

interface InterviewDashboardProps {
  userId: string;
  isDemoRoute?: boolean;
}

export default function InterviewDashboard({ 
  userId, 
  isDemoRoute = false 
}: InterviewDashboardProps) {
  const router = useRouter()
  const [interviews, setInterviews] = useState<Interview[]>([])

  useEffect(() => {
    async function fetchInterviews() {
      if (userId) {
        const data = await getInterviewsByUserId(userId)
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
            
            console.log('Comparing:', {
              nameA: `${a.intervieweeFirstName} ${a.intervieweeLastName}`,
              nameB: `${b.intervieweeFirstName} ${b.intervieweeLastName}`,
              timeA: a.interviewEndTime,
              timeB: b.interviewEndTime,
              timeAms: timeA,
              timeBms: timeB
            })
            
            return timeB - timeA
          })

        console.log('Sorted order:', 
          formattedData.map(i => ({
            name: `${i.intervieweeFirstName} ${i.intervieweeLastName}`,
            time: i.interviewEndTime,
            timestamp: i.interviewEndTime ? new Date(i.interviewEndTime).getTime() : 0
          }))
        )

        setInterviews(formattedData)
      }
    }

    fetchInterviews()
  }, [userId])

  const handleInterviewClick = (interviewId: string) => {
    const basePath = isDemoRoute ? '/demo/interview' : '/interview'
    router.push(`${basePath}/${interviewId}`)
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
              date={formatDate(interview.interviewEndTime as string)}
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