/**
 * Prompt Cache Utility
 * 
 * This module provides centralized caching for prompts used across the application.
 * It handles loading, populating, and invalidating the prompt cache to improve
 * performance and reduce latency for AI interactions.
 */

import { LRUCache } from 'lru-cache';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';
import { getChatInstanceById } from '@/db/queries/chat-instances-queries';
import { getProfile } from '@/db/queries/profiles-queries';

// We need to use a more persistent cache that won't be recreated on module reloads
// This uses the global object which persists across module reloads
declare global {
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
 * Populates and caches a prompt for a specific chat instance.
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
    
    // We need a standardized way to create cache keys to ensure consistency
    // Create two keys - one for the regular cache, one for the external request format
    const cacheKey = `${chatInstanceId}:${organizationName.substring(0, 20)}`;
    const externalCacheKey = `external:${organizationName.substring(0, 20)}`;
    
    console.log(`POPULATE: Using primary cache key: "${cacheKey}"`);
    console.log(`POPULATE: Using external cache key: "${externalCacheKey}"`);
    
    // Check both possible keys
    const cachedPrompt = promptCache.get(cacheKey) || promptCache.get(externalCacheKey);
    
    if (cachedPrompt) {
      console.log(`POPULATE: Cache hit for key "${cacheKey}"`);
      logger.debug('Using cached prompt for organization:', { organizationName });
      return cachedPrompt;
    }

    console.log(`POPULATE: Cache miss for key "${cacheKey}"`);
    logger.debug('Cache miss, loading prompt for organization:', { organizationName });
    
    const promptTemplate = loadPrompt('external_chat_prompt.md');

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

    // Populate the prompt template with organization details and conversation plan
    const populatedPrompt = promptTemplate
      .replace('{organisation_name}', organizationName)
      .replace('{organisation_description}', organizationContext)
      .replace('{conversation_plan}', formattedConversationPlan);

    // Store with both keys to ensure both lookup methods work
    promptCache.set(cacheKey, populatedPrompt);
    promptCache.set(externalCacheKey, populatedPrompt);
    console.log(`POPULATE: Added prompt to cache with both keys, cache size: ${promptCache.size}`);
    
    return populatedPrompt;
  } catch (error) {
    logger.error('Error populating prompt:', error);
    throw error;
  }
}

// We need to make protected IDs persistent too
declare global {
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

// Add diagnostic logging
console.log("INIT: Prompt cache utility module loaded");
// Log cache status periodically
setInterval(() => {
  console.log(`PROMPT CACHE: Has ${promptCache.size} entries`);
  console.log(`PROTECTED IDS: Has ${protectedChatIds.size} protected IDs: ${[...protectedChatIds]}`);
}, 15000); // Log every 15 seconds

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
 * Checks if a prompt is cached for the given chat instance ID
 */
export function isPromptCached(chatInstanceId: string, organizationName: string): boolean {
  const cacheKey = `${chatInstanceId}:${organizationName.substring(0, 20)}`;
  const externalCacheKey = `external:${organizationName.substring(0, 20)}`;
  return promptCache.has(cacheKey) || promptCache.has(externalCacheKey);
}

/**
 * Returns the cached prompt directly if available
 */
export function getCachedPrompt(chatInstanceId: string, organizationName: string): string | undefined {
  // First check the direct combination key
  const cacheKey = `${chatInstanceId}:${organizationName.substring(0, 20)}`;
  const directResult = promptCache.get(cacheKey);
  if (directResult) {
    console.log(`CACHE HIT for key "${cacheKey}"`);
    return directResult;
  }
  
  // Check external format key
  const externalCacheKey = `external:${organizationName.substring(0, 20)}`;
  const externalResult = promptCache.get(externalCacheKey);
  if (externalResult) {
    console.log(`CACHE HIT for key "${externalCacheKey}"`);
    return externalResult;
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
  
  console.log(`CACHE MISS: checked all possible keys for "${chatInstanceId}" and "${organizationName}"`);
  return undefined;
}