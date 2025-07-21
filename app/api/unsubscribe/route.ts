import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { chatInstancesTable } from "@/db/schema/chat-instances-schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const chatId = url.searchParams.get("chatId");
  if (!chatId) {
    return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
  }

  try {
    await db
      .update(chatInstancesTable)
      .set({ responseEmailNotifications: false })
      .where(eq(chatInstancesTable.id, chatId));

    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:system-ui,Arial,sans-serif;padding:40px;text-align:center;">
        <h2 style="margin-bottom:16px;">You've been unsubscribed</h2>
        <p style="color:#475569;">You will no longer receive response emails from this modal.</p>
        <a href="https://franko.ai/responses" style="display:inline-block;margin-top:24px;text-decoration:none;background:#E4F222;color:#0c0a08;padding:12px 24px;border-radius:6px;font-weight:600;">Return to Dashboard</a>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 