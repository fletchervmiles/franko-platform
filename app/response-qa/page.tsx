// import { NavSidebar } from "@/components/nav-sidebar"
// import { ResponseQALanding } from "@/components/response-qa-landing"
// import { auth } from "@clerk/nextjs/server"
// import { redirect } from "next/navigation"
// import { getInternalChatSessionById, createInternalChatSession } from "@/db/queries/internal-chat-sessions-queries"
// import { getChatInstanceById } from "@/db/queries/chat-instances-queries"

// // Define interface for page props with searchParams
// interface ResponseQAPageProps {
//   searchParams: {
//     sessionId?: string
//   }
// }

// export default async function ResponseQAPage({ searchParams }: ResponseQAPageProps) {
//   const { userId } = await auth()
//   const { sessionId } = searchParams
  
//   // Redirect to login if not authenticated
//   if (!userId) {
//     redirect("/sign-in")
//   }
  
//   // If a session ID wasn't provided, create a new one and redirect with it
//   if (!sessionId) {
//     try {
//       // Create a new empty session
//       const newSession = await createInternalChatSession({
//         userId,
//         title: "Response Analysis",
//         selectedResponses: [], // Start with an empty array
//       });
      
//       // Redirect to the same page but with the new session ID
//       const url = `/response-qa?sessionId=${newSession.id}`;
//       return redirect(url);
//     } catch (error) {
//       console.error("Error creating initial session:", error);
//     }
//   }
  
//   // If a session ID was provided, validate it exists and belongs to the user
//   let initialConversation = null
  
//   if (sessionId) {
//     const session = await getInternalChatSessionById(sessionId)
    
//     // Redirect to main page if session not found or doesn't belong to this user
//     if (!session || session.userId !== userId) {
//       console.error("Session not found or unauthorized", { sessionId, userId })
//       return redirect("/response-qa")
//     }
    
//     // Get the conversation IDs from the session
//     try {
//       const selectedResponses = JSON.parse(session.selectedResponses as string || '[]')
      
//       // If there are selected responses, fetch the first one to display in UI
//       if (selectedResponses && selectedResponses.length > 0) {
//         const conversationId = selectedResponses[0]
//         const conversation = await getChatInstanceById(conversationId)
        
//         if (conversation) {
//           // Extract the title safely
//           let conversationTitle = 'Untitled Conversation'
          
//           // Try to get the title from the conversationPlan if it exists
//           if (conversation.conversationPlan) {
//             try {
//               const planData = typeof conversation.conversationPlan === 'string'
//                 ? JSON.parse(conversation.conversationPlan)
//                 : conversation.conversationPlan;
              
//               if (planData && planData.title) {
//                 conversationTitle = planData.title;
//               }
//             } catch (error) {
//               console.error("Error parsing conversation plan:", error);
//             }
//           }
          
//           initialConversation = {
//             id: conversation.id,
//             title: conversationTitle,
//             responseCount: 0, // We don't have this info readily available
//             wordCount: 0      // We don't have this info readily available
//           }
//         }
//       }
//     } catch (error) {
//       console.error("Error parsing selected responses:", error)
//     }
//   }
  
//   return (
//     <NavSidebar>
//       <div className="h-full flex flex-col">
//         {/* <div className="p-4 border-b">
//           <h1 className="text-xl font-bold">Response Analysis</h1>
//           <p className="text-sm text-muted-foreground">
//             Ask questions about your collected responses
//           </p>
//         </div> */}
//         <div className="flex-grow overflow-hidden">
//           <ResponseQALanding 
//             userId={userId} 
//             existingSessionId={sessionId}
//             existingConversation={initialConversation}
//           />
//         </div>
//       </div>
//     </NavSidebar>
//   )
// }


import { NavSidebar } from "@/components/nav-sidebar"
import { ResponseQALanding } from "@/components/response-qa-landing"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function ResponseQAPage() {
  const { userId } = await auth()
  
  // Redirect to login if not authenticated
  if (!userId) {
    redirect("/sign-in")
  }
  
  return (
    <NavSidebar>
      <div className="h-full flex flex-col">
        <div className="flex-grow overflow-hidden">
          <ResponseQALanding userId={userId} />
        </div>
      </div>
    </NavSidebar>
  )
}