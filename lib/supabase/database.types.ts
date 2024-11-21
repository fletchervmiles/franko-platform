export type Database = {
  public: {
    Tables: {
      interviews: {
        Row: {
            id: string
            userId: string
            clientName: string
            uniqueCustomerIdentifier: string
            useCase: string
            intervieweeFirstName: string
            intervieweeLastName: string
            intervieweeEmail: string
            intervieweeNumber: string | null
            callId: string
            status: string
            dateCompleted: string
            interviewStartTime: string
            interviewEndTime: string
            totalInterviewMinutes: number
            conversationHistoryRaw: string | null
            conversationHistoryCleaned: string | null
            interviewAudioLink: string | null
            clientCompanyDescription: string | null
            agentName: string
            voiceId: string
            analysisOutput: string | null
            analysisPart01: string | null
            analysisPart02: string | null
            analysisPart03: string | null
            analysisPart04: string | null
            analysisPart05: string | null
            analysisPart06: string | null
            createdAt: string
            updatedAt: string
        }
        Insert: {
          [x: string]: any
        }
        Update: {
          [x: string]: any
        }
      }
      profiles: {
        Row: {
          id: string
          userId: string
          email: string | null
          companyName: string | null
          membership: 'free' | 'pro'
          stripeCustomerId: string | null
          stripeSubscriptionId: string | null
          firstName: string | null
          secondName: string | null
          companyUrl: string | null
          companyDescription: string | null
          companyDescriptionCompleted: boolean
          minutesTotalUsed: number
          minutesUsedThisMonth: number
          minutesAvailable: number
          createdAt: Date
          updatedAt: Date
          agentInterviewerName: string | null
          voiceId: string | null
        }
        Insert: {
          [x: string]: any
        }
        Update: {
          [x: string]: any
        }
      }
    }
  }
} 