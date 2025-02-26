import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createChatInstance } from "@/db/queries/chat-instances-queries"
import { generateUUID } from "@/lib/utils"

export async function POST() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Create a new chat instance with empty messages and initial progress
    const chatId = generateUUID()
    const emptyMessages = JSON.stringify([])
    
    const initialProgress = {
      objectives: {
        obj1: { status: "current" },
        obj2: { status: "tbc" },
        obj3: { status: "tbc" },
        obj4: { status: "tbc" }
      }
    }
    
    const chat = await createChatInstance({
      id: chatId,
      userId,
      messages: emptyMessages,
      objectiveProgress: initialProgress
    })

    return NextResponse.json({ id: chat.id })
  } catch (error) {
    console.error("Failed to create chat instance:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 