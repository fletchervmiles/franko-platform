"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Frown, Meh, Smile, X, CheckCircle, Loader2 } from "lucide-react"
import { useFeedbackModal } from "./contexts/feedback-modal-context"
import { useAuth, useUser } from "@clerk/nextjs"
import { toast } from "sonner"

export default function FeedbackComponent() {
  const { isOpen, closeModal, modalType } = useFeedbackModal()
  const [feedback, setFeedback] = useState("")
  const [selectedReaction, setSelectedReaction] = useState<"sad" | "neutral" | "happy" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { userId } = useAuth()
  const { user } = useUser()

  // Close on escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal()
    }

    if (isOpen) {
      window.addEventListener("keydown", handleEscape)
    }

    return () => {
      window.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, closeModal])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    // Reset states when modal is closed
    if (!isOpen) {
      setTimeout(() => {
        setFeedback("")
        setSelectedReaction(null)
        setIsSubmitted(false)
      }, 300)
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback.trim()) return

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "feedback",
          message: feedback,
          reaction: selectedReaction,
          userEmail: user?.primaryEmailAddress?.emailAddress,
          userName: user?.fullName || user?.firstName,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send feedback")
      }

      setIsSubmitted(true)
      toast.success("Feedback sent successfully")
    } catch (error) {
      console.error("Error sending feedback:", error)
      toast.error("Failed to send feedback. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div 
        className="bg-white rounded-lg shadow-lg w-full max-w-md relative overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={closeModal} 
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {modalType === "feedback" ? "Share Your Feedback" : "Get Support"}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {modalType === "feedback"
                ? "How can we improve Franko for you?"
                : "Tell us what you need help with and we'll get back to you."}
            </p>

            <Textarea
              placeholder={
                modalType === "feedback"
                  ? "I wish Franko could..."
                  : "I need help with..."
              }
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[120px] mb-4"
              disabled={isSubmitting}
              required
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex space-x-2 self-start">
                <button
                  type="button"
                  onClick={() => setSelectedReaction("sad")}
                  className={`p-2 rounded-full border ${
                    selectedReaction === "sad"
                      ? "bg-red-500 text-white border-red-500"
                      : "hover:bg-gray-100 border-gray-200"
                  }`}
                  disabled={isSubmitting}
                >
                  <Frown className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReaction("neutral")}
                  className={`p-2 rounded-full border ${
                    selectedReaction === "neutral"
                      ? "bg-yellow-500 text-white border-yellow-500"
                      : "hover:bg-gray-100 border-gray-200"
                  }`}
                  disabled={isSubmitting}
                >
                  <Meh className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReaction("happy")}
                  className={`p-2 rounded-full border ${
                    selectedReaction === "happy"
                      ? "bg-green-500 text-white border-green-500"
                      : "hover:bg-gray-100 border-gray-200"
                  }`}
                  disabled={isSubmitting}
                >
                  <Smile className="h-5 w-5" />
                </button>
              </div>
              <div className="flex gap-2 self-end">
                <Button
                  variant="outline"
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !feedback.trim()}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-6 flex flex-col items-center justify-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-center">Thank You!</h2>
            <p className="text-sm text-gray-500 mb-6 text-center">
              {modalType === "feedback"
                ? "We appreciate your feedback. It helps us make Franko better for everyone."
                : "We've received your support request and will get back to you as soon as possible."}
            </p>
            <Button onClick={closeModal}>Close</Button>
          </div>
        )}
      </div>
    </div>
  )
}

