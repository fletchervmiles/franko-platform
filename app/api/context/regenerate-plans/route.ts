import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";
import { getProfileByUserId, updateProfile } from "@/db/queries/profiles-queries";
import { getChatInstancesByUserId, updateChatInstanceConversationPlan, type SelectChatInstance } from "@/db/queries/chat-instances-queries";
import { generateUseCaseConversationPlan } from "@/ai_folder/create-plans";
import { createObjectiveProgressFromPlan } from "@/ai_folder/create-actions";

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

    logger.info(`[regen] Regenerating plans for ${userId} (optimized)`);

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

    // 🚀 OPTIMIZATION: Group instances by agent type
    const instancesByAgentType: Record<string, SelectChatInstance[]> = {};
    chatInstances.forEach(instance => {
      const agentType = instance.agentType || 'unknown';
      if (!instancesByAgentType[agentType]) {
        instancesByAgentType[agentType] = [];
      }
      instancesByAgentType[agentType].push(instance);
    });

    const uniqueAgentTypes = Object.keys(instancesByAgentType).filter(type => type !== 'unknown');
    logger.info(`[regen] Found ${uniqueAgentTypes.length} unique agent types across ${chatInstances.length} instances`);

    // 🚀 STEP 1: Generate plans for unique agent types in PARALLEL
    const planGenerationPromises = uniqueAgentTypes.map(async (agentType) => {
      try {
        const plan = await generateUseCaseConversationPlan({
          agentId: agentType,
          organisationName: profile.organisationName || "Your Company",
          organisationDescription: profile.organisationDescription,
          autoSave: false // Don't auto-save, we'll handle this manually
        });
        
        return { agentType, plan, success: true };
      } catch (error) {
        logger.error(`[regen] Plan generation failed for ${agentType}:`, error);
        return { agentType, error: error instanceof Error ? error.message : 'Unknown error', success: false };
      }
    });

    const planResults = await Promise.allSettled(planGenerationPromises);
    
    // 🚀 STEP 2: Apply plans to all instances in PARALLEL 
    const updatePromises: Promise<{ success: boolean; instanceId: string; agentType: string }>[] = [];
    const successfulPlans: Array<{ agentType: string; plan: any }> = [];

    planResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success) {
        const { agentType, plan } = result.value;
        successfulPlans.push({ agentType, plan });
        const instances = instancesByAgentType[agentType];
        
        // Create update promises for all instances of this agent type
        const instanceUpdatePromises = instances.map(async (instance) => {
          try {
            await updateChatInstanceConversationPlan(instance.id, plan);
            await createObjectiveProgressFromPlan(plan, instance.id);
            return { success: true, instanceId: instance.id, agentType };
          } catch (error) {
            logger.error(`[regen] Failed to update instance ${instance.id}:`, error);
            return { success: false, instanceId: instance.id, agentType };
          }
        });
        
        updatePromises.push(...instanceUpdatePromises);
      } else if (result.status === 'fulfilled') {
        // Plan generation failed for this agent type
        const { agentType, error } = result.value;
        logger.error(`[regen] Skipping ${instancesByAgentType[agentType].length} instances of ${agentType} due to plan generation failure: ${error}`);
      }
    });

    // Execute all database updates in parallel
    const updateResults = await Promise.allSettled(updatePromises);
    
    // Count results
    let regenerated = 0;
    const failed: string[] = [];
    
    updateResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success) {
        regenerated++;
      } else if (result.status === 'fulfilled') {
        failed.push(result.value.instanceId);
      } else {
        // Promise was rejected
        logger.error(`[regen] Update promise rejected:`, result.reason);
      }
    });

    const duration = Date.now() - startTime;
    logger.info(`[regen] Finished. Generated ${successfulPlans.length}/${uniqueAgentTypes.length} unique plans, updated ${regenerated}/${chatInstances.length} instances in ${duration}ms`);

    // Update agent training timestamp
    try {
      await updateProfile(userId, {
        agentLastTrainedAt: new Date()
      });
      logger.info(`[regen] Updated agent training timestamp for user ${userId}`);
    } catch (updateError) {
      logger.error(`[regen] Failed to update agent training timestamp:`, updateError);
      // Don't fail the entire operation for this
    }

    return NextResponse.json({ success: true, regenerated, failed });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error("[regen] Unexpected error:", { error: errorMessage, stack: errorStack });
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
} 