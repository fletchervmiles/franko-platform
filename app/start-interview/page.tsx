'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import InterviewForm from "@/components/custom-ui/interview-form"
import FAQSection from "@/components/custom-ui/faqs"
import Footer from "@/components/custom-ui/form-footer"
import CallProcessingModal from "@/components/custom-ui/form-popup-modal"
import { SelectProfile } from "@/db/schema"

export default function StartInterviewPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const clientId = searchParams.get('clientId')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clientProfile, setClientProfile] = useState<SelectProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchClientProfile = async () => {
    if (!clientId) {
      router.push('/404')
      return
    }

    try {
      console.log('Fetching profile for clientId:', clientId)
      const response = await fetch(`/api/clients/${clientId}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch client profile')
      const data = await response.json()
      console.log('Received profile data:', data)
      setClientProfile(data)
    } catch (error) {
      console.error('Error fetching client profile:', error)
      router.push('/404')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClientProfile()
  }, [clientId, router])

  const handleFormSubmit = async () => {
    await fetchClientProfile()
    setIsModalOpen(true)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!clientProfile) {
    return null // This will only show briefly before redirect
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-2 md:p-4 bg-gray-100/75 min-h-screen">
      <div className="max-w-[800px] mx-auto w-full space-y-4">
        <div className="text-center pt-6 md:pt-12 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Help {clientProfile.companyName || 'us'} Improve: Share Your Feedback
          </h1>
          <p className="mt-2 text-muted-foreground">
          Complete the form below to receive a quick 5-10 minute call from our AI interviewer. We’ll ask a few simple questions about your experience and why you decided to cancel your subscription.
          </p>
        </div>
        <InterviewForm 
          onSubmitSuccess={handleFormSubmit}
          clientProfile={clientProfile}
          useCase="churn"
          key={JSON.stringify(clientProfile)}
        />
        <FAQSection companyName={clientProfile.companyName || ''} />
      </div>
      <Footer />
      <CallProcessingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  )
}
