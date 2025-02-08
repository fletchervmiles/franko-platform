"use client"

import React from 'react'
import dynamic from 'next/dynamic'
import { SUMMARY_SECTIONS } from '@/constants/summaryContent'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
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

interface MobileLayoutProps {
  interview: Interview
}

export default function MobileLayout({ interview }: MobileLayoutProps) {
  return (
    <Tabs defaultValue="analysis" className="w-full">
      <div className="px-6">
        <TabsList className="w-full justify-start rounded-none bg-transparent p-0">
          <TabsTrigger
            value="analysis"
            className="relative rounded-lg px-6 py-2 font-medium text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-black"
          >
            Analysis
          </TabsTrigger>
          <TabsTrigger
            value="details"
            className="relative rounded-lg px-4 py-2 font-medium text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-black"
          >
            Details
          </TabsTrigger>
        </TabsList>
      </div>
      <Separator className="mt-2" />
      <TabsContent value="analysis" className="flex-1">
        {SUMMARY_SECTIONS && Object.values(SUMMARY_SECTIONS).map((section) => (
          <SummaryCard 
            key={section.title}
            title={section.title}
            content={interview[section.field as keyof typeof interview] as string}
            icon={section.icon}
            isDefaultOpen={section.isDefaultOpen}
          />
        ))}
      </TabsContent>
      <TabsContent value="details" className="flex-1">
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
      </TabsContent>
    </Tabs>
  )
} 