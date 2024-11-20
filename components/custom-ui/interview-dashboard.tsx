'use client'

import React from 'react'
import InterviewCard from './interview-card'

const mockInterviews = [
  { id: 1, intervieweeName: "Fletcher Miles-Thompson", date: "2024-08-07", duration: 45, status: "ready for review", interviewType: "Customer Churn" },
  { id: 2, intervieweeName: "Jane Smith-Johnson", date: "2024-08-08", duration: 60, status: "reviewed", interviewType: "Customer Churn" },
  { id: 3, intervieweeName: "Alexander Worthington III", date: "2024-08-09", duration: 30, status: "ready for review", interviewType: "Product Feedback" },
  { id: 4, intervieweeName: "Sophia Rodriguez-Garcia", date: "2024-08-10", duration: 75, status: "reviewed", interviewType: "Customer Satisfaction" },
  { id: 5, intervieweeName: "Olivia Patel-Williams", date: "2024-08-11", duration: 50, status: "ready for review", interviewType: "Feature Request" },
  { id: 6, intervieweeName: "Ethan Christopher Lee", date: "2024-08-12", duration: 55, status: "reviewed", interviewType: "User Experience" }
]

export default function InterviewDashboard() {
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-6">Your Customer Interviews</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
        {mockInterviews.map((interview) => (
          <InterviewCard
            key={interview.id}
            intervieweeName={interview.intervieweeName}
            date={interview.date}
            duration={interview.duration}
            status={interview.status as 'ready for review' | 'reviewed'}
            interviewType={interview.interviewType}
            onClick={() => console.log(`Clicked interview ${interview.id}`)}
          />
        ))}
      </div>
    </div>
  )
}