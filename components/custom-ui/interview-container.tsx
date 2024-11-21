"use client"

import { User } from 'lucide-react'
import React, { useEffect, useState } from "react"
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import InterviewDetails from "./interview-details"
import InterviewStatus from "./status-change"
import AudioPlayer from "./audio-player"
import FullTranscript from "./transcript"
import SummaryCard from "./summary"
import { SUMMARY_SECTIONS } from '@/constants/summaryContent'
import { Separator } from "@/components/ui/separator"

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

// Define the transformed data structure
interface Interview {
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
    status: rawData.status,
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

export default function InterviewContainer({ interviewId }: { interviewId: string }) {
  const [interview, setInterview] = useState<Interview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInterview() {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data: rawData, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', interviewId)
        .single()

      if (error) {
        console.error('Error fetching interview:', error)
        setError(error.message)
        setLoading(false)
        return
      }

      // Transform the data before setting it in state
      const transformedData = transformInterviewData(rawData as RawInterview)
      console.log('Transformed data:', transformedData) // Debug log
      setInterview(transformedData)
      setLoading(false)
    }

    if (interviewId) {
      fetchInterview()
    }
  }, [interviewId])

  if (loading) {
    return <div>Loading interview data...</div>
  }

  if (error) {
    return <div>Error loading interview: {error}</div>
  }

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
          <InterviewStatus interviewId={interview.id} initialStatus={interview.status} />
        </div>
        <div className="flex flex-1">
          {/* Desktop Layout */}
          <div className="hidden w-full flex-1 flex-col xl:flex">
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
          {/* Mobile/Tablet Layout */}
          <Tabs defaultValue="analysis" className="w-full xl:hidden">
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
        </div>
      </Card>
    </div>
  )
}