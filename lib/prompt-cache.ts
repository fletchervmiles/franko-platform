/**
 * Prompt Cache Utility
 * 
 * This module provides centralized caching for prompts used across the application.
 * It handles loading, populating, and invalidating the prompt cache to improve
 * performance and reduce latency for AI interactions.
 * 
 * Enhanced for multi-agent support with agent-specific prompts.
 */

import { LRUCache } from 'lru-cache';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';
import { getChatInstanceById } from '@/db/queries/chat-instances-queries';
import { getProfile } from '@/db/queries/profiles-queries';

// Agent to prompt file mapping
const AGENT_PROMPT_MAP: Record<string, string> = {
  'AGENT01': 'use-case-agents/01discovery_agent_prompt.md',
  'AGENT02': 'use-case-agents/02persona_problem_agent_prompt.md', 
  'AGENT03': 'use-case-agents/03upgrade_decision_agent_prompt.md',
  'AGENT04': 'use-case-agents/04key_benefit_agent_prompt.md',
  'AGENT05': 'use-case-agents/05improvement_agent_prompt.md',
  'AGENT06': 'use-case-agents/06new_feature_agent_prompt.md'
};

// We need to use a more persistent cache that won't be recreated on module reloads
// This uses the global object which persists across module reloads
declare global {
  // eslint-disable-next-line no-var
  var _promptCache: LRUCache<string, string> | undefined;
}

// Create a persistent cache that survives module reloads (important for development mode)
if (!global._promptCache) {
  console.log("CREATING NEW GLOBAL PROMPT CACHE");
  global._promptCache = new LRUCache<string, string>({
    max: 500, // Maximum number of items to store
    ttl: 1000 * 60 * 60, // Items expire after 1 hour
  });
} else {
  console.log("USING EXISTING GLOBAL PROMPT CACHE");
}

// Use the global cache for all operations
const promptCache = global._promptCache;

/**
 * Load a prompt file from the agent_prompts directory
 */
function loadPrompt(filename: string): string {
  // Adjust path to be relative to the project root
  const promptPath = path.join(process.cwd(), 'agent_prompts', filename);
  
  try {
    return fs.readFileSync(promptPath, 'utf-8');
  } catch (error) {
    logger.error(`Error loading prompt file: ${filename}`, error);
    throw new Error(`Failed to load prompt file: ${filename}`);
  }
}

/**
 * Get the appropriate prompt file for an agent type
 */
function getPromptFileForAgent(agentType: string): string {
  const promptFile = AGENT_PROMPT_MAP[agentType];
  if (!promptFile) {
    // Fallback to main agent for unknown agent types
    logger.warn(`Unknown agent type: ${agentType}, falling back to main_agent.md`);
    return 'main_agent.md';
  }
  return promptFile;
}

/**
 * Create cache key for agent-specific prompts
 */
function createAgentCacheKey(chatInstanceId: string, agentType: string, organizationName: string): string {
  const orgPrefix = organizationName.substring(0, 20);
  return `${chatInstanceId}:${agentType}:${orgPrefix}`;
}

/**
 * Create external cache key for agent-specific prompts
 */
function createExternalAgentCacheKey(agentType: string, organizationName: string): string {
  const orgPrefix = organizationName.substring(0, 20);
  return `external:${agentType}:${orgPrefix}`;
}

/**
 * Populates and caches a prompt for a specific chat instance with agent-specific prompt support.
 * This is the main function that should be used to get prompts.
 */
