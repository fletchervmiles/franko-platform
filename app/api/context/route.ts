/**

 */

import { NextResponse } from "next/server";
import Exa from "exa-js";
import { updateProfile, getProfile } from "@/db/queries/profiles-queries";
import { 
  o3Model, 
  gemini25FlashPreviewModel // Import the new model
} from "@/ai_folder"; 
// import { google /*, GoogleGenerativeAIProviderOptions */ } from "@ai-sdk/google"; // (Disabled: replaced by wrapped model)
import fs from 'fs';
import path from 'path';
import { 
  generateObject, 
  generateText, // Import generateText
} from "ai"; 
import { z } from "zod";
import { logger } from "@/lib/logger";
import { createUserPersona } from "@/db/actions/user-personas-actions"; // Import persona creation action
import { sql } from 'drizzle-orm'; // Import sql tag
import { db } from '@/db/db'; // Ensure db is imported
import { getUserPersonas } from "@/db/queries/user-personas-queries"; // Import query function for logging
import { updateOnboardingStep } from '@/db/queries/user-onboarding-status-queries'; // <<<--- ADDED IMPORT

// Maximum timeout values for Vercel Pro/Enterprise plan
export const maxDuration = 300; // 
export const dynamic = 'force-dynamic';
// Disable caching completely to avoid any issues
export const fetchCache = 'force-no-store';
export const revalidate = 0;
export const runtime = 'nodejs';

// Process timeout handling middleware for additional protection
async function withTimeoutHandling(fn: () => Promise<NextResponse>) {
  // Track execution time
  const startTime = Date.now();
  logger.info('Context generation started at:', new Date().toISOString());
  
  try {
    // Create a promise that resolves with the result
    const fnPromise = fn();
    
    // Also create a timeout promise - as additional safety
    const timeoutPromise = new Promise((_, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        reject(new Error('Internal function timeout - approaching Vercel limit'));
      }, 900 * 1000); // 15 min internal timeout (shorter than Vercel's)
    });
    
    // Race the function against our internal timeout
    const result = await Promise.race([fnPromise, timeoutPromise]) as NextResponse;
    
    const duration = Date.now() - startTime;
    logger.info(`Context generation completed successfully in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Context generation error after ${duration}ms:`, error);
    
    // Return a friendly error response instead of throwing
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred",
      timeoutDetails: {
        duration: `${duration}ms`,
        maxDuration: `${maxDuration}s`,
        recommendation: "This operation is timing out. Try with a smaller website or contact support."
      }
    }, { status: 500 });
  }
}

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

// Helper function to load the input signal prompt
function loadInputSignalPrompt() {
  try {
    const promptPath = path.join(process.cwd(), 'agent_prompts', 'input_signal.md');
    return fs.readFileSync(promptPath, 'utf-8');
  } catch (error) {
    console.error('Error loading input signal prompt:', error);
    throw new Error('Failed to load input signal prompt');
  }
}

// Zod schema for the input signal JSON output
const inputSignalSchema = z.object({
  customerRoles: z.array(z.object({
    title: z.string(),
    evidence: z.string()
  })).default([]), // Add default empty array
  featureMenu: z.array(z.object({
    name: z.string(),
    alias: z.string()
  })).default([]), // Add default empty array
  customerBenefitClaims: z.array(z.string()).default([]) // Add default empty array
});

const personaSchema = z.object({
  label: z.string(),
  description: z.string()
});

const generatedPersonasSchema = z.array(personaSchema);

// NEW: Schema for the generateObject call, wrapping the array
const personaOutputSchema = z.object({
  personas: generatedPersonasSchema.describe("Array of generated user personas")
});

type InputSignalData = z.infer<typeof inputSignalSchema>;
type GeneratedPersona = z.infer<typeof personaSchema>;

