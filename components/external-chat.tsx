// /**
//  * External Chat Component
//  * 
//  * This client component handles the main chat interface for external users:
//  * 1. Manages chat state using the AI SDK's useChat hook
//  * 2. Renders messages and handles user input
//  * 3. Processes AI responses and tool invocations
//  * 4. Handles navigation to completion page when chat ends
//  * 5. Shows progress indicators and loading states
//  * 
//  * This is the core UI component that external users interact with when
//  * participating in a conversation. It handles all real-time chat functionality
//  * and communicates with the backend API.
//  */

// "use client"

// import { cn } from "@/lib/utils"
// import { useState, useEffect, useRef } from "react"
// import { Message } from "ai"
// import { useChat } from "ai/react"
// import { Message as ChatMessage } from "@/components/message"
// import { ChatInput } from "@/components/input"
// import { ExternalChatProgress } from "@/components/external-chat-progress"
// import { useRouter } from "next/navigation"
// import { Loader2 } from "lucide-react"

// interface ExternalChatProps {
//   chatInstanceId: string       // ID of the chat instance
//   chatResponseId: string       // ID of the chat response record
//   initialMessages: Message[]   // Initial messages to display
// }

// export function ExternalChat({
//   chatInstanceId,
//   chatResponseId,
//   initialMessages = [],
// }: ExternalChatProps) {
//   const router = useRouter()
//   const messagesEndRef = useRef<HTMLDivElement>(null)
//   const [autoScrollEnabled, setAutoScrollEnabled] = useState(true)
//   const [showProgressBar, setShowProgressBar] = useState(false)
//   const [isInitializing, setIsInitializing] = useState(true)
//   const [userMessageCount, setUserMessageCount] = useState(0)

//   // Use the AI SDK's useChat hook to manage the chat state
//   const {
//     messages,
//     input,
//     handleInputChange,
//     handleSubmit,
//     isLoading,
//     error,
//     setInput,
//     stop
//   } = useChat({
//     api: "/api/external-chat",
//     id: chatResponseId,
//     body: {
//       chatInstanceId,
//       chatResponseId
//     },
//     initialMessages
//   })

//   // Send initial message
//   useEffect(() => {
//     const sendInitialMessage = async () => {
//       try {
//         const response = await fetch(`/api/chat-responses/${chatResponseId}`);
//         let greeting = "Hi, I'm ready!";
        
//         if (response.ok) {
//           const chatResponseData = await response.json();
//           if (chatResponseData.intervieweeFirstName) {
//             greeting = `Hi, I'm ${chatResponseData.intervieweeFirstName} and I'm ready!`;
//           }
//         }

//         setInput(greeting);
//         await handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
//         setIsInitializing(false);
//       } catch (error) {
//         console.error("Error sending initial message:", error);
//         setInput("Hi, I'm ready!");
//         await handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
//         setIsInitializing(false);
//       }
//     };

//     if (isInitializing && chatResponseId) {
//       sendInitialMessage();
//     }
//   }, [chatResponseId, isInitializing, handleSubmit, setInput]);

//   // Track user messages for progress bar
//   useEffect(() => {
//     const userMessages = messages.filter(m => m.role === 'user');
//     if (userMessages.length > 1) {
//       setUserMessageCount(userMessages.length);
//     }
//   }, [messages]);

//   useEffect(() => {
//     if (userMessageCount >= 2) {
//       setShowProgressBar(true);
//     }
//   }, [userMessageCount]);

//   // Auto-scroll effect
//   useEffect(() => {
//     if (autoScrollEnabled) {
//       scrollToBottom()
//     }
//   }, [messages, autoScrollEnabled])

//   const scrollToBottom = () => {
//     if (messagesEndRef.current) {
//       messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
//     }
//   }

//   // Show loading screen while initializing
//   if (isInitializing) {
//     return (
//       <div className="flex h-full items-center justify-center">
//         <div className="text-center">
//           <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
//           <p className="mt-2 text-sm text-muted-foreground">
//             Initializing conversation...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // Render chat interface
//   return (
//     <div className="flex h-full flex-col">
//       <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-14">
//         <div className="mx-auto max-w-4xl space-y-8 py-8">
//           {/* Show messages (excluding the first greeting) */}
//           {messages.slice(1).map((message, index) => (
//             <ChatMessage
//               key={message.id}
//               content={message.content}
//               isUser={message.role === "user"}
//               toolInvocations={message.toolInvocations}
//               chatId={chatResponseId}
//               isLoading={isLoading && index === messages.length - 2 && message.role !== "user"}
//               messageIndex={index}
//               allMessages={messages.slice(1)}
//               isFirstInTurn={index === 0 || messages[index + 1]?.role !== message.role}
//             />
//           ))}

