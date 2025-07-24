import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { modalsTable } from "@/db/schema/modals-schema";
import { chatInstancesTable } from "@/db/schema/chat-instances-schema";
import { chatResponsesTable } from "@/db/schema/chat-responses-schema";
import { eq, and } from "drizzle-orm";

export const dynamic = 'force-dynamic';

/**
 * GET /api/modals/with-responses
 * Returns a list of the user's modals that have at least one response, with:
 * - modal id & name (title)
 * - aggregated response count & total words
 * - array of chatInstanceIds that belong to the modal
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all responses joined with their chat instances & modals for this user
    const rows = await db
      .select({
        modalId: modalsTable.id,
        modalName: modalsTable.name,
        chatInstanceId: chatInstancesTable.id,
        userWords: chatResponsesTable.user_words,
      })
      .from(chatResponsesTable)
      .leftJoin(chatInstancesTable, eq(chatResponsesTable.chatInstanceId, chatInstancesTable.id))
      .leftJoin(modalsTable, eq(chatInstancesTable.modalId, modalsTable.id))
      .where(and(eq(chatResponsesTable.userId, userId)));

    // Aggregate rows by modal
    const modalMap = new Map<string, {
      title: string;
      chatInstanceIds: Set<string>;
      responseCount: number;
      wordCount: number;
    }>();

    for (const row of rows) {
      if (!row.modalId) continue; // skip rows without modal (legacy data)
      const existing = modalMap.get(row.modalId) || {
        title: row.modalName || "Untitled Modal",
        chatInstanceIds: new Set<string>(),
        responseCount: 0,
        wordCount: 0,
      };

      if (row.chatInstanceId) existing.chatInstanceIds.add(row.chatInstanceId);
      existing.responseCount += 1;

      const words = Number(row.userWords || "0");
      if (!isNaN(words)) {
        existing.wordCount += words;
      }

      modalMap.set(row.modalId, existing);
    }

    // Transform to array
    const conversations = Array.from(modalMap.entries()).map(([id, data]) => ({
      id,
      title: data.title,
      chatInstanceIds: Array.from(data.chatInstanceIds),
      responseCount: data.responseCount,
      wordCount: data.wordCount,
    }));

    // Sort by most responses desc
    conversations.sort((a, b) => b.responseCount - a.responseCount);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Failed to fetch modals with responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch modals with responses", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 