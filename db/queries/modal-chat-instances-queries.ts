import { db } from "@/db/db";
import { chatInstancesTable, type InsertChatInstance, type SelectChatInstance } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Create chat instances for a modal (pre-create one per enabled agent)
 */
export async function createModalChatInstances(
  modalId: string,
  userId: string,
  enabledAgents: Array<{ agentType: string; conversationPlan: any }>
): Promise<SelectChatInstance[]> {
  const chatInstances = enabledAgents.map(agent => ({
    userId,
    modalId,
    agentType: agent.agentType,
    isModalAgent: true,
    isEnabled: true,
    conversationPlan: agent.conversationPlan,
    published: true, // Modal agents are published by default
  }));

  return await db.insert(chatInstancesTable).values(chatInstances).returning();
}

/**
 * Get all chat instances for a modal
 */
export async function getModalChatInstances(
  modalId: string,
  userId: string
): Promise<SelectChatInstance[]> {
  return await db
    .select()
    .from(chatInstancesTable)
    .where(
      and(
        eq(chatInstancesTable.modalId, modalId),
        eq(chatInstancesTable.userId, userId),
        eq(chatInstancesTable.isModalAgent, true)
      )
    )
    .orderBy(chatInstancesTable.createdAt);
}

/**
 * Get enabled chat instances for a modal (for public embed access)
 */
export async function getEnabledModalChatInstances(modalId: string): Promise<SelectChatInstance[]> {
  return await db
    .select()
    .from(chatInstancesTable)
    .where(
      and(
        eq(chatInstancesTable.modalId, modalId),
        eq(chatInstancesTable.isModalAgent, true),
        eq(chatInstancesTable.isEnabled, true),
        eq(chatInstancesTable.published, true)
      )
    )
    .orderBy(chatInstancesTable.createdAt);
}

/**
 * Toggle an agent's enabled status within a modal
 */
export async function toggleModalAgent(
  modalId: string,
  userId: string,
  agentType: string,
  isEnabled: boolean
): Promise<SelectChatInstance | undefined> {
  const [chatInstance] = await db
    .update(chatInstancesTable)
    .set({ isEnabled, updatedAt: new Date() })
    .where(
      and(
        eq(chatInstancesTable.modalId, modalId),
        eq(chatInstancesTable.userId, userId),
        eq(chatInstancesTable.agentType, agentType),
        eq(chatInstancesTable.isModalAgent, true)
      )
    )
    .returning();
  
  return chatInstance;
}

/**
 * Add a new agent to an existing modal
 */
export async function addAgentToModal(
  modalId: string,
  userId: string,
  agentType: string,
  conversationPlan: any
): Promise<SelectChatInstance> {
  const [chatInstance] = await db
    .insert(chatInstancesTable)
    .values({
      userId,
      modalId,
      agentType,
      isModalAgent: true,
      isEnabled: true,
      conversationPlan,
      published: true,
    })
    .returning();

  if (!chatInstance) {
    throw new Error("Failed to add agent to modal");
  }

  return chatInstance;
}

/**
 * Remove an agent from a modal (soft delete by setting isEnabled = false)
 */
export async function removeAgentFromModal(
  modalId: string,
  userId: string,
  agentType: string
): Promise<void> {
  await db
    .update(chatInstancesTable)
    .set({ isEnabled: false, updatedAt: new Date() })
    .where(
      and(
        eq(chatInstancesTable.modalId, modalId),
        eq(chatInstancesTable.userId, userId),
        eq(chatInstancesTable.agentType, agentType),
        eq(chatInstancesTable.isModalAgent, true)
      )
    );
}

/**
 * Get a specific modal chat instance by agent type
 */
export async function getModalChatInstanceByAgent(
  modalId: string,
  agentType: string
): Promise<SelectChatInstance | undefined> {
  const [chatInstance] = await db
    .select()
    .from(chatInstancesTable)
    .where(
      and(
        eq(chatInstancesTable.modalId, modalId),
        eq(chatInstancesTable.agentType, agentType),
        eq(chatInstancesTable.isModalAgent, true),
        eq(chatInstancesTable.isEnabled, true),
        eq(chatInstancesTable.published, true)
      )
    );
  
  return chatInstance;
}

/**
 * Update conversation plans for all agents in a modal
 */
export async function updateModalConversationPlans(
  modalId: string,
  userId: string,
  agentPlans: Array<{ agentType: string; conversationPlan: any }>
): Promise<SelectChatInstance[]> {
  const results: SelectChatInstance[] = [];
  
  for (const { agentType, conversationPlan } of agentPlans) {
    const [updated] = await db
      .update(chatInstancesTable)
      .set({ 
        conversationPlan, 
        conversationPlanLastEdited: new Date(),
        updatedAt: new Date() 
      })
      .where(
        and(
          eq(chatInstancesTable.modalId, modalId),
          eq(chatInstancesTable.userId, userId),
          eq(chatInstancesTable.agentType, agentType),
          eq(chatInstancesTable.isModalAgent, true)
        )
      )
      .returning();
    
    if (updated) {
      results.push(updated);
    }
  }
  
  return results;
} 