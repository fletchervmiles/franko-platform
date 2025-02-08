"use client"

import { User } from 'lucide-react'
import React, { useEffect, useState, Suspense } from "react"
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { SUMMARY_SECTIONS } from '@/constants/summaryContent'
import dynamic from 'next/dynamic'

// Dynamic imports for heavy components
const InterviewDetails = dynamic(() => import('./interview-details'), {
  loading: () => <div>Loading details...</div>
})
const InterviewStatus = dynamic(() => import('./status-change'), {
  loading: () => <div>Loading status...</div>
})
const AudioPlayer = dynamic(() => import('./audio-player'), {
  loading: () => <div>Loading audio player...</div>
})
const FullTranscript = dynamic(() => import('./transcript'), {
  loading: () => <div>Loading transcript...</div>
})
const SummaryCard = dynamic(() => import('./summary'), {
  loading: () => <div>Loading summary...</div>
})

const DesktopLayout = dynamic(() => import('./interview-layouts/desktop'), {
  loading: () => <div>Loading desktop view...</div>
})

const MobileLayout = dynamic(() => import('./interview-layouts/mobile'), {
  loading: () => <div>Loading mobile view...</div>
})

// Define the raw data structure from Supabase
interface RawInterview {
  id: string;
  user_id: string;
  client_name: string;
  unique_customer_identifier: string;
  use_case: string;
  interviewee_first_name: string;
  interviewee_last_name: string;
  interviewee_email: string;
  interviewee_number: string | null;
  call_id: string;
  date_completed: string | null;
  interview_start_time: string | null;
  interview_end_time: string | null;
  total_interview_minutes: number | null;
  conversation_history_raw: string | null;
  conversation_history_cleaned: string | null;
  interview_audio_link: string | null;
  client_company_description: string | null;
  agent_name: string | null;
  voice_id: string | null;
  created_at: string;
  updated_at: string;
  analysis_part01: string | null;
  analysis_part02: string | null;
  analysis_part03: string | null;
  analysis_part04: string | null;
  analysis_part05: string | null;
  analysis_part06: string | null;
  status: string;
  analysis_output: string | null;
}

export interface Interview {
  id: string;
  userId: string;
  clientName: string;
  uniqueCustomerIdentifier: string;
  useCase: string;
  intervieweeFirstName: string;
  intervieweeLastName: string;
  intervieweeEmail: string;
  intervieweeNumber: string | null;
  callId: string;
  dateCompleted: string | null;
  interviewStartTime: string | null;
  interviewEndTime: string | null;
  totalInterviewMinutes: number | null;
  conversationHistoryRaw: string | null;
  conversationHistoryCleaned: string | null;
  interviewAudioLink: string | null;
  clientCompanyDescription: string | null;
  agentName: string | null;
  voiceId: string | null;
  createdAt: string;
  updatedAt: string;
  analysisPart01: string | null;
  analysisPart02: string | null;
  analysisPart03: string | null;
  analysisPart04: string | null;
  analysisPart05: string | null;
  analysisPart06: string | null;
  status: string;
  analysisOutput: string | null;
}

const transformInterviewData = (rawData: RawInterview): Interview => {
  return {
    id: rawData.id,
    userId: rawData.user_id,
    clientName: rawData.client_name,
    uniqueCustomerIdentifier: rawData.unique_customer_identifier,
    useCase: rawData.use_case,
    intervieweeFirstName: rawData.interviewee_first_name,
    intervieweeLastName: rawData.interviewee_last_name,
    intervieweeEmail: rawData.interviewee_email,
    intervieweeNumber: rawData.interviewee_number,
    callId: rawData.call_id,
    dateCompleted: rawData.date_completed,
    interviewStartTime: rawData.interview_start_time,
    interviewEndTime: rawData.interview_end_time,
    totalInterviewMinutes: rawData.total_interview_minutes,
    conversationHistoryRaw: rawData.conversation_history_raw,
    conversationHistoryCleaned: rawData.conversation_history_cleaned,
    interviewAudioLink: rawData.interview_audio_link,
    clientCompanyDescription: rawData.client_company_description,
    agentName: rawData.agent_name,
    voiceId: rawData.voice_id,
    createdAt: rawData.created_at,
    updatedAt: rawData.updated_at,
    analysisPart01: rawData.analysis_part01,
    analysisPart02: rawData.analysis_part02,
    analysisPart03: rawData.analysis_part03,
    analysisPart04: rawData.analysis_part04,
    analysisPart05: rawData.analysis_part05,
    analysisPart06: rawData.analysis_part06,
    status: rawData.status?.toLowerCase() === 'reviewed' ? 'reviewed' : 'ready for review',
    analysisOutput: rawData.analysis_output || null,
  }
}

// Create a type for what InterviewDetails actually needs
type InterviewDetailsProps = Pick<Interview, 
  | 'intervieweeFirstName'
  | 'intervieweeLastName'
  | 'intervieweeEmail'
  | 'intervieweeNumber'
  | 'useCase'
  | 'dateCompleted'
  | 'totalInterviewMinutes'
  | 'status'
>

interface InterviewContainerProps {
  interviewId: string;
  userId: string;
}

export default function InterviewContainer({ interviewId, userId }: InterviewContainerProps) {
  const [interview, setInterview] = useState<Interview | null>(null)

  useEffect(() => {
    async function fetchInterview() {
      const supabase = createClient()
      const { data: rawInterview, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', interviewId)
        .single()

      if (error) {
        console.error('Error fetching interview:', error)
        return
      }

      if (rawInterview) {
        setInterview(transformInterviewData(rawInterview as RawInterview))
      }
    }

    fetchInterview()
  }, [interviewId])

  if (!interview) {
    return <div>No interview data found</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-6 border-b-0 xl:border-b gap-4 sm:gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-semibold">
              Interviewee: {`${interview.intervieweeFirstName} ${interview.intervieweeLastName}`}
            </h1>
          </div>
          <InterviewStatus 
            interviewId={interview.id} 
            initialStatus={interview.status}
            userId={userId}
          />
        </div>
        
        {/* Desktop Layout */}
        <div className="hidden xl:block">
          <DesktopLayout interview={interview} />
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="block xl:hidden">
          <MobileLayout interview={interview} />
        </div>
      </Card>
    </div>
  )
}