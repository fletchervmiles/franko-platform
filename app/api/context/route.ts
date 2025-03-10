/**
 * Conversation Finalizer Utility
 * 
 * Orchestrates the finalization of a conversation:
 * 1. Updates end time and calculates duration
 * 2. Cleans the transcript
 * 3. Calculates completion status
 * 4. Counts user words
 * 5. Updates usage tracking if completion rate > 50%
 * 6. Generates a summary if completion rate > 0%
 */

import { NextResponse } from "next/server";
import Exa from "exa-js";
import { updateProfile, getProfile } from "@/db/queries/profiles-queries";
import { o3MiniModel } from "@/ai_folder";
import fs from 'fs';
import path from 'path';
import { generateObject } from "ai";
import { z } from "zod";
import { logger } from "@/lib/logger";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Helper function to load the context setter prompt
function loadContextSetterPrompt() {
  try {
    const promptPath = path.join(process.cwd(), 'agent_prompts', 'context_setter.md');
    return fs.readFileSync(promptPath, 'utf-8');
  } catch (error) {
    console.error('Error loading context setter prompt:', error);
    throw new Error('Failed to load context setter prompt');
  }
}

// Helper function to retry the first Exa request
async function retryExaRequest(fn: () => Promise<any>, maxAttempts = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between retries
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    logger.info('Raw request body:', body);
    const { userId, organisationUrl, organisationName } = body;
    
    logger.info('Context generation request:', { 
      userId, 
      organisationUrl, 
      organisationName,
      timestamp: new Date().toISOString()
    });

    if (!userId || !organisationUrl || !organisationName) {
      logger.error('Missing parameters:', { userId, organisationUrl, organisationName });
      return NextResponse.json({ 
        success: false, 
        error: "Missing required parameters" 
      }, { status: 400 });
    }

    // First update: Immediately update URL and name
    logger.info('Updating profile with initial data:', { organisationUrl, organisationName });
    const initialUpdate = await updateProfile(userId, {
      organisationUrl,
      organisationName,
    });
    logger.info('Initial profile update successful');

    // Non-blocking context update counter increment
    Promise.resolve().then(async () => {
      try {
        const profile = await getProfile(userId);
        if (profile) {
          const currentCount = profile.context_update || 0;
          await updateProfile(userId, {
            context_update: currentCount + 1
          });
          logger.debug('Updated context update count:', { 
            userId, 
            newCount: currentCount + 1 
          });
        }
      } catch (error) {
        logger.error('Failed to update context update count:', error);
        // Don't throw - this is non-blocking
      }
    });

    const exa = new Exa(process.env.EXA_API_KEY!);
    
    // Run all three Exa requests concurrently with a 30-second timeout
    const timeout = 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      logger.info('Starting Exa requests...');

      const [extract01, extract02, extract03] = await Promise.all([
        // First request with retry
        retryExaRequest(async () => {
          logger.info('Making Exa request 1:', { 
            url: organisationUrl,
            timestamp: new Date().toISOString()
          });
          const result = await exa.getContents(
            [organisationUrl],
            {
              text: {
                maxCharacters: 4000
              },
              livecrawl: "always",
              subpages: 10
            }
          );
          logger.info('Exa request 1 response:', { 
            resultLength: JSON.stringify(result).length,
            fullResponse: result,
            timestamp: new Date().toISOString()
          });
          return result;
        }),
        // Second request without retry
        (async () => {
          const query = `Here is a comprehensive overview of ${organisationName} (${organisationUrl}), covering their company background, products, services, mission, industry, target market, and unique value proposition:`;
          logger.info('Making Exa request 2:', { 
            query,
            timestamp: new Date().toISOString()
          });
          const result = await exa.searchAndContents(query, {
            text: {
              maxCharacters: 4000
            },
            type: "auto"
          });
          logger.info('Exa request 2 response:', { 
            resultLength: JSON.stringify(result).length,
            fullResponse: result,
            timestamp: new Date().toISOString()
          });
          return result;
        })(),
        // Third request without retry
        (async () => {
          const query = `Here's what people are saying about ${organisationName} (${organisationUrl}), including customer opinions, online discussions, forums, user feedback, testimonials, and ratings:`;
          logger.info('Making Exa request 3:', { 
            query,
            timestamp: new Date().toISOString()
          });
          const result = await exa.searchAndContents(query, {
            text: {
              maxCharacters: 4000
            },
            type: "auto"
          });
          logger.info('Exa request 3 response:', { 
            resultLength: JSON.stringify(result).length,
            fullResponse: result,
            timestamp: new Date().toISOString()
          });
          return result;
        })()
      ]);

      clearTimeout(timeoutId);
      logger.info('All Exa requests completed successfully');

      // Load and prepare the context setter prompt
      let promptTemplate = loadContextSetterPrompt();
      
      // Log the raw Exa responses before JSON stringify
      logger.info('Raw Exa responses:', {
        extract01Length: extract01 ? JSON.stringify(extract01).length : 0,
        extract02Length: extract02 ? JSON.stringify(extract02).length : 0,
        extract03Length: extract03 ? JSON.stringify(extract03).length : 0,
        timestamp: new Date().toISOString()
      });
      
      // Replace placeholders in the prompt
      const prompt = promptTemplate
        .replace(/{organisation_name}/g, organisationName)
        .replace(/{organisation_url}/g, organisationUrl)
        .replace('{extract01}', JSON.stringify(extract01))
        .replace('{extract02}', JSON.stringify(extract02))
        .replace('{extract03}', JSON.stringify(extract03));

      // Verify the replacements worked
      logger.info('Prompt variable replacements:', {
        containsExtract01: prompt.includes(JSON.stringify(extract01)),
        containsExtract02: prompt.includes(JSON.stringify(extract02)),
        containsExtract03: prompt.includes(JSON.stringify(extract03)),
        containsOrgName: prompt.includes(organisationName),
        containsOrgUrl: prompt.includes(organisationUrl),
        timestamp: new Date().toISOString()
      });

      logger.info('Making OpenAI request');
      // Make the OpenAI request
      const aiRequest = {
        model: o3MiniModel,
        prompt,
        schema: z.object({
          description: z.string()
        })
      };
      
      logger.info('OpenAI request configuration:', {
        model: aiRequest.model,
        promptLength: aiRequest.prompt.length,
        schema: aiRequest.schema,
        fullPrompt: aiRequest.prompt,
        timestamp: new Date().toISOString()
      });

      const { object: response } = await generateObject(aiRequest);
      
      logger.info('OpenAI response:', { 
        descriptionLength: response.description.length,
        fullResponse: response.description,
        timestamp: new Date().toISOString()
      });

      // Second update: Update description after Exa/OpenAI completes
      const descriptionUpdate = {
        organisationUrl: initialUpdate[0].organisationUrl,
        organisationName: initialUpdate[0].organisationName,
        organisationDescription: response.description,
        organisationDescriptionCompleted: true,
      };
      
      logger.info('Updating profile with description:', descriptionUpdate);
      await updateProfile(userId, descriptionUpdate);
      logger.info('Description update successful');

      const successResponse = { 
        success: true, 
        description: response.description
      };
      
      logger.info('Sending success response:', successResponse);
      return NextResponse.json(successResponse);

    } catch (error) {
      clearTimeout(timeoutId);
      // Even if Exa/OpenAI fails, the URL and name update remains
      logger.error('Error in Exa/OpenAI process:', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ 
        success: false, 
        error: "Failed to generate description, but profile details were updated." 
      }, { status: 500 });
    }

  } catch (error) {
    logger.error('Context generation error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update profile" 
    }, { status: 500 });
  }
} 