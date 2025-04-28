/**

 */

import { NextResponse } from "next/server";
import Exa from "exa-js";
import { updateProfile, getProfile } from "@/db/queries/profiles-queries";
import { o3Model } from "@/ai_folder";
import fs from 'fs';
import path from 'path';
import { generateObject } from "ai";
import { z } from "zod";
import { logger } from "@/lib/logger";
import OpenAI from 'openai';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

      const results = await Promise.allSettled([
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
      logger.info('All Exa requests completed');

      // Extract successful results
      const [extract01Result, extract02Result, extract03Result] = results;
      const extract01 = extract01Result.status === 'fulfilled' ? extract01Result.value : null;
      const extract02 = extract02Result.status === 'fulfilled' ? extract02Result.value : null;
      const extract03 = extract03Result.status === 'fulfilled' ? extract03Result.value : null;

      // Log any failures but continue processing
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          logger.error(`Exa request ${index + 1} failed:`, {
            error: result.reason,
            timestamp: new Date().toISOString()
          });
        }
      });

      // If all requests failed, then error out
      if (!extract01 && !extract02 && !extract03) {
        throw new Error("All Exa requests failed");
      }

      // Load the context setter prompt
      const contextSetterPrompt = loadContextSetterPrompt();
      
      // Replace all variables in the prompt
      const filledPrompt = contextSetterPrompt
        .replace(/{organisation_name}/g, organisationName)
        .replace(/{organisation_url}/g, organisationUrl)
        .replace('{extract01}', JSON.stringify(extract01 || {}, null, 2))
        .replace('{extract02}', JSON.stringify(extract02 || {}, null, 2))
        .replace('{extract03}', JSON.stringify(extract03 || {}, null, 2));

      logger.info('Prompt preparation:', {
        promptLength: filledPrompt.length,
        hasExtract01: extract01 ? 'yes' : 'no',
        hasExtract02: extract02 ? 'yes' : 'no',
        hasExtract03: extract03 ? 'yes' : 'no',
        hasOrgName: filledPrompt.includes(organisationName),
        hasOrgUrl: filledPrompt.includes(organisationUrl),
        timestamp: new Date().toISOString()
      });

      logger.info('Making OpenAI request');
      let response: string | undefined;
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          logger.info(`OpenAI attempt ${attempt}/${maxRetries}`);
          
          const completion = await openai.chat.completions.create({
            model: "o3",
            messages: [
              { 
                role: "user", 
                content: filledPrompt 
              }
            ],
            response_format: { type: "text" },
            reasoning_effort: "low"
          });
          
          response = completion.choices[0].message.content || "";
          
          if (!response.trim()) {
            throw new Error("Generated text was empty");
          }
          
          break;  // Success, exit loop
        } catch (error) {
          logger.error(`OpenAI attempt ${attempt} failed:`, error);
          if (attempt === maxRetries) {
            throw new Error("Failed to generate description after multiple attempts");
          }
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        }
      }

      if (!response) {
        throw new Error("Failed to generate description");
      }
      
      logger.info('OpenAI response:', { 
        descriptionLength: response.length,
        fullResponse: response,
        timestamp: new Date().toISOString()
      });

      // Second update: Update description after Exa/OpenAI completes
      const descriptionUpdate = {
        organisationUrl: initialUpdate[0].organisationUrl,
        organisationName: initialUpdate[0].organisationName,
        organisationDescription: response,
        organisationDescriptionCompleted: true,
      };
      
      logger.info('Updating profile with description:', descriptionUpdate);
      await updateProfile(userId, descriptionUpdate);
      logger.info('Description update successful');

      const successResponse = { 
        success: true, 
        description: response
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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    logger.info('Manual context update request:', body);
    const { userId, organisationDescription, organisationUrl, organisationName } = body;
    
    if (!userId) {
      logger.error('Missing userId parameter');
      return NextResponse.json({ 
        success: false, 
        error: "Missing required parameters" 
      }, { status: 400 });
    }

    const updateData: any = {};

    // Update organization URL if provided (even if empty string)
    if (organisationUrl !== undefined) { 
      updateData.organisationUrl = organisationUrl;
    }

    // Update organization name if provided (even if empty string)
    if (organisationName !== undefined) { 
      updateData.organisationName = organisationName;
    }

    // Update description if provided
    if (organisationDescription !== undefined) { 
      updateData.organisationDescription = organisationDescription;
      // Only mark as completed if description is provided and not empty
      updateData.organisationDescriptionCompleted = !!organisationDescription; 
    }

    if (Object.keys(updateData).length === 0) {
      logger.error('No update data provided');
      return NextResponse.json({ 
        success: false, 
        error: "No update data provided" 
      }, { status: 400 });
    }

    // Update the profile
    logger.info('Updating profile with manual data:', updateData);
    const updatedProfile = await updateProfile(userId, updateData);
    logger.info('Profile update successful');

    // Return the potentially updated fields
    return NextResponse.json({ 
      success: true,
      organisationUrl: updatedProfile[0].organisationUrl,
      organisationName: updatedProfile[0].organisationName,
      description: updatedProfile[0].organisationDescription // Ensure description is returned
    });
    
  } catch (error) {
    logger.error('Manual context update error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update context" 
    }, { status: 500 });
  }
} 