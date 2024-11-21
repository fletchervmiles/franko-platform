# Linking Dashboard with Interview Page

## Step 1. Context Step (don't take any action yet, for review only) - Database Schema Overview

I have two tables. 

- Profiles Table: Contains customer data with a unique user_id.
  - `db\schema\profiles-schema.ts`
- Interviews Table: Contains interviews linked to customers. Each interview has multiple interview entries. Each interview has a unique id which is call_id.
  - `db\schema\interviews-schema.ts`

So each table has:

A unique call_id (this should be used to identify the interview details)
A foreign key user_id linking back to the Profiles table.

## Step 2. Context Step (don't take any action yet, for review only) - Dashboard

I have a dashboard page. This shows all the interviews for a particular customer based on their user_id. The interviews are displayed as individual interview cards which are clickable. They click through to more details about the interview.

The interview cards are displaying correectly but the click through functionality isn't working yet.

But it does seem to be fetch interviews, rendering interview list and populate individual interview cards with the correct information (although maybe not the call_id).

Here are the relevant file paths:

`the app\dashboard\page.tsx`
`components\custom-ui\interview-dashboard.tsx`

And here is the relevant code:

```typescript
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
        const formattedData = data.map(interview => ({
          ...interview,
          dateCompleted: interview.dateCompleted?.toISOString(),
          updatedAt: interview.updatedAt.toISOString(),
          createdAt: interview.createdAt.toISOString(),
          interviewStartTime: interview.interviewStartTime?.toISOString(),
          interviewEndTime: interview.interviewEndTime?.toISOString()
        }))
        setInterviews(formattedData)
      }
    }

    fetchInterviews()
  }, [user?.id])

  const handleInterviewClick = (interviewId: string) => {
    router.push(`/interview-page/${interviewId}`)
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
```

## Step 3. Setting up Interview page (don't take any action yet, for review only)

Then I have an interview page. This page should be reached after clicking the component on the dashboard. And it needs to populate the relevant interview information. Here is my code so far:

File path:

`app\interview-page\[id]\page.tsx`

Interview page code:

```typescript
import { createClient } from '@/lib/supabase/client'
import RootLayout from "@/components/custom-ui/nav"
import InterviewContainer from "@/components/custom-ui/interview-container"

interface Props {
  params: {
    id: string
  }
}

export default function InterviewPage({ params }: Props) {
  return (
    <RootLayout>
      <div className="min-h-screen bg-background">
        <InterviewContainer interviewId={params.id} />
      </div>
    </RootLayout>
  )
} 
```

Interview container component code:

```typescript
"use client"

import { User } from 'lucide-react'
import React, { useEffect, useState } from "react"
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'

import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import InterviewDetails from "./interview-details"
import InterviewStatus from "./status-change"
import AudioPlayer from "./audio-player"
import FullTranscript from "./transcript"
import SummaryCard from "./summary"
import { SUMMARY_SECTIONS } from '@/constants/summaryContent'

type Interview = Database['public']['Tables']['interviews']['Row']

interface InterviewContainerProps {
  interviewId: string;
}

export default function InterviewContainer({ interviewId }: InterviewContainerProps) {
  const [interview, setInterview] = useState<Interview | null>(null)

  useEffect(() => {
    async function fetchInterview() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', interviewId)
        .single()

      if (error) {
        console.error('Error fetching interview:', error)
        return
      }

      setInterview(data)
    }

    if (interviewId) {
      fetchInterview()
    }
  }, [interviewId])

  if (!interview) {
    return <div>Loading...</div>
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
          <InterviewStatus />
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
                      content={section.content}
                      icon={section.icon}
                    />
                  ))}
                </div>
              </div>
              <div className="flex w-1/2 flex-col">
                <div className="flex-1">
                  <InterviewDetails interview={interview} />
                  <AudioPlayer />
                  <FullTranscript transcript="" />
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
                  content={section.content}
                  icon={section.icon}
                />
              ))}
            </TabsContent>
            <TabsContent value="details" className="flex-1">
              <InterviewDetails interview={interview} />
              <AudioPlayer />
              <FullTranscript transcript="" />
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  )
}
```

The interview-container component has a bunch of important child components where a lot of the interview data will be populated, those are the following components:

- `components\custom-ui\audio-player.tsx`
- `components\custom-ui\summary.tsx`
  - `constants\summaryContent.ts`
- `components\custom-ui\interview-details.tsx`
- `components\custom-ui\transcript.tsx`


## Step 4 - (don't take any action yet, for review only) General Implementation Steps

1. Dynamic Routing

Use Next.js dynamic routes to create a page for each interview based on call_id
I think the file should be named [call_id].tsx inside pages/interview/. (but I'm not sure)

2. Fetch interview data

3. Render interview details

Pass the interview data to the InterviewContainer component.
Within InterviewContainer, pass necessary props to child components.

4. Typescript Types

Make sure typescript types have been created


## Step 5 - (don't take any action yet, for review only) Component Data Matching

I will match what's in the current code on the left and the name within Supabase on the right, in the `interviews-schema`.

- `components\custom-ui\interview-details.tsx`

intervieweeFirstName  = interviewee_first_name
intervieweeLastName = interviewee_last_name
intervieweeEmail = interviewee_number
intervieweeNumber = interviewee_email
useCase = use_case
dateCompleted = date_completed
totalInterviewMinutes = total_interview_minutes

- `components\custom-ui\audio-player.tsx`

audio player = interview_audio_link (this is the audio file link)

This section might need some work as I'm not sure we've installed the necessary media player? Or whether it's possible to get the audio file size / duration from the link itself?

- `components\custom-ui\transcript.tsx`

placeholderTranscript = conversation_history_raw

- `components\custom-ui\summary.tsx`
  - `constants\summaryContent.ts`

summary, content = analysis_part01
reasonForCanceling, content = analysis_part02
desiredBenefit, content = analysis_part03
customerFeedback, content = analysis_part04
winBackAnalysis, content = analysis_part05
actionSteps, content = analysis_part06


- `components\custom-ui\status-change.tsx`


SelectValue placeholer = status



## Step 6 - Take action here

As a first step, let's create a detailed step by step plan of how to implement these changes.

Then, let's implement them one by one. 
Only implement one step at a time then ask for permission to implement the next step. 
That way we can work through it together. 
Always explain your thinking and feel free to ask any clarifying questions.
Keep a running to do list which you update as you go with green ticks or to do.