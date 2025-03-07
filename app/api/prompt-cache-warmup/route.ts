/**
 * Prompt Cache Warmup API
 * 
 * This API endpoint directly warms up the prompt cache by calling the prompt cache
 * utility function. This provides a reliable way to ensure prompts are cached
 * before actual chat interactions, reducing the latency of the first AI interaction.
 * 
 * It's designed to be called quietly in the background when a user loads
 * the chat page, reducing the latency of the first AI interaction.
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { populatePromptCache, isPromptCached, protectChatInstanceFromInvalidation, getCachedPrompt } from "@/lib/prompt-cache";

// In-memory deduplication cache to prevent redundant warmup requests
// This avoids unnecessary database queries for the same chat instance
const recentWarmupsCache: Record<string, number> = {};
const WARMUP_THROTTLE_MS = 30000; // 30 seconds between warmups for the same instance

export async function POST(request: Request) {
  try {
    // Parse the request body with error handling
    let chatInstanceId;
    try {
      const body = await request.json();
      chatInstanceId = body.chatInstanceId;
    } catch (parseError) {
      return NextResponse.json({ 
        error: "Invalid JSON in request body",
        details: parseError instanceof Error ? parseError.message : String(parseError)
      }, { status: 400 });
    }
    
    if (!chatInstanceId) {
      return NextResponse.json({ error: "Missing chatInstanceId" }, { status: 400 });
    }
    
    // Check if we've recently warmed this chat instance (within the last 30 seconds)
    const now = Date.now();
    const lastWarmed = recentWarmupsCache[chatInstanceId];
    
    if (lastWarmed && (now - lastWarmed < WARMUP_THROTTLE_MS)) {
      logger.info(`Skipping prompt warmup - recently warmed for chat instance: ${chatInstanceId}`);
      return NextResponse.json({ 
        success: true, 
        message: "Prompt cache recently warmed", 
        cached: true,
        timestamp: new Date().toISOString()
      });
    }
    
    // Update the timestamp before we do the work to prevent concurrent warmups
    recentWarmupsCache[chatInstanceId] = now;
    
    // Log the warmup request
    logger.info(`Warming prompt cache for chat instance: ${chatInstanceId}`);
    
    console.log(`WARMUP: Protecting and warming cache for chat instance ${chatInstanceId}`);
    
    // Protect this chat instance from cache invalidation
    // This ensures the warmed prompt remains in cache regardless of profile syncs
    protectChatInstanceFromInvalidation(chatInstanceId);
    console.log(`WARMUP: Added ${chatInstanceId} to protected chat IDs`);
    
    // Directly call the prompt cache utility function
    // This is more reliable than the previous approach of making an HTTP request
    const populatedPrompt = await populatePromptCache(chatInstanceId);
    console.log(`WARMUP: Successfully populated prompt (${populatedPrompt.length} chars)`);
    
    // Verify the prompt is actually cached
    // Get a cached prompt directly (with any org name since we're just checking)
    const cachedPrompt = getCachedPrompt(chatInstanceId, "default");
    if (cachedPrompt) {
      console.log(`WARMUP: Verified the prompt is cached for ${chatInstanceId} (${cachedPrompt.length} chars)`);
    } else {
      console.log(`WARMUP ERROR: Prompt is NOT cached despite population attempt for ${chatInstanceId}`);
    }
    
    // Clean up old entries from the deduplication cache
    // This prevents memory leaks from accumulating old chat instance IDs
    const oneHourAgo = now - (60 * 60 * 1000);
    for (const [id, timestamp] of Object.entries(recentWarmupsCache)) {
      if (timestamp < oneHourAgo) {
        delete recentWarmupsCache[id];
      }
    }
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: "Prompt cache warmed successfully",
      promptLength: populatedPrompt.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Log error but don't expose details to client
    logger.error(`Failed to warm prompt cache: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to warm prompt cache"
    }, { status: 500 });
  }
}