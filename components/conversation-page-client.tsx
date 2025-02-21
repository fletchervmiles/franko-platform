"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit2, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { ShareableLink } from "@/components/shareable-link"
import ConversationPlanForm from "@/components/conversation-plan-form"
import { ConversationResponses } from "@/components/conversation-responses"
import type { ConversationPlan } from "@/components/conversationPlanSchema"
import { EmailNotificationSetting } from "@/components/email-notification-setting"
import { IncentiveSetting } from "@/components/incentive-setting"
import { NavSidebar } from "@/components/nav-sidebar"

interface ConversationPageClientProps {
  params: {
    guideName: string
  }
  userId: string
}

export function ConversationPageClient({ params, userId }: ConversationPageClientProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [conversationPlan, setConversationPlan] = useState<ConversationPlan | null>(null)

  useEffect(() => {
    async function loadConversationPlan() {
      try {
        const response = await fetch(`/api/conversation-plan?chatId=${params.guideName}`);
        if (!response.ok) throw new Error('Failed to load plan');
        const plan = await response.json();
        if (plan) {
          setConversationPlan(plan);
        }
      } catch (error) {
        console.error("Error loading conversation plan:", error);
      }
    }
    loadConversationPlan();
  }, [params.guideName]);

  const handleDelete = () => {
    console.log("Deleting guide:", params.guideName)
    setShowDeleteDialog(false)
  }

  const handleRename = () => {
    console.log("Renaming guide:", params.guideName)
  }

  const handleConversationPlanSubmit = async (data: ConversationPlan) => {
    console.log("Saving conversation plan:", data)
    setConversationPlan(data)
  }

  // Mock data for ResponseCards
  const mockResponses = [
    {
      name: "Fletcher Miles",
      email: "fletchervmiles@gmail.com",
      completionRate: 100,
      completionDate: "2025-02-12",
      summary: `
### Cancellation Reason:  
- Low current usage due to varied role & desire to cut subscription costs (especially AI tools).

### Positive Product Perception:  
- Fletcher likes Cursor and its core features; plans to return.

### Valued Features:  
- Agent, chat, and documentation features are key for complex tasks, boosting confidence and efficiency.

### Improvement Suggestion:  
- Better handling of recurring bugs; specifically, avoiding repeated unhelpful solutions for documentation syntax issues.

### No Other Issues/Feature Requests:  
- Cancellation is not due to dissatisfaction with features, but usage and cost.
      `,
      transcript: `
**Fletcher**: Hi there  
  
**Franko**: Hi there! Thanks for joining this short conversation about why you decided to cancel your Cursor plan. It'll only take a few minutes. To get started, could you please provide your First Name, Last Name, and Email Address?  
  
**Fletcher**: Fletcher Miles, fletchervmiles@gmail.com  
  
**Franko**: Thanks, Fletcher! Let's dive in. So, what was the main reason you decided to cancel your Cursor subscription?  
  
**Fletcher**: I'm not using it much at the moment  
  
**Franko**: Got it, that makes sense. Could you tell me a bit more about why you're not using Cursor much at the moment?  
  
**Fletcher**: Yeah, basically I do lots of different stuff in my role and um. sometimes I code a lot and sometimes I focus on other things like marketing or product and so. yeah, it just my usage varies based on the time.  
  
**Franko**: That's understandable, your role requires flexibility. But just to double check, besides fluctuating usage, did any specific aspects of Cursor influence your decision to cancel?  
  
**Fletcher**: I guess just that I've got a lot of subscriptions at the moment so I cancel them whenever I can, especially new AI subscriptions which are adding up  
  
**Franko**: That's a really valid point, costs can add up quickly. Let's shift gears: How did Cursor's AI features, like code completion and natural language editing, meet your expectations when you were using it?  
  
**Fletcher**: I really like the product, it's definitely worth it and I'll be back for sure  
  
**Franko**: That's great to hear! When you were actively using Cursor, which features did you find most valuable or impressive?  
  
**Fletcher**: I use the agent a lot when I'm implementing big features of chunks of functionality. And I like the chat, just to explain things and help kind of bolster my understanding... those are the two main things and probably being able to add documentation is also helpful  
  
**Franko**: Oh that's really helpful feedback, thank you! I'd love to hear more about your experience when using those features. In terms of tangible benefits – can you describe some of the impacts on your own daily coding workflow? It might help to think back to your last productive coding session using Cursor.  
  
**Fletcher**: Well, I'm actually just finishing off some other work. Um, but then I know that I have a huge amount of functionality that I need to implement. And I know conceptually how I'm gonna do it. I'm going to write out the steps in a fair bit of detail, sort of functional and technical specification. And then with Cursor, I know I'll be able to do it pretty quickly and with a fair bit of confidence… which is great. So I'm kinda not stressed about that task and I'm not expecting it to take that long which is really awesome.  
  
**Franko**: That's amazing to hear – especially the confidence and reduced stress! It sounds like you've seen Cursor deliver before when you've written out detailed steps. Could you share a past working session where you used this approach and felt that same confidence and ease?  
  
**Fletcher**: um not anything specific but I do have a bunch of markdown files in a folder that are long implementation documents that I used whenever I need to implement a new feature or piece of functionality.  
  
**Franko**: That's helpful, and it sounds like a solid process. Now, let's switch gears: Are there any specific improvements or new features would you like to see in Cursor?  
  
**Fletcher**: I feel like it could do a better job of registering recurring bugs. I often end up having to fix the same bug or when I'm trying to fix a bug, it'll offer the same solution that has already been tried and hasn't worked. Kind of annoying  
  
**Franko**: That does sound annoying! Thanks for the clear example—it really helps. How often do you run into this, and are there specific bugs where it happens more often?  
  
**Fletcher**: Yes, it's often to do with specific documentation syntax  
  
**Franko**: Ah, documentation syntax—that's really helpful to know. Is there anything else, like an additional feature or integration, that might have made you reconsider canceling?  
  
**Fletcher**: Hmm I don't think so, nothing that comes to mind  
  
**Franko**: Okay, that's fine! Thanks so much for all of this incredible feedback. Just before we officially wrap up, is there anything else at all that you'd like to add?  
  
**Fletcher**: No, that's it  
  
**Franko**: Thanks so much for your time and valuable feedback, Fletcher! You are now being redirected.

      `,
    },
    {
      name: "Alex Johnson",
      email: "alex.johnson@example.com",
      completionRate: 95,
      completionDate: "2025-02-15",
      summary: `
**Cancellation Reason:** Found a more specialized tool for their specific development needs.

**Positive Aspects:** Appreciated Cursor's user interface and general AI capabilities.

**Areas for Improvement:** Suggested more customization options for language-specific features.

**Potential Return:** Open to reconsidering Cursor if new features align with their workflow.

**Additional Feedback:** Recommended expanding the range of supported programming languages and frameworks.
      `,
      transcript: `
Alex: Hello
Franko: Hi there! Thanks for taking the time to chat about your experience with Cursor. To get started, could you please provide your First Name, Last Name, and Email Address?
Alex: Sure, it's Alex Johnson, alex.johnson@example.com
Franko: Thanks, Alex! Let's dive into the conversation. What was the primary reason you decided to cancel your Cursor subscription?
Alex: I found a tool that's more tailored to my specific development needs.
Franko: I see. Could you elaborate on what specific needs this other tool addresses that Cursor didn't?
Alex: Well, I work primarily with a niche programming language, and the new tool has more specialized features for it.
Franko: That makes sense. During your time using Cursor, what aspects did you find most valuable or impressive?
Alex: I really liked Cursor's user interface and the general AI capabilities. It was intuitive to use.
Franko: That's great to hear. Were there any features or aspects of Cursor that you felt could be improved?
Alex: I think having more customization options for language-specific features would be beneficial.
Franko: Thank you for that feedback. It's very helpful. Is there anything that might make you reconsider using Cursor in the future?
Alex: If Cursor expanded its language support or introduced features that align better with my workflow, I'd definitely consider coming back.
Franko: Noted. Before we wrap up, do you have any additional comments or suggestions for us?
Alex: I think expanding the range of supported programming languages and frameworks could be really valuable for developers in various niches.
Franko: That's excellent feedback, Alex. Thank you so much for your time and insights. Is there anything else you'd like to add before we conclude?
Alex: No, that's all. Thanks for listening to my feedback.
Franko: Thank you again, Alex. Your feedback is invaluable to us. You'll now be redirected. Have a great day!
      `,
    },
  ]

  // Mock data for ConversationResponses
  const mockResponsesData = {
    responses: mockResponses.length,
    totalCustomerWords: mockResponses.reduce((total, response) => total + response.transcript.split(" ").length, 0),
    completionRate: mockResponses.reduce((sum, response) => sum + response.completionRate, 0) / mockResponses.length,
    responseData: mockResponses,
  }

  return (
    <NavSidebar>
      <div className="w-full p-4 md:p-8 lg:p-12 space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black">
            {conversationPlan?.title || "Untitled Conversation"}
          </h1>
          <div className="flex items-center gap-2">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/user_avatar-P2kgEUysCcRUdgA5eE93X7hWpXLVKx.svg"
              alt="User avatar"
              className="h-8 w-8"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 border-gray-200">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-500"
                  >
                    <path
                      d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleRename}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="plan" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0">
            <TabsTrigger
              value="share"
              className="group relative rounded-none border-b-2 border-transparent px-4 h-12 data-[state=active]:border-black data-[state=active]:shadow-none transition-colors duration-200 ease-in-out"
            >
              <span className="relative z-10 p-2 rounded-lg group-hover:bg-gray-100">Share</span>
            </TabsTrigger>
            <TabsTrigger
              value="plan"
              className="group relative rounded-none border-b-2 border-transparent px-4 h-12 data-[state=active]:border-black data-[state=active]:shadow-none transition-colors duration-200 ease-in-out"
            >
              <span className="relative z-10 p-2 rounded-lg group-hover:bg-gray-100">Plan</span>
            </TabsTrigger>
            <TabsTrigger
              value="responses"
              className="group relative rounded-none border-b-2 border-transparent px-4 h-12 data-[state=active]:border-black data-[state=active]:shadow-none transition-colors duration-200 ease-in-out"
            >
              <span className="relative z-10 p-2 rounded-lg group-hover:bg-gray-100">Responses</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="group relative rounded-none border-b-2 border-transparent px-4 h-12 data-[state=active]:border-black data-[state=active]:shadow-none transition-colors duration-200 ease-in-out"
            >
              <span className="relative z-10 p-2 rounded-lg group-hover:bg-gray-100">Settings</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="share" className="mt-10">
            <ShareableLink guideName={params.guideName} />
          </TabsContent>
          <TabsContent value="plan" className="mt-10">
            <Card className="rounded-[6px] border shadow-sm overflow-hidden bg-[#FAFAFA]">
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-2 flex items-center">
                  Conversation Plan
                  <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span>
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  This is where you can view and edit your conversation plan. Use this to structure your interview and
                  ensure you cover all necessary points.
                </p>
                <ConversationPlanForm 
                  chatId={params.guideName} 
                  onSubmit={handleConversationPlanSubmit} 
                  initialData={conversationPlan} 
                />
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="responses" className="mt-10">
            <ConversationResponses {...mockResponsesData} />
          </TabsContent>
          <TabsContent value="settings" className="mt-10">
            <Card className="rounded-[6px] border bg-[#FAFAFA] shadow-sm">
              <div className="p-6 space-y-6">
                <div className="bg-white rounded-[6px] shadow-sm">
                  <EmailNotificationSetting />
                </div>
                <div className="bg-white rounded-[6px] shadow-sm">
                  <IncentiveSetting />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>This will also delete all of your conversation responses.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </NavSidebar>
  )
} 