// Helper function to load the persona seed prompt
function loadPersonaSeedPrompt() {
  try {
    const promptPath = path.join(process.cwd(), 'agent_prompts', 'persona_seed.md');
    return fs.readFileSync(promptPath, 'utf-8');
  } catch (error) {
    console.error('Error loading persona seed prompt:', error);
    throw new Error('Failed to load persona seed prompt');
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

// Original POST implementation wrapped with timeout handling
async function handlePostRequest(request: Request) {
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

      const exaResults = await Promise.allSettled([
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
        })(),
        // --- NEW EXTRACTS START ---
        /* 04 */ exa.searchAndContents(`site:${organisationUrl} case study ${organisationName}`, {
          type: "keyword",
          text: { maxCharacters: 4000 }
        }),
        /* 05 */ exa.searchAndContents(`"${organisationName}" review`, {
          type: "neural",
          text: { maxCharacters: 3000 }
        }),
        /* 06 */ exa.searchAndContents(`Reddit "${organisationName}"`, {
          type: "keyword",
          text: { maxCharacters: 2500 }
        }),
        /* 07 */ exa.getContents([organisationUrl], {
          subpages: 8,
          subpage_target: ["docs", "integration", "quickstart"],
          text: { maxCharacters: 3000 }
        }),
        /* 08 */ exa.searchAndContents(`${organisationName} webinar OR YouTube talk`, {
          type: "neural",
          text: { maxCharacters: 3000 }
        }),
        /* 09 */ exa.getContents([organisationUrl], {
          subpages: 6,
          subpage_target: ["release", "changelog", "blog"],
          text: { maxCharacters: 2500 }
        }),
        /* 10 */ exa.searchAndContents(`"${organisationName}" "case study pdf"`, {
          type: "keyword",
          text: { maxCharacters: 3500 }
        }),
        /* 11 */ exa.searchAndContents(`"${organisationName}" pricing plans`, {
          type: "keyword",
          text: { maxCharacters: 2000 }
        })
        // --- NEW EXTRACTS END ---
      ]);

      clearTimeout(timeoutId);
      logger.info('All Exa requests completed');
      logger.info('[FLOW CHECK] Exa requests completed - proceeding to Input Signal generation');

      // Map results (correct typo)
      const [
        extract01Result, extract02Result, extract03Result,
        extract04Res, extract05Res, extract06Res,
        extract07Res, extract08Res, extract09Res,
        extract10Res, extract11Res
      ] = exaResults as PromiseSettledResult<any>[]; // Corrected typo
      
      const extract01 = extract01Result.status === 'fulfilled' ? extract01Result.value : null;
      const extract02 = extract02Result.status === 'fulfilled' ? extract02Result.value : null;
      const extract03 = extract03Result.status === 'fulfilled' ? extract03Result.value : null;
      const extract04 = extract04Res.status === 'fulfilled' ? extract04Res.value : null;
      const extract05 = extract05Res.status === 'fulfilled' ? extract05Res.value : null;
      const extract06 = extract06Res.status === 'fulfilled' ? extract06Res.value : null;
      const extract07 = extract07Res.status === 'fulfilled' ? extract07Res.value : null;
      const extract08 = extract08Res.status === 'fulfilled' ? extract08Res.value : null;
      const extract09 = extract09Res.status === 'fulfilled' ? extract09Res.value : null;
      const extract10 = extract10Res.status === 'fulfilled' ? extract10Res.value : null;
      const extract11 = extract11Res.status === 'fulfilled' ? extract11Res.value : null;
      
      // Log any failures but continue processing
      exaResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          logger.error(`Exa request ${index + 1} failed:`, {
            error: result.reason,
            timestamp: new Date().toISOString()
          });
        }
      });

      // If all requests failed, then error out
      if (!extract01 && !extract02 && !extract03 && !extract04 && !extract05 && !extract06 && !extract07 && !extract08 && !extract09 && !extract10 && !extract11) {
        throw new Error("All Exa requests failed");
      }
      
      // Log lengths of new extracts
      logger.info('Exa request 4-11 lengths', {
        e04: extract04 ? JSON.stringify(extract04).length : 0,
        e05: extract05 ? JSON.stringify(extract05).length : 0,
        e06: extract06 ? JSON.stringify(extract06).length : 0,
        e07: extract07 ? JSON.stringify(extract07).length : 0,
        e08: extract08 ? JSON.stringify(extract08).length : 0,
        e09: extract09 ? JSON.stringify(extract09).length : 0,
        e10: extract10 ? JSON.stringify(extract10).length : 0,
        e11: extract11 ? JSON.stringify(extract11).length : 0,
      });

      // --- Generate Input Signals --- 
      let rawInputSignalString: string = ""; // Store the raw string output
      const maxInputSignalRetries = 3;
      logger.info('Making Input Signal request (expecting Markdown/JSON) using gemini-2.5-flash-preview-04-17'); // Updated log
      logger.info('[FLOW CHECK] Starting Input Signal generation with Exa results');
      try {
        const inputSignalPromptTemplate = loadInputSignalPrompt();
        const filledInputSignalPrompt = inputSignalPromptTemplate
          .replace(/{organisation_name}/g, organisationName)
          .replace(/{organisation_url}/g, organisationUrl)
          .replace('{extract01}', JSON.stringify(extract01 || {}, null, 2))
          .replace('{extract02}', JSON.stringify(extract02 || {}, null, 2))
          .replace('{extract03}', JSON.stringify(extract03 || {}, null, 2))
          .replace('{extract04}', JSON.stringify(extract04 || {}, null, 2))
          .replace('{extract05}', JSON.stringify(extract05 || {}, null, 2))
          .replace('{extract06}', JSON.stringify(extract06 || {}, null, 2))
          .replace('{extract07}', JSON.stringify(extract07 || {}, null, 2))
          .replace('{extract08}', JSON.stringify(extract08 || {}, null, 2))
          .replace('{extract09}', JSON.stringify(extract09 || {}, null, 2))
          .replace('{extract10}', JSON.stringify(extract10 || {}, null, 2))
          .replace('{extract11}', JSON.stringify(extract11 || {}, null, 2));

        logger.info('Input Signal Prompt preparation:', { /* ... */ });

        let attempt = 1;
        for (attempt = 1; attempt <= maxInputSignalRetries; attempt++) {
          try {
            logger.info(`Input Signal attempt ${attempt}/${maxInputSignalRetries}`); // Log attempt
            const { text } = await generateText({
              model: gemini25FlashPreviewModel, 
              prompt: filledInputSignalPrompt,
              providerOptions: {
                google: { thinkingConfig: { thinkingBudget: 200 } } 
              } 
            });
            
            rawInputSignalString = text; // Store the raw text output
            // --- DEV ONLY LOG --- 
            if (process.env.NODE_ENV === 'development') {
              console.log("\n--- RAW INPUT SIGNAL STRING (DEV ONLY) ---");
              console.log(rawInputSignalString);
              console.log("--- END RAW INPUT SIGNAL STRING ---\n");
            }
            // --- END DEV ONLY LOG --- 
            logger.info('Input Signal text generation successful (raw). Length:', rawInputSignalString.length);
            logger.info('[FLOW CHECK] Input Signal generation completed, sample:', 
                       rawInputSignalString.substring(0, 200) + '...');
            break; // Success, exit retry loop

          } catch (error: any) {
            logger.error(`Input Signal attempt ${attempt} failed:`, { error: error?.message, finishReason: error?.finishReason, usage: error?.usage, textResponse: rawInputSignalString.substring(0, 500) }); // Log partial text on error
            console.error(`Input Signal attempt ${attempt} failed:`, error);
            if (attempt === maxInputSignalRetries) {
              logger.error('Failed to generate Input Signal text after multiple attempts. Using default empty string.');
              rawInputSignalString = ""; // Ensure empty string on final failure
            } else {
              // Optional: wait before retrying
              await new Promise(resolve => setTimeout(resolve, attempt * 1000)); 
            }
          }
        }
      } catch (promptLoadingError) {
        logger.error('Failed to load or prepare input signal prompt:', promptLoadingError);
      }
      // --- End Generate Input Signals ---
      
      // --- Generate Final Description using Context Setter --- 
      let description: string | undefined;
      const maxContextSetterRetries = 3;
      logger.info('Making Context Setter request using gemini-2.5-flash');
      logger.info('[FLOW CHECK] Starting Context Setter with Exa data and Input Signal');
      try {
         const contextSetterPromptTemplate = loadContextSetterPrompt();
         const filledContextSetterPrompt = contextSetterPromptTemplate
            .replace(/{organisation_name}/g, organisationName)
            .replace(/{organisation_url}/g, organisationUrl)
            .replace('{extract01}', JSON.stringify(extract01 || {}, null, 2))
            .replace('{extract02}', JSON.stringify(extract02 || {}, null, 2))
            .replace('{extract03}', JSON.stringify(extract03 || {}, null, 2))
            .replace('{extract04}', JSON.stringify(extract04 || {}, null, 2))
            .replace('{extract05}', JSON.stringify(extract05 || {}, null, 2))
            .replace('{extract06}', JSON.stringify(extract06 || {}, null, 2))
            .replace('{extract07}', JSON.stringify(extract07 || {}, null, 2))
            .replace('{extract08}', JSON.stringify(extract08 || {}, null, 2))
            .replace('{extract09}', JSON.stringify(extract09 || {}, null, 2))
            .replace('{extract10}', JSON.stringify(extract10 || {}, null, 2))
            .replace('{extract11}', JSON.stringify(extract11 || {}, null, 2))
            .replace('{input_signal_string}', rawInputSignalString); // Use the new placeholder
            
        logger.info('Context Setter Prompt preparation:', { /* ... */ });

        try {
          const attempt = 1; // Initialize attempt counter
          logger.info(`Context Setter attempt ${attempt}/${maxContextSetterRetries}`); // Log attempt 1
          const { text } = await generateText({
            prompt: filledContextSetterPrompt,
            model: gemini25FlashPreviewModel, 
            providerOptions: { 
              google: { 
                thinkingConfig: { thinkingBudget: 200 } 
              } 
            } as any 
          });
          description = text || "";
          if (!description.trim()) throw new Error("Generated description was empty");
          logger.info('[FLOW CHECK] Context Setter completed successfully, description sample:', 
                      description.substring(0, 200) + '...');
        } catch (error: any) {
          logger.error(`Context Setter generation failed:`, { error: error?.message, finishReason: error?.finishReason, usage: error?.usage });
          console.error(`Context Setter generation failed:`, error);
          // Throw error here as description is critical
          throw new Error("Failed to generate description");
        }
      } catch (promptLoadingError) {
        logger.error('Failed to load or prepare context setter prompt:', promptLoadingError);
        throw new Error("Failed to load context setter prompt, cannot proceed.");
      }

      if (!description) {
         // This state should be unreachable if error is thrown correctly above
         logger.error('Description is unexpectedly undefined after generation block.');
        throw new Error("Failed to generate description, cannot proceed.");
      }
      // --- End Generate Final Description --- 
      
      logger.info('Context Setter response:', { 
        descriptionLength: description.length,
        timestamp: new Date().toISOString()
      });

      // --- Generate and Save User Personas --- 
      logger.info('[FLOW REACHED] Entering block to check/generate personas...'); // Add this log
      // Check if user already has personas before attempting to generate new ones
      try {
        // First, execute a direct SQL query for debugging
        const rawResult = await db.execute(
          sql`SELECT id, persona_name FROM user_personas WHERE profile_user_id = ${userId}`
        );
        logger.info(`[PERSONA CHECK] Raw SQL query result:`, JSON.stringify(rawResult));

        const existingPersonas = await getUserPersonas(userId);
        logger.info(`[PERSONA CHECK] getUserPersonas found ${existingPersonas.length} personas:`, 
          JSON.stringify(existingPersonas.map(p => ({id: p.id, name: p.personaName}))));
        
        if (existingPersonas.length === 0) {
          logger.info('[PERSONA CHECK] No existing personas found, proceeding with generation');
          // Only generate personas if the user doesn't have any yet
          logger.info('No existing personas found. Starting User Persona generation using o3Model');
          logger.info('[FLOW CHECK] Starting Persona generation with Context description and Input Signal');
          let generatedPersonas: GeneratedPersona[] = [];
          
          const maxPersonaGenRetries = 3;
          try {
            const personaSeedPromptTemplate = loadPersonaSeedPrompt();
            const filledPersonaSeedPrompt = personaSeedPromptTemplate
              .replace(/ORGANISATION_NAME/g, organisationName) // Use regex global flag
              .replace('{context_overview_md}', description)
              .replace('{input_signal_string}', rawInputSignalString); // Use the new placeholder
            
            logger.info('Persona Seed Prompt preparation:', {
              promptLength: filledPersonaSeedPrompt.length,
              promptStart: filledPersonaSeedPrompt.substring(0, 500) + '...',
              promptEnd: '...' + filledPersonaSeedPrompt.substring(filledPersonaSeedPrompt.length - 500),
              timestamp: new Date().toISOString()
            });

            // --- Log the full prompt if in development (CAUTION: Can be very large) ---
            if (process.env.NODE_ENV === 'development') {
                // Create a temporary file path for the large prompt
                const tempPromptFilePath = path.join(process.cwd(), 'logs', `persona_prompt_${userId}_${Date.now()}.txt`);
                try {
                    // Ensure logs directory exists
                    const logDir = path.dirname(tempPromptFilePath);
                    if (!fs.existsSync(logDir)) {
                        fs.mkdirSync(logDir, { recursive: true });
                    }
                    // Write the full prompt to the file
                    fs.writeFileSync(tempPromptFilePath, filledPersonaSeedPrompt);
                    logger.info(`[PERSONA DEBUG] Full persona seed prompt saved to: ${tempPromptFilePath}`);
                } catch (writeError) {
                    logger.error(`[PERSONA DEBUG] Failed to write full persona prompt to file:`, writeError);
                    // Fallback: Log truncated prompt if file write fails
                    logger.info('[PERSONA DEBUG] Full persona seed prompt (truncated fallback):\n', filledPersonaSeedPrompt.substring(0, 2000) + '\n...');
                }
            }
            // --- End full prompt logging ---

            for (let attempt = 1; attempt <= maxPersonaGenRetries; attempt++) {
              try {
                logger.info(`Persona generation attempt ${attempt}/${maxPersonaGenRetries}`);
                const { object } = await generateObject({
                  model: o3Model, 
                  schema: personaOutputSchema, // Use the OBJECT schema here
                  prompt: filledPersonaSeedPrompt, 
                });
                // --- Log the raw object returned by generateObject --- 
                logger.info(`[PERSONA GEN RAW] Raw object returned from generateObject (attempt ${attempt}):`, JSON.stringify(object, null, 2));
                // --- End raw object log ---

                // Extract the array from the returned object
                generatedPersonas = object.personas; 
                // Basic validation: ensure it's actually an array before proceeding
                if (!Array.isArray(generatedPersonas)) {
                  logger.error('Persona generation returned invalid structure, expected array in object.personas', { object });
                  generatedPersonas = []; // Reset to empty array
                  throw new Error("Invalid persona structure received from AI"); // Force retry if needed
                }
                logger.info(`Persona generation successful. Generated ${generatedPersonas.length} personas.`);
                break; // Success
              } catch (aiError) {
                logger.error(`Persona generation attempt ${attempt} failed:`, aiError);
                if (attempt === maxPersonaGenRetries) {
                  logger.error('Failed to generate personas after multiple attempts. Skipping persona saving.');
                  generatedPersonas = []; // Ensure it's empty on final failure
                }
                await new Promise(resolve => setTimeout(resolve, attempt * 2000));
              }
            }
            
            // Save generated personas if any were created
            if (generatedPersonas.length > 0) {
                logger.info(`Attempting initial save of ${generatedPersonas.length} generated personas for user ${userId}...`);
  
                // Insert the newly generated personas. The check above ensures this only runs once.
                let savedCount = 0;
                for (const persona of generatedPersonas) {
                    try {
                        // Call the original action - the name constraint check inside is sufficient now
                        await createUserPersona(userId, persona.label, persona.description);
                        savedCount++;
                    } catch (dbError) {
                        // Log errors (duplicates are possible if AI generates same label twice)
                        logger.warn(`Failed to save persona "${persona.label}" for user ${userId}:`, 
                          dbError instanceof Error ? dbError.message : dbError);
                    }
                }
                logger.info(`Successfully saved ${savedCount} out of ${generatedPersonas.length} generated personas.`);
 
            } else {
                logger.info('No personas were generated or generation failed, skipping save step.');
            }
          } catch (promptLoadingError) {
            logger.error('Failed to load or prepare persona seed prompt:', promptLoadingError);
          }
        } else {
          // Skip persona generation if user already has personas
          logger.info(`[PERSONA CHECK] Found ${existingPersonas.length} existing personas, SKIPPING generation`);
          logger.info(`User ${userId} already has ${existingPersonas.length} personas defined. Skipping AI persona generation.`);
        }
      } catch (error) {
        logger.error(`[PERSONA CHECK] Error checking for existing personas:`, error);
        logger.error(`Error checking for existing personas for user ${userId}:`, error);
        logger.info('Skipping persona generation due to error checking existing personas.');
      }
      // --- End Generate and Save User Personas --- 

      // Second update: Update description after Exa/AI completes
      const descriptionUpdate = {
        organisationUrl: initialUpdate[0].organisationUrl,
        organisationName: initialUpdate[0].organisationName,
        organisationDescription: description,
        organisationDescriptionCompleted: true,
      };
      
      logger.info('Updating profile with description:', descriptionUpdate);
      await updateProfile(userId, descriptionUpdate);
      logger.info('Description update successful');

      // <<<--- ADDED ONBOARDING UPDATE for Step 1 --->>>
      await updateOnboardingStep(userId, 'step1ContextComplete');
      logger.info(`Updated onboarding step 1 (Context) for user ${userId}`);
      // <<<--- END ADDED ONBOARDING UPDATE --->>>

      const successResponse = { 
        success: true, 
        description: description
      };
      
      logger.info('Sending success response:', successResponse);
      return NextResponse.json(successResponse);

    } catch (error) {
      clearTimeout(timeoutId);
      // Even if Exa/AI fails, the URL and name update remains
      logger.error('Error in Exa/AI process:', {
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

// Original impl - no longer directly exported 
async function handlePatchRequest(request: Request) {
  const startTime = Date.now();
  logger.info('PATCH request to /api/context received');

  try {
    const body = await request.json();
    logger.info('PATCH request body:', body);
    
    const { userId, ...updateData } = body;

    if (!userId) {
      logger.warn('Missing userId in PATCH request to /api/context');
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
    }

    if (Object.keys(updateData).length === 0) {
      logger.warn('No update data provided in PATCH request', { userId });
      return NextResponse.json({ success: false, error: "No update data provided" }, { status: 400 });
    }

    // Validate updateData keys if necessary (optional)
    const allowedKeys = ['organisationUrl', 'organisationName', 'organisationDescription', 'inputSignal', 'logoUrl', 'buttonColor', 'titleColor'];
    for (const key in updateData) {
      if (!allowedKeys.includes(key)) {
        logger.warn(`Invalid field provided in PATCH request: ${key}`, { userId });
        // Decide whether to reject or ignore the invalid field
        // Rejecting for safety:
        return NextResponse.json({ success: false, error: `Invalid field: ${key}` }, { status: 400 });
      }
    }

    // Perform the update
    logger.info(`Updating profile for user ${userId} with data:`, updateData);
    const updatedProfile = await updateProfile(userId, updateData);
    const duration = Date.now() - startTime;
    logger.info(`Profile updated successfully for user ${userId} in ${duration}ms.`);

    // <<<--- ADDED ONBOARDING UPDATE for Step 1 --->>>
    // Check if organisationDescription was part of the successful update
    if ('organisationDescription' in updateData && updateData.organisationDescription) {
        await updateOnboardingStep(userId, 'step1ContextComplete');
        logger.info(`Updated onboarding step 1 (Context) via PATCH for user ${userId}`);
    }
    // <<<--- END ADDED ONBOARDING UPDATE --->>>

    return NextResponse.json({ success: true, profile: updatedProfile });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in PATCH /api/context:', { error, durationMs: duration });
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}

// These are the only exports
export async function POST(request: Request) {
  return withTimeoutHandling(() => handlePostRequest(request));
}

export async function PATCH(request: Request) {
  return withTimeoutHandling(() => handlePatchRequest(request));
} 