export async function populatePromptCache(chatInstanceId: string): Promise<string> {
  try {
    console.log(`POPULATE: Starting prompt population for chat instance: ${chatInstanceId}`);
    
    // Get chat instance and organization details
    const chatInstance = await getChatInstanceById(chatInstanceId);
    if (!chatInstance) {
      console.log(`POPULATE ERROR: Chat instance not found: ${chatInstanceId}`);
      throw new Error(`Chat instance not found: ${chatInstanceId}`);
    }
    
    const profile = await getProfile(chatInstance.userId);
    if (!profile) {
      console.log(`POPULATE ERROR: Profile not found for user: ${chatInstance.userId}`);
      throw new Error(`Profile not found for user: ${chatInstance.userId}`);
    }
    
    const organizationName = profile.organisationName || '';
    const organizationContext = profile.organisationDescription || '';
    const conversationPlan = chatInstance.conversationPlan || {};
    const organisationDescriptionDemoOnly = profile.organisationDescriptionDemoOnly || '';
    
    // Validate critical organization data before caching
    if (!organizationName.trim()) {
      logger.warn(`Refusing to cache prompt with empty organizationName`, { 
        chatInstanceId, 
        userId: chatInstance.userId,
        hasContext: !!organizationContext.trim(),
        agentType: chatInstance.agentType 
      });
      throw new Error(`Cannot cache prompt: organizationName is empty for user ${chatInstance.userId}`);
    }
    
    if (!organizationContext.trim()) {
      logger.warn(`Refusing to cache prompt with empty organizationContext`, { 
        chatInstanceId, 
        userId: chatInstance.userId,
        organizationName: organizationName.substring(0, 20) + '...',
        agentType: chatInstance.agentType 
      });
      throw new Error(`Cannot cache prompt: organizationContext is empty for user ${chatInstance.userId}`);
    }
    // Determine whether to use agent-specific prompts or legacy main agent
    const agentType = chatInstance.agentType; // Keep null for existing chat instances
    const isModalAgent = chatInstance.isModalAgent === true;
    const useAgentSpecificPrompt = typeof agentType === 'string' && isModalAgent;

    // Create cache keys
    const cacheKey = useAgentSpecificPrompt 
      ? createAgentCacheKey(chatInstanceId, agentType, organizationName)
      : `${chatInstanceId}:${organizationName.substring(0, 20)}`;
    
    const externalCacheKey = useAgentSpecificPrompt 
      ? createExternalAgentCacheKey(agentType, organizationName)
      : `external:${organizationName.substring(0, 20)}`;
    
    console.log(`POPULATE: Using cache key: "${cacheKey}"`);
    console.log(`POPULATE: Using external cache key: "${externalCacheKey}"`);
    console.log(`POPULATE: Agent-specific mode: ${useAgentSpecificPrompt}, agentType: ${agentType}`);
    
    // Check both possible keys
    const cachedPrompt = promptCache.get(cacheKey) || promptCache.get(externalCacheKey);
    
    if (cachedPrompt) {
      console.log(`POPULATE: Cache hit with key "${cacheKey}"`);
      logger.debug('Using cached prompt:', { agentType, organizationName, useAgentSpecificPrompt });
      return cachedPrompt;
    }

    console.log(`POPULATE: Cache miss with key "${cacheKey}"`);
    logger.debug('Cache miss, loading prompt:', { agentType, organizationName, useAgentSpecificPrompt });
    
    // Load appropriate prompt file
    const promptFile = useAgentSpecificPrompt && agentType 
      ? getPromptFileForAgent(agentType)
      : 'main_agent.md';
    
    const promptTemplate = loadPrompt(promptFile);

    // Simplify conversation plan formatting
    let formattedConversationPlan = "";
    if (conversationPlan && Object.keys(conversationPlan).length > 0) {
      try {
        // Convert the conversation plan to a nicely formatted string
        formattedConversationPlan = "```json\n" + 
          JSON.stringify(conversationPlan, null, 2) + 
          "\n```";
      } catch (error) {
        logger.error('Error formatting conversation plan, using empty string:', error);
        formattedConversationPlan = "No structured conversation plan available.";
      }
    } else {
      formattedConversationPlan = "No conversation plan provided.";
    }

    // Populate the prompt template with organization details, conversation plan, and demo content
    // Use global replacement to handle multiple occurrences of the same placeholder
    const populatedPrompt = promptTemplate
      .replace(/{organisation_name}/g, organizationName)
      .replace(/{organisation_description}/g, organizationContext)
      .replace(/{conversation_plan}/g, formattedConversationPlan)
      .replace(/{organisation_description_demo_only}/g, organisationDescriptionDemoOnly);

    // Store with both keys to ensure both lookup methods work
    promptCache.set(cacheKey, populatedPrompt);
    promptCache.set(externalCacheKey, populatedPrompt);
    console.log(`POPULATE: Added prompt to cache with both keys (${useAgentSpecificPrompt ? 'agent-specific' : 'legacy'}), cache size: ${promptCache.size}`);
    
    return populatedPrompt;
  } catch (error) {
    logger.error('Error populating prompt:', error);
    throw error;
  }
}

