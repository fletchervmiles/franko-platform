import React from 'react'
import { redirect } from 'next/navigation'
import InterviewContainer from "@/components/custom-ui/interview-container"
import Nav from "@/components/custom-ui/demoNav"
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: {
    id: string
  }
}

export const metadata: Metadata = {
  title: 'Interview Details',
  description: 'View interview details and analysis',
}

export default async function DemoInterviewPage({ params }: Props) {
  const userId = "user_demo_account"

  // Create Supabase client
  const supabase = createClient()

  // Verify this interview belongs to the demo account
  const { data: interview, error } = await supabase
    .from('interviews')
    .select('user_id')
    .eq('id', params.id)
    .single()

  if (error || !interview) {
    console.error('Error fetching interview:', error)
    redirect('/demo/dashboard')
  }

  if (interview.user_id !== userId) {
    redirect('/demo/dashboard')
  }

  return (
    <Nav>
      <InterviewContainer interviewId={params.id} userId={userId} />
    </Nav>
  )
} 