'use client'

import { useState } from 'react'
import InterviewForm from "@/components/custom-ui/interview-form"
import FAQSection from "@/components/custom-ui/faqs"
import Footer from "@/components/custom-ui/form-footer"
import CallProcessingModal from "@/components/custom-ui/form-popup-modal"

export default function StartInterviewPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleFormSubmit = () => {
    setIsModalOpen(true)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-2 md:p-4 bg-gray-100/75 min-h-screen">
      <div className="max-w-[800px] mx-auto w-full space-y-4">
        <div className="text-center pt-6 md:pt-12 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Help Our Company Improve: Share Your Feedback</h1>
          <p className="mt-2 text-muted-foreground">
            Submit your details below to receive a quick 5-10 minute call from our AI interviewer. We'll ask a few simple questions about your experience with us and decision to end your subscription.
          </p>
        </div>
        <InterviewForm onSubmitSuccess={handleFormSubmit} />
        <FAQSection companyName="Our Company" />
      </div>
      <Footer />
      <CallProcessingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  )
}