/**
 * Background prompt pre-warming for agent-specific prompts
 * This function is called asynchronously to prepare prompts for faster initialization
 */
export async function warmAgentPrompt(chatInstanceId: string, agentType: string): Promise<void> {
  try {
    console.log(`WARM: Starting background prompt warming for chat instance: ${chatInstanceId}, agent: ${agentType}`);
    
    // Get chat instance and organization details
    const chatInstance = await getChatInstanceById(chatInstanceId);
    if (!chatInstance) {
      console.log(`WARM ERROR: Chat instance not found: ${chatInstanceId}`);
      return;
    }
    
    const profile = await getProfile(chatInstance.userId);
    if (!profile) {
      console.log(`WARM ERROR: Profile not found for user: ${chatInstance.userId}`);
      return;
    }
    
    const organizationName = profile.organisationName || '';
    const organizationContext = profile.organisationDescription || '';
    
    // Validate critical organization data before warming
    if (!organizationName.trim() || !organizationContext.trim()) {
      console.log(`WARM: Skipping prompt warming due to incomplete org data`, { 
        chatInstanceId, 
        agentType,
        hasName: !!organizationName.trim(),
        hasContext: !!organizationContext.trim()
      });
      return; // Don't cache incomplete data
    }
    
    const cacheKey = createAgentCacheKey(chatInstanceId, agentType, organizationName);
    
    // Check if already cached
    if (promptCache.has(cacheKey)) {
      console.log(`WARM: Prompt already cached for agent ${agentType}, skipping`);
      return;
    }

    // Pre-warm by calling the main populate function
    await populatePromptCache(chatInstanceId);
    
    console.log(`WARM: Successfully pre-warmed prompt for agent ${agentType}`);
    logger.info('Background prompt pre-warming completed:', { chatInstanceId, agentType });
    
  } catch (error) {
    logger.error('Error during background prompt warming:', error);
    // Don't throw - this is a background operation
  }
}

// We need to make protected IDs persistent too
declare global {
  // eslint-disable-next-line no-var
  var _protectedChatIds: Set<string> | undefined;
}

// Initialize protected chat IDs that persist across module reloads
if (!global._protectedChatIds) {
  console.log("CREATING NEW GLOBAL PROTECTED IDS SET");
  global._protectedChatIds = new Set<string>();
} else {
  console.log("USING EXISTING GLOBAL PROTECTED IDS SET");
}

/**
 * External chat cache keys - these are protected from invalidation
 * This set stores chat instance IDs that shouldn't be invalidated
 * because they're used by external chat users
 */
const protectedChatIds = global._protectedChatIds;

// // Add diagnostic logging
// console.log("INIT: Prompt cache utility module loaded");
// // Log cache status periodically
// setInterval(() => {
//   console.log(`PROMPT CACHE: Has ${promptCache.size} entries`);
//   console.log(`PROTECTED IDS: Has ${protectedChatIds.size} protected IDs: ${[...protectedChatIds]}`);
// }, 15000); // Log every 15 seconds

/**
 * Invalidates the cached prompt for a specific organization/chat instance
 */
export function invalidatePromptCache(orgOrChatId: string) {
  logger.debug('Invalidating prompt cache for:', { id: orgOrChatId });
  
  // Skip invalidation for external chat IDs
  if (protectedChatIds.has(orgOrChatId)) {
    logger.debug('Skipping invalidation for protected chat ID:', { id: orgOrChatId });
    return;
  }
  
  // Try to find and invalidate any keys containing this ID
  for (const key of promptCache.keys()) {
    if (key.includes(orgOrChatId)) {
      promptCache.delete(key);
    }
  }
}

