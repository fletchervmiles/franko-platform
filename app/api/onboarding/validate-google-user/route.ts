import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"

const BLOCKED_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'icloud.com', 'aol.com', 'protonmail.com', 'tutanota.com',
  'mail.com', 'yandex.com', 'zoho.com', 'live.com', 'msn.com'
]

export async function POST() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user details from Clerk
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(userId)
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const email = user.emailAddresses[0]?.emailAddress
    if (!email) {
      return NextResponse.json({ error: "No email found" }, { status: 400 })
    }

    // Check if it's a business email
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain || BLOCKED_DOMAINS.includes(domain)) {
      // Delete the user account since they used a personal email
      await clerk.users.deleteUser(userId)
      
      return NextResponse.json({ 
        shouldBlock: true,
        message: "Personal email addresses are not allowed. Please use your work email to sign up."
      })
    }

    // Email is valid, allow them to continue
    return NextResponse.json({ 
      shouldBlock: false,
      email: email
    })

  } catch (error) {
    console.error('Error validating Google user:', error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
} 