//           {/* Show loading indicator for AI responses */}
//           {isLoading && messages[messages.length - 1]?.role === "user" && (
//             <ChatMessage
//               content=""
//               isUser={false}
//               chatId={chatResponseId}
//               isLoading={true}
//               messageIndex={-1}
//               allMessages={[]}
//               isFirstInTurn={true}
//             />
//           )}

//           {error && (
//             <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
//               <p className="font-medium">Error</p>
//               <p>{error.message}</p>
//             </div>
//           )}

//           <div ref={messagesEndRef} />
//         </div>
//       </div>

//       <div className="sticky bottom-0 bg-background border-t px-4 py-2 md:px-8 lg:px-12">
//         <div className="mx-auto max-w-4xl">
//           <ChatInput
//             value={input}
//             onChange={handleInputChange}
//             onSubmit={handleSubmit}
//             disabled={isLoading}
//             showProgressBar={showProgressBar}
//             progressBar={showProgressBar ? 
//               <ExternalChatProgress 
//                 chatResponseId={chatResponseId} 
//                 messageCount={messages.length} 
//               /> : undefined
//             }
//             stop={stop}
//           />
//         </div>
//       </div>
//     </div>
//   )
// } 

"use client";

import { useState, useEffect, useRef } from "react";
import { useChat, Message } from "ai/react";
import { Loader2 } from "lucide-react";

import { Message as ChatMessage } from "@/components/message";
import { ChatInput } from "@/components/input";
import { ExternalChatProgress } from "@/components/external-chat-progress";

interface ExternalChatProps {
  chatInstanceId: string;
  chatResponseId: string;
  initialMessages: Message[];
}

export function ExternalChat({
  chatInstanceId,
  chatResponseId,
  initialMessages = [],
}: ExternalChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showProgressBar, setShowProgressBar] = useState(false);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setInput,
    error,
    stop,
  } = useChat({
    api: "/api/external-chat",
    id: chatResponseId,
    body: { chatInstanceId, chatResponseId },
    initialMessages,
  });

  // Send auto greeting once at initialization.
  useEffect(() => {
    async function sendGreeting() {
      try {
        let greeting = "Hi, I'm ready!";

        const res = await fetch(`/api/chat-responses/${chatResponseId}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.intervieweeFirstName) {
            greeting = `Hi, I'm ${data.intervieweeFirstName} and I'm ready!`;
          }
        }

        setInput(greeting);

        // handleSubmit expects a form event with preventDefault
        await handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);

        // Clear input after sending the auto message
        setInput("");
      } catch (error) {
        console.error("Auto greeting failed", error);
      } finally {
        setIsInitializing(false); // Done initializing after message sent
      }
    }

    if (isInitializing && chatResponseId) {
      sendGreeting();
    }
  }, [isInitializing, chatResponseId, setInput, handleSubmit]);

  // Loader screen during initialization
  if (isInitializing) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            Initializing conversation...
          </p>
        </div>
      </div>
    );
  }

  // Render actual conversation once initialized
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-14">
        <div className="mx-auto max-w-4xl space-y-8 py-8">
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              content={message.content}
              isUser={message.role === "user"}
              chatId={chatResponseId}
              isLoading={
                isLoading &&
                index === messages.length - 1 &&
                message.role === "user"
              }
              toolInvocations={message.toolInvocations}
              messageIndex={index}
              allMessages={messages}
              isFirstInTurn={
                index === 0 || messages[index - 1]?.role !== message.role
              }
            />
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <ChatMessage
              content=""
              isUser={false}
              chatId={chatResponseId}
              isLoading={true}
              messageIndex={-1}
              allMessages={[]}
              isFirstInTurn={true}
            />
          )}

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
              <p className="font-medium">Error</p>
              <p>{error.message}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="sticky bottom-0 bg-background border-t px-4 py-2 md:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <ChatInput
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            disabled={isLoading}
            showProgressBar={showProgressBar}
            progressBar={
              showProgressBar && (
                <ExternalChatProgress
                  chatResponseId={chatResponseId}
                  messageCount={messages.length}
                />
              )
            }
            stop={stop}
          />
        </div>
      </div>
    </div>
  );
}