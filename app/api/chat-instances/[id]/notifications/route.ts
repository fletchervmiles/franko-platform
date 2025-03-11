import { db } from "@/db/db";
import { chatInstancesTable } from "@/db/schema/chat-instances-schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const chatInstanceId = params.id;
    if (!chatInstanceId) {
      return NextResponse.json(
        { error: "Chat instance ID is required" },
        { status: 400 }
      );
    }

    // Get the request body
    const body = await request.json();

    // Validate that the notification setting is a boolean
    if (typeof body.response_email_notifications !== 'boolean') {
      return NextResponse.json(
        { error: "response_email_notifications must be a boolean" },
        { status: 400 }
      );
    }

    // Update the chat instance
    const result = await db
      .update(chatInstancesTable)
      .set({
        responseEmailNotifications: body.response_email_notifications,
        updatedAt: new Date(),
      })
      .where(
        eq(chatInstancesTable.id, chatInstanceId)
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Chat instance not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: result[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return NextResponse.json(
      { error: "An error occurred while updating notification settings" },
      { status: 500 }
    );
  }
} 