/**
 * Marks a chat instance ID as protected from invalidation
 * This ensures that external chat prompts remain cached
 */
export function protectChatInstanceFromInvalidation(chatInstanceId: string) {
  protectedChatIds.add(chatInstanceId);
}

/**
 * Invalidates the entire prompt cache
 * Use this for global updates or migrations
 */
export function invalidateAllPromptCaches() {
  logger.debug('Invalidating all prompt caches');
  promptCache.clear();
}

/**
 * Checks if a prompt is cached for the given chat instance ID (with agent support)
 */
export function isPromptCached(chatInstanceId: string, organizationName: string, agentType: string = 'AGENT01'): boolean {
  const cacheKey = createAgentCacheKey(chatInstanceId, agentType, organizationName);
  const externalCacheKey = createExternalAgentCacheKey(agentType, organizationName);
  
  // Also check legacy keys for backward compatibility
  const legacyCacheKey = `${chatInstanceId}:${organizationName.substring(0, 20)}`;
  const legacyExternalCacheKey = `external:${organizationName.substring(0, 20)}`;
  
  return promptCache.has(cacheKey) || 
         promptCache.has(externalCacheKey) ||
         promptCache.has(legacyCacheKey) ||
         promptCache.has(legacyExternalCacheKey);
}

/**
 * Returns the cached prompt directly if available (with agent support)
 */
export function getCachedPrompt(chatInstanceId: string, organizationName: string, agentType: string = 'AGENT01'): string | undefined {
  // First check agent-specific keys
  const cacheKey = createAgentCacheKey(chatInstanceId, agentType, organizationName);
  const directResult = promptCache.get(cacheKey);
  if (directResult) {
    console.log(`CACHE HIT for agent-specific key "${cacheKey}"`);
    return directResult;
  }
  
  // Check external agent-specific key
  const externalCacheKey = createExternalAgentCacheKey(agentType, organizationName);
  const externalResult = promptCache.get(externalCacheKey);
  if (externalResult) {
    console.log(`CACHE HIT for external agent-specific key "${externalCacheKey}"`);
    return externalResult;
  }
  
  // Fallback to legacy keys for backward compatibility
  const legacyCacheKey = `${chatInstanceId}:${organizationName.substring(0, 20)}`;
  const legacyDirectResult = promptCache.get(legacyCacheKey);
  if (legacyDirectResult) {
    console.log(`CACHE HIT for legacy key "${legacyCacheKey}"`);
    return legacyDirectResult;
  }
  
  // Check legacy external format key
  const legacyExternalCacheKey = `external:${organizationName.substring(0, 20)}`;
  const legacyExternalResult = promptCache.get(legacyExternalCacheKey);
  if (legacyExternalResult) {
    console.log(`CACHE HIT for legacy external key "${legacyExternalCacheKey}"`);
    return legacyExternalResult;
  }
  
  // Special case - for external chat, try with "default" org name
  if (!organizationName || organizationName === '') {
    // Try the default keys
    const defaultCacheKey = `${chatInstanceId}:default`;
    const defaultResult = promptCache.get(defaultCacheKey);
    if (defaultResult) {
      console.log(`CACHE HIT for default key "${defaultCacheKey}"`);
      return defaultResult;
    }
    
    const externalDefaultKey = `external:default`;
    const externalDefaultResult = promptCache.get(externalDefaultKey);
    if (externalDefaultResult) {
      console.log(`CACHE HIT for default external key "${externalDefaultKey}"`);
      return externalDefaultResult;
    }
  }
  
  // Last attempt - try all keys for this chat instance
  for (const key of promptCache.keys()) {
    if (key.includes(chatInstanceId)) {
      console.log(`CACHE HIT for key "${key}" by instance ID search`);
      return promptCache.get(key);
    }
  }
  
  console.log(`CACHE MISS: checked all possible keys for "${chatInstanceId}", "${organizationName}", and agent "${agentType}"`);
  return undefined;
}