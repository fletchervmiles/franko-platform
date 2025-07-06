import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";
import { getProfileByUserId } from "@/db/queries/profiles-queries";
import { getChatInstancesByUserId } from "@/db/queries/chat-instances-queries";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { generateUseCaseConversationPlan } = require("@/ai_folder/create-plans");

// Allow long-running function (5 min)
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST() {
  const startTime = Date.now();
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info(`[regen] Regenerating plans for ${userId}`);

    // Get latest profile description
    const profile = await getProfileByUserId(userId);
    if (!profile?.organisationDescription) {
      return NextResponse.json({ error: "No organisation description to regenerate from" }, { status: 400 });
    }

    // Fetch all chat-instances owned by user
    const chatInstances = await getChatInstancesByUserId(userId);
    if (chatInstances.length === 0) {
      return NextResponse.json({ success: true, regenerated: 0 });
    }

    let regenerated = 0;
    const failed: string[] = [];

    await Promise.allSettled(
      chatInstances.map((instance) =>
        generateUseCaseConversationPlan({
          agentId: instance.agentType || "",
          chatInstanceId: instance.id,
          organisationName: profile.organisationName || "Your Company",
          organisationDescription: profile.organisationDescription,
        } as any)
      )
    ).then((results) => {
      results.forEach((res, idx) => {
        if (res.status === "fulfilled") {
          regenerated++;
        } else {
          failed.push(chatInstances[idx].id);
          logger.error(`[regen] Plan generation rejected for chat ${chatInstances[idx].id}:`, res.reason);
        }
      });
    });

    const duration = Date.now() - startTime;
    logger.info(`[regen] Finished. Success ${regenerated}/${chatInstances.length}. Time ${duration}ms`);

    return NextResponse.json({ success: true, regenerated, failed });
  } catch (error) {
    logger.error("[regen] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 