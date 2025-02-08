# Implementation Plan: Basic Chat Functionality

Below is a detailed plan for implementing a basic chatbot using the Vercel AI SDK in **Next.js**. We’ll assume you already have:

- A Next.js App Router project structure
- Clerk (or another auth solution) for user authentication
- A Postgres + Drizzle database set up (or some other database to store conversation history)

This guide will walk you through creating new conversations, displaying a simple chat UI, sending requests to an API route using Vercel AI SDK’s `streamText`, and storing messages in your database.

---

## Overview of the Steps

1. [Create an API Route](#1-create-an-api-route)
2. [Create a Dynamic Chat Page (`/create-conversation/[id]`)](#2-create-a-dynamic-chat-page)
3. [Add a "Create Conversation" Button](#3-add-a-create-conversation-button)
4. [Implement DB Persistence for Chat Messages](#4-implement-db-persistence-required)

---

## 1. Create an API Route

### 1.1 Set Up `app/api/chat/route.ts`

We've created a new route file:  
app\api\chat\route.ts


**Objective**: Accept incoming messages from the client, process them with `streamText` from the Vercel AI SDK, and stream the AI responses back to the client.

<details>
<summary>Example Implementation</summary>

```ts
import { NextResponse } from "next/server"
// Example: If you're using google gemini, import that:
import { google } from "@ai-sdk/google"
import { streamText, convertToCoreMessages } from "ai"

// If you prefer OpenAI, you might do:
// import { openai } from "@ai-sdk/openai"

export async function POST(req: Request) {
  try {
    // 1) Parse the request body
    const { messages, id } = await req.json()

    // 2) Convert messages to the AI Core format (optional, but helpful)
    // If you're already using AI's "Message" format, you may skip or adapt.
    const coreMessages = convertToCoreMessages(messages)

    // 3) Call streamText with your chosen model
    // Example with Google Gemini. Adjust to your liking.
    const result = await streamText({
      model: google("gemini-2.0-flash-exp"),
      system: "You are a friendly AI assistant.",
      messages: coreMessages,

      // 4) Optionally handle finishing to do DB updates, usage tracking, etc.
      onFinish: async ({ responseMessages }) => {
        // We'll handle DB saving in step #4 of the plan
        // If you want to store partial chat logs now, you can do so here
      },
    })

    // 5) Return streaming response back to the client
    return result.toDataStreamResponse({})

  } catch (error) {
    console.error("Chat route error:", error)
    return NextResponse.json(
      { error: "Something went wrong with the AI request." },
      { status: 500 }
    )
  }
}

</details>
```

**Important:**

- This route expects an array of messages and a conversation id from the client.
- If you are using Clerk authentication, you can optionally verify the user’s identity here (by reading the auth() inside or using the Clerk middleware).
- For now, we only handle the streaming text. Storing messages in the DB or updating them will happen in step #4.


# Create a Dynamic Chat Page

We’ll use Next.js dynamic routes for our chat. We've defined the route structure as:
app\create-conversation\[id]\page.tsx

**Why:**

- Each conversation has a unique ID.
- Once the user creates a conversation (either in the database or ephemeral), they’ll be redirected to "/create-conversation/<some-id>".
- This page will show the chat UI (powered by the AI SDK’s useChat hook).

## 2.1 Route File: /create-conversation/[id]/page.tsx

<details> <summary>Example Implementation</summary>

// app/create-conversation/[id]/page.tsx
"use client"

import { useParams } from "next/navigation"
import { useChat } from "ai/react"
import React from "react"

/**
 * This is the page for an ongoing conversation.
 * The [id] is the conversation's unique identifier.
 */
export default function ConversationPage() {
  // 1) Extract the dynamic route param: conversation "id"
  const params = useParams()
  const conversationId = params?.id // string

  /**
   * 2) Set up the useChat hook:
   * - api: "/api/chat" => the endpoint we created in step 1
   * - id: conversationId => so each conversation is identified on the server side
   * - initialMessages: if we want to fetch from DB, we can do it here or in step #4
   */
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
  } = useChat({
    api: "/api/chat",
    id: conversationId,
  })

  /**
   * 3) Basic UI:
   * - We show each message
   * - We allow the user to submit new messages via a form
   * - Provide a "Stop" button to abort streaming if needed
   */
  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold">Conversation: {conversationId}</h1>

      {/* Display existing messages */}
      <div className="space-y-2 bg-white p-2 rounded">
        {messages.map((m) => (
          <div key={m.id} className="border-b pb-2">
            <p>
              <strong>{m.role === "user" ? "User" : "Assistant"}:</strong>{" "}
              {m.content}
            </p>
          </div>
        ))}
      </div>

      {/* Show loading spinner or "Stop" button if AI is streaming */}
      {isLoading && (
        <button className="bg-gray-200 py-1 px-2 rounded" onClick={stop}>
          Stop Generation
        </button>
      )}

      {/* Form to send new user messages */}
      <form
        onSubmit={(e) => {
          // We call handleSubmit, which triggers the API call to /api/chat
          handleSubmit(e)
        }}
        className="flex gap-2 items-center"
      >
        <input
          className="border p-2 flex-grow"
          placeholder="Your message..."
          value={input}
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded"
          disabled={isLoading}
        >
          Send
        </button>
      </form>
    </div>
  )
}

</details>

Note, this is the existing code for app\create-conversation\[id]\page.tsx

```typescript
import RootLayout from "@/components/custom-ui/nav"
import CreateConversation from "@/components/custom-ui/create-conversation"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function CreateConversationPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <RootLayout>
      <div className="h-full bg-background">
        <CreateConversation />
      </div>
    </RootLayout>
  )
}
```

**Key Points:**

- useChat automatically:
  - Maintains the messages[] state
  - Appends new AI responses as streaming data arrives from the /api/chat route
  - Streams partial responses in real-time
  - Provides isLoading, stop(), error states, etc.


# 3. Add a "Create Conversation" Button

We assume you already have a CreateConversation component that the user clicks to begin a new conversation. Let’s add some logic so that when they click “Create Conversation,” we create a conversation ID (in the DB or ephemeral) and then navigate to /create-conversation/[id].

## 3.1 Example Button Flow

"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"  // or your own button

export default function CreateConversation() {
  const router = useRouter()

  // This function calls an endpoint that returns a new conversation ID.
  // We'll make a small "create conversation" endpoint or do it inline if you prefer
  async function handleCreateConversation() {
    try {
      // example fetch to a "create conversation" endpoint
      const res = await fetch("/api/new-conversation", {
        method: "POST",
      })
      const { id } = await res.json()

      // Navigate to that conversation’s page
      router.push(`/create-conversation/${id}`)
    } catch (error) {
      console.error("Failed to create new conversation:", error)
    }
  }

  return (
    <Button onClick={handleCreateConversation}>
      Create Conversation
    </Button>
  )
}

**Existing Create Conversation Button**

components\custom-ui\create-conversation.tsx

```typescript
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react'
import { useRouter } from "next/navigation"
import UserAvatar from "@/public/assets/user_avatar.svg"
import Image from "next/image"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

export default function CreateConversation() {
  const router = useRouter()
  
  const onClick = () => {
    router.push("/create-conversation-chat")
  }

  return (
    <div className="w-full h-full p-4">
      <Card 
        className="w-full h-full cursor-pointer transition-all hover:shadow-md flex flex-col items-center justify-center bg-white gap-4 rounded-lg"
        onClick={onClick}
      >
        {/* Option 1: Light grey background with dark grey icon */}
        <Image 
          src={UserAvatar}
          alt="User Avatar"
          width={56}
          height={56}
          className="text-gray-600"
        />

        {/* Option 2: Dark grey background with light grey icon */}
        {/* <div className="rounded-full bg-gray-700 p-8">
          <Sparkles className="w-16 h-16 text-gray-200" />
        </div> */}

        {/* Option 3: Very light grey background with black icon */}
        {/* <div className="rounded-full bg-gray-50 p-8">
          <Sparkles className="w-16 h-16 text-black" />
        </div> */}

        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-xl font-semibold text-gray-900">
            No conversations yet.
          </h2>
          <p className="text-sm text-gray-500">
            Let's get started! Begin a quick and simple chat to create a personalized conversational AI to share with your recipients.
          </p>
        </div>
        <Button 
          className="bg-[#0070f3] hover:bg-[#0060d3] text-white mt-4"
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Conversation
        </Button>
      </Card>
    </div>
  )
}
```

## 3.2 Server Route for Conversation Creation (Optional)

If you want to store the conversation in your DB immediately, do something like:

```typescript
// app/api/new-conversation/route.ts
import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { createConversationInDb } from "@/db/someQueries"

export async function POST() {
  // 1) Generate ID
  const newId = randomUUID()

  // 2) Possibly store in the DB (an empty conversation row)
  await createConversationInDb(newId)

  // 3) Return ID to the client
  return NextResponse.json({ id: newId })
}
```

Then your CreateConversation client just hits /api/new-conversation.

# 4. Implement DB Persistence

## 4.1 Overview

We want to save the conversation’s messages in our database so that:

- The chat can be reloaded or resumed if the user refreshes
- We have historical logs or can reference them later

**Approach:**

- Load existing messages from the DB each time we open /create-conversation/[id].
- Append new user messages when the user sends them.
- Append new AI response messages in the onFinish callback from streamText.

## 4.2 Database Setup

We will need to create a new table. 

Think through all the fields we may need.

-- Example pseudo-table in Drizzle or raw SQL
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,           -- clerk or your user ID
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

<example_files_database>
**Example of Existing Database Schema and other files**

db\schema\interviews-schema.ts

```typescript
import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";

export const interviewsTable = pgTable("interviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  clientName: text("client_name").notNull(),
  uniqueCustomerIdentifier: text("unique_customer_identifier").notNull(),
  useCase: text("use_case").notNull(),
  intervieweeFirstName: text("interviewee_first_name").notNull(),
  intervieweeLastName: text("interviewee_last_name").notNull(),
  intervieweeEmail: text("interviewee_email").notNull(),
  intervieweeNumber: text("interviewee_number"),
  callId: text("call_id").notNull(),
  status: text("status").notNull().default("ready for review"),
  dateCompleted: timestamp("date_completed").notNull(),
  interviewStartTime: timestamp("interview_start_time").notNull(),
  interviewEndTime: timestamp("interview_end_time").notNull(),
  totalInterviewMinutes: integer("total_interview_minutes").notNull(),
  conversationHistoryRaw: text("conversation_history_raw"),
  conversationHistoryCleaned: text("conversation_history_cleaned"),
  interviewAudioLink: text("interview_audio_link"),
  clientCompanyDescription: text("client_company_description"),
  agentName: text("agent_name").notNull(),
  voiceId: text("voice_id").notNull(),
  analysisOutput: text("analysis_output"),
  analysisPart01: text("analysis_part01"),
  analysisPart02: text("analysis_part02"),
  analysisPart03: text("analysis_part03"),
  analysisPart04: text("analysis_part04"),
  analysisPart05: text("analysis_part05"),
  analysisPart06: text("analysis_part06"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertInterview = typeof interviewsTable.$inferInsert;
export type SelectInterview = typeof interviewsTable.$inferSelect; 
```

db\queries\interviews-queries.ts

```typescript
"use server";

import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { InsertInterview, interviewsTable, SelectInterview } from "../schema/interviews-schema";

export const createInterview = async (data: InsertInterview) => {
  try {
    const [newInterview] = await db.insert(interviewsTable).values(data).returning();
    return newInterview;
  } catch (error) {
    console.error("Error creating interview:", error);
    throw new Error("Failed to create interview");
  }
};

export const getInterviewById = async (id: string) => {
  try {
    const interview = await db.query.interviews.findFirst({
      where: eq(interviewsTable.id, id),
    });
    
    if (interview) {
      // Normalize status value
      return {
        ...interview,
        status: interview.status?.toLowerCase() === 'reviewed' ? 'reviewed' : 'ready for review'
      };
    }
    return interview;
  } catch (error) {
    console.error("Error getting interview:", error);
    throw new Error("Failed to get interview");
  }
};

export const getInterviewsByUserId = async (userId: string): Promise<SelectInterview[]> => {
  try {
    const interviews = await db
      .select()
      .from(interviewsTable)
      .where(eq(interviewsTable.userId, userId));
    
    // Normalize status values
    return interviews.map(interview => ({
      ...interview,
      status: interview.status?.toLowerCase() === 'reviewed' ? 'reviewed' : 'ready for review'
    }));
  } catch (error) {
    console.error("Error getting interviews:", error);
    throw new Error("Failed to get interviews");
  }
};

export const getAllInterviews = async (): Promise<SelectInterview[]> => {
  return db.query.interviews.findMany();
};

export const updateInterview = async (id: string, data: Partial<InsertInterview>) => {
  try {
    const [updatedInterview] = await db
      .update(interviewsTable)
      .set(data)
      .where(eq(interviewsTable.id, id))
      .returning();
    return updatedInterview;
  } catch (error) {
    console.error("Error updating interview:", error);
    throw new Error("Failed to update interview");
  }
};

export const deleteInterview = async (id: string) => {
  try {
    await db.delete(interviewsTable).where(eq(interviewsTable.id, id));
  } catch (error) {
    console.error("Error deleting interview:", error);
    throw new Error("Failed to delete interview");
  }
}; 
```
db\actions\interviews-actions.ts
```typescript
"use server";

import { createInterview, updateInterview } from "@/db/queries/interviews-queries";
import { InsertInterview } from "@/db/schema/interviews-schema";
import { revalidatePath } from "next/cache";

type ActionState = {
  status: "success" | "error";
  message: string;
  data?: any;
};

export async function createInterviewAction(interview: InsertInterview): Promise<ActionState> {
  try {
    // Ensure status is set correctly for new interviews
    const normalizedInterview = {
      ...interview,
      status: interview.status?.toLowerCase() === 'reviewed' ? 'reviewed' : 'ready for review'
    };
    const newInterview = await createInterview(normalizedInterview);
    revalidatePath("/interview");
    return { status: "success", message: "Interview created successfully", data: newInterview };
  } catch (error) {
    console.error("Error creating interview:", error);
    return { status: "error", message: "Failed to create interview" };
  }
}

export async function updateInterviewAction(id: string, data: Partial<InsertInterview>): Promise<ActionState> {
  try {
    // Normalize status if it's being updated
    const normalizedData = {
      ...data,
      status: data.status ? 
        (data.status.toLowerCase() === 'reviewed' ? 'reviewed' : 'ready for review') 
        : undefined
    };
    const updatedInterview = await updateInterview(id, normalizedData);
    revalidatePath("/interview");
    return { status: "success", message: "Interview updated successfully", data: updatedInterview };
  } catch (error) {
    console.error("Error updating interview:", error);
    return { status: "error", message: "Failed to update interview" };
  }
} 
```

actions\interviews-actions.ts
```typescript
"use server";

import { createInterview, deleteInterview, getInterviewById, getAllInterviews, updateInterview } from "@/db/queries/interviews-queries";
import { InsertInterview } from "@/db/schema/interviews-schema";
import { ActionState } from "@/types";
import { revalidatePath } from "next/cache";

export async function createInterviewAction(interview: InsertInterview): Promise<ActionState> {
  try {
    const newInterview = await createInterview(interview);
    revalidatePath("/interview");
    return { status: "success", message: "Interview created successfully", data: newInterview };
  } catch (error) {
    console.error("Error creating interview:", error);
    return { status: "error", message: "Failed to create interview" };
  }
}

export async function getInterviewsAction(): Promise<ActionState> {
  try {
    const interviews = await getAllInterviews();
    return { status: "success", message: "Interviews retrieved successfully", data: interviews };
  } catch (error) {
    console.error("Error getting interviews:", error);
    return { status: "error", message: "Failed to get interviews" };
  }
}

export async function getInterviewAction(id: string): Promise<ActionState> {
  try {
    const interview = await getInterviewById(id);
    return { status: "success", message: "Interview retrieved successfully", data: interview };
  } catch (error) {
    console.error("Error getting interview by ID:", error);
    return { status: "error", message: "Failed to get interview" };
  }
}

export async function updateInterviewAction(id: string, data: Partial<InsertInterview>): Promise<ActionState> {
  try {
    const updatedInterview = await updateInterview(id, data);
    revalidatePath("/interview");
    return { status: "success", message: "Interview updated successfully", data: updatedInterview };
  } catch (error) {
    console.error("Error updating interview:", error);
    return { status: "error", message: "Failed to update interview" };
  }
}

export async function deleteInterviewAction(id: string): Promise<ActionState> {
  try {
    await deleteInterview(id);
    revalidatePath("/interview");
    return { status: "success", message: "Interview deleted successfully" };
  } catch (error) {
    console.error("Error deleting interview:", error);
    return { status: "error", message: "Failed to delete interview" };
  }
} 
```

</example_files_database>


## 4.3 Load Existing Messages

Modify your [id]/page.tsx to fetch existing messages from the DB. Because Next.js App Router can do data fetching in the layout or page, we can do:

<details> <summary>Loading messages in the server component</summary>

// app/create-conversation/[id]/page.tsx
```typescript
import { auth } from "@clerk/nextjs" // if you're using Clerk
import { getConversation } from "@/db/conversationsQueries"
import ConversationChatClient from "./chatClient"  // a separate client component to hold the chat UI

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const { userId } = auth()  // ensure user is logged in
  if (!userId) {
    // handle unauthorized
  }

  // 1) Get existing conversation from DB
  const conversation = await getConversation(params.id, userId)
  // conversation.messages might look like:
  // [{ id: "abc", role: "user", content: "hello" }, {id: "...", role: "assistant", content: "..."}]

  // 2) Pass the messages to a client component so we can use the "useChat" hook there
  return (
    <ConversationChatClient
      initialMessages={conversation?.messages ?? []}
      conversationId={params.id}
    />
  )
}
```
</details>

Then your client component ConversationChatClient.tsx can do:

```typescript
"use client"

import { useChat, Message } from "ai/react"
import React from "react"

type Props = {
  conversationId: string
  initialMessages: Message[]
}

export default function ConversationChatClient({ conversationId, initialMessages }: Props) {
  const {
    messages,
    handleSubmit,
    input,
    handleInputChange,
    isLoading,
    stop,
  } = useChat({
    api: "/api/chat",
    id: conversationId,
    initialMessages,
  })

  /* ...display messages, input form, etc... (similar to step 2.1) */
}
```

## 4.4 Storing Messages on the Server

In the server route (app/api/chat/route.ts), we can do the following:

1. Load the existing messages from DB
2. Append the user’s newly typed message
3. Let streamText run
4. In the onFinish callback, append the AI response messages
5. Save the updated conversation back in the DB

<details> <summary>Full Example with DB Saving</summary>

```typescript
// app/api/chat/route.ts
import { NextResponse } from "next/server"
import { google } from "@ai-sdk/google"
import { streamText, appendClientMessage, appendResponseMessages } from "ai"
import { getConversation, saveConversation } from "@/db/conversationsQueries"
import { auth } from "@clerk/nextjs" // optional if you're using Clerk

export async function POST(req: Request) {
  try {
    const { userId } = auth()  // optional check
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1) Parse incoming request
    const { messages, id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "Missing conversation ID" }, { status: 400 })
    }

    // 2) Load existing conversation from DB
    const conversation = await getConversation(id, userId)
    const existingMessages = conversation?.messages || []

    // 3) Append the user's new message to the conversation
    //    We assume messages[messages.length - 1] is the user's latest message
    let updatedMessages = appendClientMessage({
      messages: existingMessages,
      message: messages[messages.length - 1],
    })

    // 4) Call the LLM
    const result = await streamText({
      model: google("gemini-1.5-pro-002"),
      messages: updatedMessages,

      // 5) When the AI finishes responding, store the entire conversation
      onFinish: async ({ responseMessages }) => {
        // Append AI's response to the conversation
        const finalMessages = appendResponseMessages({
          messages: updatedMessages,
          responseMessages,
        })

        // Save to DB
        await saveConversation(id, userId, finalMessages)
      },
    })

    // 6) Return streamed response
    return result.toDataStreamResponse({})

  } catch (error) {
    console.error("Error in chat route:", error)
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    )
  }
}
```
</details>

**key lines**

- appendClientMessage merges the user’s newly typed message into the conversation.
- After the AI is done streaming, we do appendResponseMessages to add the AI’s final answer.
- Then we call saveConversation(id, userId, finalMessages) to store everything.

## 4.5 Example Database Query Functions

If you’re using Drizzle, you might have something like:

```typescript
// db/conversationsQueries.ts
import { db } from "./db" // your drizzle instance
import { conversations } from "./schema" // your Drizzle schema definitions

export async function getConversation(id: string, userId: string) {
  // fetch row with matching id and userId
  const [result] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
  return result
}

export async function saveConversation(id: string, userId: string, messages: any[]) {
  // update the messages JSON column
  await db
    .update(conversations)
    .set({ messages: JSON.stringify(messages) })
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
}
```
(Adjust column names to match your actual schema.)

## Final Recap

1. API Route (app/api/chat/route.ts):

- Uses streamText from Vercel AI SDK to handle user messages and return a streaming AI response.

2. Dynamic Chat Page (/create-conversation/[id]):

- A server component loads existing messages from the database.
- A client component calls useChat to handle user input and streaming AI replies.

3. Create Conversation Button:

- Possibly calls /api/new-conversation to generate an ID, then navigates to "/- create-conversation/[id]".

4. DB Persistence:

- On the server, load existing conversation messages.
- Append user messages, call the model, and then append AI messages in onFinish before saving to DB.

You now have a fully working system:

- Users can start new conversations.
- They see a simple text-based chatbot interface.
- All messages get saved to your database.
- They can refresh or revisit "/create-conversation/[id]" to see the entire conversation so far.