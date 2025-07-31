import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getModalCountByUserId } from "@/db/queries/modals-queries";
import { getChatInstancesCountByUserId, getChatInstancesByUserId } from "@/db/queries/chat-instances-queries";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [modalCount, chatInstancesCount, chatInstances] = await Promise.all([
      getModalCountByUserId(userId),
      getChatInstancesCountByUserId(userId),
      getChatInstancesByUserId(userId)
    ]);

    // Check how many agents have conversation plans
    const agentsWithPlans = chatInstances.filter(instance => 
      instance.conversationPlan && 
      typeof instance.conversationPlan === 'object' &&
      Object.keys(instance.conversationPlan).length > 0
    ).length;

    return NextResponse.json({
      modalCount,
      chatInstancesCount,
      agentsWithPlans
    });
  } catch (error) {
    console.error("Failed to get user stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}