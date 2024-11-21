import React from 'react'
import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import { auth } from "@clerk/nextjs/server"
import InterviewContainer from "@/components/custom-ui/interview-container"
import Nav from "@/components/custom-ui/nav"
import { Metadata } from 'next'

interface Props {
  params: {
    id: string
  }
}

export const metadata: Metadata = {
  title: 'Interview Details',
  description: 'View interview details and analysis',
}

export default async function InterviewPage({ params }: Props) {
  // Get the authenticated user
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Create Supabase client
  const supabase = createClient()

  // Verify this interview belongs to the authenticated user
  const { data: interview, error } = await supabase
    .from('interviews')
    .select('user_id')
    .eq('id', params.id)
    .single()

  if (error || !interview) {
    console.error('Error fetching interview:', error)
    redirect('/dashboard') // Interview not found
  }

  if (interview.user_id !== userId) {
    redirect('/dashboard') // Not authorized to view this interview
  }

  return (
    <Nav>
      <InterviewContainer interviewId={params.id} />
    </Nav>
  )
} 