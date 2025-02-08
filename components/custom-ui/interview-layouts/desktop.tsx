"use client"

import React from 'react'
import dynamic from 'next/dynamic'
import { SUMMARY_SECTIONS } from '@/constants/summaryContent'
import type { Interview } from '../interview-container'

const SummaryCard = dynamic(() => import('../summary'), {
  loading: () => <div>Loading summary...</div>
})

const InterviewDetails = dynamic(() => import('../interview-details'), {
  loading: () => <div>Loading details...</div>
})

const AudioPlayer = dynamic(() => import('../audio-player'), {
  loading: () => <div>Loading audio player...</div>
})

const FullTranscript = dynamic(() => import('../transcript'), {
  loading: () => <div>Loading transcript...</div>
})

interface DesktopLayoutProps {
  interview: Interview
}

export default function DesktopLayout({ interview }: DesktopLayoutProps) {
  return (
    <div className="flex w-full flex-1 flex-col">
      <div className="flex flex-1">
        <div className="flex w-1/2 flex-col border-r">
          <div className="flex-1">
            {SUMMARY_SECTIONS && Object.values(SUMMARY_SECTIONS).map((section) => (
              <SummaryCard 
                key={section.title}
                title={section.title}
                content={interview[section.field as keyof typeof interview] as string}
                icon={section.icon}
                isDefaultOpen={section.isDefaultOpen}
              />
            ))}
          </div>
        </div>
        <div className="flex w-1/2 flex-col">
          <div className="flex-1">
            <InterviewDetails 
              interview={{
                intervieweeFirstName: interview.intervieweeFirstName,
                intervieweeLastName: interview.intervieweeLastName,
                intervieweeEmail: interview.intervieweeEmail,
                intervieweeNumber: interview.intervieweeNumber,
                useCase: interview.useCase,
                dateCompleted: interview.dateCompleted,
                totalInterviewMinutes: interview.totalInterviewMinutes,
                status: interview.status
              }} 
            />
            <AudioPlayer audioUrl={interview.interviewAudioLink} />
            <FullTranscript conversationHistory={interview.conversationHistoryRaw} />
          </div>
        </div>
      </div>
    </div>
  )
} 